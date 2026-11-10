import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();
const PAYMENT_METHODS = ['momo_mtn', 'moov', 'celtiis', 'cash', 'crypto_btc', 'carte'];
const DELIVERY_TYPES = ['standard', 'express', 'retrait'];
const STATUS_FLOW = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree'];

router.post('/', auth, asyncHandler(async (req, res) => {
  const {
    items, payment_method, delivery_type = 'standard',
    delivery_quarter, delivery_slot, use_credits = 0
  } = req.body;

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Le panier est vide' });
  if (!PAYMENT_METHODS.includes(payment_method))
    return res.status(400).json({ error: 'Moyen de paiement invalide' });
  if (!DELIVERY_TYPES.includes(delivery_type))
    return res.status(400).json({ error: 'Mode de livraison invalide' });

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(productId) || productId <= 0 ||
        !Number.isSafeInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Produit ou quantité invalide' });
    }
    const totalQuantity = (quantities.get(productId) || 0) + quantity;
    if (!Number.isSafeInteger(totalQuantity))
      return res.status(400).json({ error: 'Quantité invalide' });
    quantities.set(productId, totalQuantity);
  }

  const { data: result, error } = await supabase.rpc('create_order', {
    p_user_id: req.user.id,
    p_items: [...quantities].map(([product_id, quantity]) => ({ product_id, quantity })),
    p_payment_method: payment_method,
    p_delivery_type: delivery_type,
    p_delivery_quarter: delivery_quarter || null,
    p_delivery_slot: delivery_slot || null,
    p_use_credits: Number(use_credits) || 0
  });
  if (error) {
    if (error.code === 'P1001') return res.status(404).json({ error: error.message });
    if (error.code === 'P1002') return res.status(409).json({ error: error.message });
    throw error;
  }

  res.status(201).json({
    order: await fullOrder(result.orderId),
    credits_earned: result.earned
  });
}));

async function fullOrder(id) {
  const { data, error } = await supabase.from('orders')
    .select('*, items:order_items(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

router.get('/', auth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('orders')
    .select('*, items:order_items(*)').eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const order = await fullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Accès refusé' });
  res.json(order);
}));

router.post('/:id/cancel', auth, asyncHandler(async (req, res) => {
  const { data: result, error } = await supabase.rpc('cancel_order', {
    p_order_id: req.params.id,
    p_user_id: req.user.id
  });
  if (error) throw error;
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(await fullOrder(result.orderId));
}));

router.patch('/:id/status', auth, adminOnly, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (![...STATUS_FLOW, 'annulee'].includes(status))
    return res.status(400).json({ error: 'Statut invalide' });

  const { data: order, error: lookupError } = await supabase.from('orders')
    .select('*').eq('id', req.params.id).maybeSingle();
  if (lookupError) throw lookupError;
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  const updates = { status };
  if (status === 'livree') updates.payment_status = 'paye';
  const { error: updateError } = await supabase.from('orders').update(updates).eq('id', order.id);
  if (updateError) throw updateError;

  const labels = {
    confirmee: 'confirmée', en_preparation: 'en préparation',
    en_livraison: 'en cours de livraison', livree: 'livrée', annulee: 'annulée'
  };
  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: order.user_id,
    title: `Commande #${order.id} : ${labels[status] || status}`,
    body: 'Le statut de votre commande a été mis à jour.',
    type: 'order'
  });
  if (notificationError) throw notificationError;
  res.json(await fullOrder(order.id));
}));

export default router;
