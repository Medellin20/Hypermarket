import { Router } from 'express';
import db from '../db/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import {
  bestDiscountForProduct, loyaltyBonusPercent,
  DELIVERY_FEES, creditsEarned
} from './pricing.js';
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

  try {
    const { orderId, earned } = await db.transaction(async (tx) => {
      let subtotal = 0;
      let discount = 0;
      const lines = [];

      for (const productId of [...quantities.keys()].sort((a, b) => a - b)) {
        const quantity = quantities.get(productId);
        const product = await tx.prepare(
          'SELECT * FROM products WHERE id = ? AND is_active = 1 FOR UPDATE'
        ).get(productId);
        if (!product) throw { code: 404, msg: `Produit ${productId} introuvable` };
        if (product.stock < quantity)
          throw { code: 409, msg: `Stock insuffisant pour « ${product.name} » (reste ${product.stock})` };

        const percent = await bestDiscountForProduct(product);
        const lineSubtotal = product.price * quantity;
        subtotal += lineSubtotal;
        discount += Math.round(lineSubtotal * percent / 100);
        lines.push({ product, quantity });
      }

      const loyaltyPercent = await loyaltyBonusPercent(req.user.id);
      const afterPromo = subtotal - discount;
      discount += Math.round(afterPromo * loyaltyPercent / 100);

      const deliveryFee = DELIVERY_FEES[delivery_type];
      const user = await tx.prepare('SELECT * FROM users WHERE id = ? FOR UPDATE').get(req.user.id);
      const creditsToUse = Math.max(0, Math.min(Number(use_credits) || 0, user.loyalty_credits));
      const beforeCredits = subtotal - discount + deliveryFee;
      const creditsUsed = Math.min(creditsToUse, beforeCredits);
      const total = beforeCredits - creditsUsed;

      const insertedOrder = await tx.prepare(
        `INSERT INTO orders
           (user_id, subtotal, discount, delivery_fee, credits_used, total,
            payment_method, payment_status, delivery_type, delivery_quarter, delivery_slot, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmee')`
      ).run(
        req.user.id, subtotal, discount, deliveryFee, creditsUsed, total,
        payment_method, payment_method === 'cash' ? 'en_attente' : 'paye',
        delivery_type, delivery_quarter || null, delivery_slot || null
      );
      const orderId = insertedOrder.lastInsertRowid;

      for (const { product, quantity } of lines) {
        await tx.prepare(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
           VALUES (?, ?, ?, ?, ?)`
        ).run(orderId, product.id, product.name, product.price, quantity);
        await tx.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
          .run(quantity, product.id);
      }

      const earned = creditsEarned(subtotal);
      await tx.prepare('UPDATE users SET loyalty_credits = loyalty_credits - ? + ? WHERE id = ?')
        .run(creditsUsed, earned, req.user.id);
      await tx.prepare(
        `INSERT INTO notifications (user_id, title, body, type)
         VALUES (?, ?, ?, 'order')`
      ).run(
        req.user.id,
        `Commande #${orderId} confirmée ✅`,
        `Total : ${total.toLocaleString('fr-FR')} FCFA. Vous avez gagné ${earned} crédits fidélité.`
      );
      return { orderId, earned };
    })();

    res.status(201).json({ order: await fullOrder(orderId), credits_earned: earned });
  } catch (error) {
    if (Number.isInteger(error.code) && error.code >= 400 && error.code < 600)
      return res.status(error.code).json({ error: error.msg });
    throw error;
  }
}));

async function fullOrder(id) {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return order;
}

router.get('/', auth, asyncHandler(async (req, res) => {
  const orders = await db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  await Promise.all(orders.map(async (order) => {
    order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }));
  res.json(orders);
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const order = await fullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Accès refusé' });
  res.json(order);
}));

router.post('/:id/cancel', auth, asyncHandler(async (req, res) => {
  const result = await db.transaction(async (tx) => {
    const order = await tx.prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE').get(req.params.id);
    if (!order) return { status: 404, error: 'Commande introuvable' };
    if (order.user_id !== req.user.id) return { status: 403, error: 'Accès refusé' };
    if (['en_livraison', 'livree', 'annulee'].includes(order.status))
      return { status: 409, error: 'Cette commande ne peut plus être annulée' };

    const orderItems = await tx.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of orderItems) {
      await tx.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }
    await tx.prepare("UPDATE orders SET status = 'annulee' WHERE id = ?").run(order.id);
    await tx.prepare(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES (?, ?, 'Votre commande a été annulée et le stock restauré.', 'order')`
    ).run(order.user_id, `Commande #${order.id} annulée`);
    return { orderId: order.id };
  })();
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(await fullOrder(result.orderId));
}));

router.patch('/:id/status', auth, adminOnly, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (![...STATUS_FLOW, 'annulee'].includes(status))
    return res.status(400).json({ error: 'Statut invalide' });
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });

  await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order.id);
  if (status === 'livree')
    await db.prepare("UPDATE orders SET payment_status = 'paye' WHERE id = ?").run(order.id);

  const labels = {
    confirmee: 'confirmée', en_preparation: 'en préparation',
    en_livraison: 'en cours de livraison', livree: 'livrée', annulee: 'annulée'
  };
  await db.prepare(
    `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, 'order')`
  ).run(order.user_id, `Commande #${order.id} : ${labels[status] || status}`,
    'Le statut de votre commande a été mis à jour.');

  res.json(await fullOrder(order.id));
}));

export default router;
