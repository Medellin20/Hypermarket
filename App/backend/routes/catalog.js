import { Router } from 'express';
import db from '../db/database.js';
import { bestDiscountForProduct } from './pricing.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

async function decorate(product) {
  const discount = await bestDiscountForProduct(product);
  return {
    ...product,
    in_stock: product.stock > 0,
    discount_percent: discount,
    final_price: Math.round(product.price * (1 - discount / 100))
  };
}

router.get('/supermarkets', asyncHandler(async (_req, res) => {
  const rows = await db.prepare(
    `SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.supermarket_id = s.id AND p.is_active = 1) AS product_count
     FROM supermarkets s WHERE s.is_active = 1 ORDER BY s.rating DESC`
  ).all();
  res.json(rows);
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM categories ORDER BY name').all());
}));

router.get('/promotions', asyncHandler(async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM promotions WHERE active = 1').all());
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { q, category, supermarket, min, max, brand, sort, in_stock } = req.query;
  const where = ['p.is_active = 1'];
  const params = {};

  if (q) { where.push('(p.name ILIKE @q OR p.brand ILIKE @q OR p.description ILIKE @q)'); params.q = `%${q}%`; }
  if (category) { where.push('p.category_id = @category'); params.category = Number(category); }
  if (supermarket) { where.push('p.supermarket_id = @supermarket'); params.supermarket = Number(supermarket); }
  if (brand) { where.push('p.brand = @brand'); params.brand = brand; }
  if (min) { where.push('p.price >= @min'); params.min = Number(min); }
  if (max) { where.push('p.price <= @max'); params.max = Number(max); }
  if (in_stock === '1') where.push('p.stock > 0');

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'name') orderBy = 'p.name ASC';

  const rows = await db.prepare(
    `SELECT p.*, c.name AS category_name, c.icon AS category_icon,
            s.name AS supermarket_name, s.logo_color AS supermarket_color
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN supermarkets s ON s.id = p.supermarket_id
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}`
  ).all(params);

  res.json(await Promise.all(rows.map(decorate)));
}));

router.get('/brands', asyncHandler(async (_req, res) => {
  const rows = await db.prepare(
    'SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand'
  ).all();
  res.json(rows.map((row) => row.brand));
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await db.prepare(
    `SELECT p.*, c.name AS category_name, c.icon AS category_icon,
            s.name AS supermarket_name, s.logo_color AS supermarket_color
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN supermarkets s ON s.id = p.supermarket_id
     WHERE p.id = ?`
  ).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(await decorate(product));
}));

export default router;
