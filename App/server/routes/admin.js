import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();
router.use(auth, adminOnly);

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  res.json(data);
}));

router.get('/orders', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('orders')
    .select('*, client:users!orders_user_id_fkey(full_name, phone), items:order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data.map(({ client, ...order }) => ({
    ...order,
    client_name: client?.full_name ?? null,
    client_phone: client?.phone ?? null
  })));
}));

router.get('/products', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('products')
    .select('*, category:categories(name), supermarket:supermarkets(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data.map(({ category, supermarket, ...product }) => ({
    ...product,
    category_name: category?.name ?? null,
    supermarket_name: supermarket?.name ?? null
  })));
}));

router.post('/products', asyncHandler(async (req, res) => {
  const { supermarket_id, category_id, name, brand, description, price, unit, stock, image_emoji } = req.body;
  if (!name || !price || !supermarket_id)
    return res.status(400).json({ error: 'Nom, prix et supermarché requis' });
  const { data, error } = await supabase.from('products').insert({
    supermarket_id, category_id: category_id || null, name, brand: brand || null,
    description: description || null, price, unit: unit || 'unité',
    stock: stock || 0, image_emoji: image_emoji || '🛒'
  }).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.patch('/products/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'brand', 'description', 'price', 'unit', 'stock', 'image_emoji', 'category_id', 'is_active'];
  const updates = Object.fromEntries(allowed.filter((key) => key in req.body)
    .map((key) => [key, key === 'is_active' ? (req.body[key] ? 1 : 0) : req.body[key]]));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  const { data, error } = await supabase.from('products').update(updates)
    .eq('id', req.params.id).select().maybeSingle();
  if (error) throw error;
  res.json(data);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('products').update({ is_active: 0 }).eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

router.post('/supermarkets', asyncHandler(async (req, res) => {
  const { name, address, quarter, hours, logo_color } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Nom et adresse requis' });
  const { data, error } = await supabase.from('supermarkets').insert({
    name, address, quarter: quarter || null, hours: hours || null,
    logo_color: logo_color || '#1F4D3A'
  }).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.get('/promotions', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('promotions')
    .select('*').order('id', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

router.post('/promotions', asyncHandler(async (req, res) => {
  const { name, percent, scope, scope_id } = req.body;
  if (!name || !percent) return res.status(400).json({ error: 'Nom et pourcentage requis' });
  const { data, error } = await supabase.from('promotions').insert({
    name, percent, scope: scope || 'global', scope_id: scope_id || null
  }).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.patch('/promotions/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('promotions')
    .update({ active: req.body.active ? 1 : 0 }).eq('id', req.params.id).select().maybeSingle();
  if (error) throw error;
  res.json(data);
}));

export default router;
