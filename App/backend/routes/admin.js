import { Router } from 'express';
import db from '../db/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();
router.use(auth, adminOnly);

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const queries = [
    `SELECT COALESCE(SUM(total), 0) AS v FROM orders WHERE status != 'annulee'`,
    'SELECT COUNT(*) AS v FROM orders',
    `SELECT COUNT(*) AS v FROM orders WHERE status IN ('en_attente','confirmee','en_preparation','en_livraison')`,
    `SELECT COUNT(*) AS v FROM users WHERE role = 'client'`,
    'SELECT COUNT(*) AS v FROM products WHERE is_active = 1',
    'SELECT COUNT(*) AS v FROM products WHERE stock = 0 AND is_active = 1'
  ];
  const [revenue, orders, pending, clients, products, outOfStock] = await Promise.all(
    queries.map((sql) => db.prepare(sql).get())
  );
  const [byStatus, topProducts, recentOrders] = await Promise.all([
    db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all(),
    db.prepare(
      `SELECT product_name, SUM(quantity) AS qty
       FROM order_items GROUP BY product_name ORDER BY qty DESC LIMIT 5`
    ).all(),
    db.prepare(
      `SELECT o.*, u.full_name AS client_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    ).all()
  ]);

  res.json({
    stats: {
      revenue: revenue.v, orders: orders.v, pending: pending.v,
      clients: clients.v, products: products.v, outOfStock: outOfStock.v
    },
    byStatus, topProducts, recentOrders
  });
}));

router.get('/orders', asyncHandler(async (_req, res) => {
  const orders = await db.prepare(
    `SELECT o.*, u.full_name AS client_name, u.phone AS client_phone
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  ).all();
  await Promise.all(orders.map(async (order) => {
    order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }));
  res.json(orders);
}));

router.get('/products', asyncHandler(async (_req, res) => {
  res.json(await db.prepare(
    `SELECT p.*, c.name AS category_name, s.name AS supermarket_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN supermarkets s ON s.id = p.supermarket_id
     ORDER BY p.created_at DESC`
  ).all());
}));

router.post('/products', asyncHandler(async (req, res) => {
  const { supermarket_id, category_id, name, brand, description, price, unit, stock, image_emoji } = req.body;
  if (!name || !price || !supermarket_id)
    return res.status(400).json({ error: 'Nom, prix et supermarché requis' });
  const result = await db.prepare(
    `INSERT INTO products (supermarket_id, category_id, name, brand, description, price, unit, stock, image_emoji)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(supermarket_id, category_id || null, name, brand || null, description || null,
    price, unit || 'unité', stock || 0, image_emoji || '🛒');
  res.status(201).json(await db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid));
}));

router.patch('/products/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'brand', 'description', 'price', 'unit', 'stock', 'image_emoji', 'category_id', 'is_active'];
  const fields = [];
  const params = {};
  for (const key of allowed) {
    if (key in req.body) {
      fields.push(`${key} = @${key}`);
      params[key] = key === 'is_active' ? (req.body[key] ? 1 : 0) : req.body[key];
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  params.id = Number(req.params.id);
  await db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = @id`).run(params);
  res.json(await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

router.post('/supermarkets', asyncHandler(async (req, res) => {
  const { name, address, quarter, hours, logo_color } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Nom et adresse requis' });
  const result = await db.prepare(
    `INSERT INTO supermarkets (name, address, quarter, hours, logo_color)
     VALUES (?, ?, ?, ?, ?)`
  ).run(name, address, quarter || null, hours || null, logo_color || '#1F4D3A');
  res.status(201).json(await db.prepare('SELECT * FROM supermarkets WHERE id = ?').get(result.lastInsertRowid));
}));

router.get('/promotions', asyncHandler(async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM promotions ORDER BY id DESC').all());
}));

router.post('/promotions', asyncHandler(async (req, res) => {
  const { name, percent, scope, scope_id } = req.body;
  if (!name || !percent) return res.status(400).json({ error: 'Nom et pourcentage requis' });
  const result = await db.prepare(
    'INSERT INTO promotions (name, percent, scope, scope_id) VALUES (?, ?, ?, ?)'
  ).run(name, percent, scope || 'global', scope_id || null);
  res.status(201).json(await db.prepare('SELECT * FROM promotions WHERE id = ?').get(result.lastInsertRowid));
}));

router.patch('/promotions/:id', asyncHandler(async (req, res) => {
  const { active } = req.body;
  await db.prepare('UPDATE promotions SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
  res.json(await db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id));
}));

export default router;
