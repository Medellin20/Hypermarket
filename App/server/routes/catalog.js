import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { discountForProduct } from './pricing.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

function decorate(product, promos) {
  const discount = discountForProduct(product, promos);
  return {
    ...product,
    in_stock: product.stock > 0,
    discount_percent: discount,
    final_price: Math.round(product.price * (1 - discount / 100))
  };
}

router.get('/supermarkets', asyncHandler(async (_req, res) => {
  const { data: rows, error } = await supabase
    .from('supermarkets').select('*').eq('is_active', 1).order('rating', { ascending: false });
  if (error) throw error;
  await Promise.all(rows.map(async (row) => {
    const result = await supabase.from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supermarket_id', row.id).eq('is_active', 1);
    if (result.error) throw result.error;
    row.product_count = result.count;
  }));
  res.json(rows);
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  res.json(data);
}));

router.get('/promotions', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('promotions').select('*').eq('active', 1);
  if (error) throw error;
  res.json(data);
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { q, category, supermarket, min, max, brand, sort, in_stock } = req.query;
  const applyFilters = (query) => {
    query = query.eq('is_active', 1);
    if (category) query = query.eq('category_id', Number(category));
    if (supermarket) query = query.eq('supermarket_id', Number(supermarket));
    if (brand) query = query.eq('brand', brand);
    if (min) query = query.gte('price', Number(min));
    if (max) query = query.lte('price', Number(max));
    if (in_stock === '1') query = query.gt('stock', 0);
    return query;
  };

  let searchIds;
  if (q) {
    const searches = await Promise.all(['name', 'brand', 'description'].map((column) =>
      applyFilters(supabase.from('products').select('id')).ilike(column, `%${q}%`)
    ));
    for (const result of searches) if (result.error) throw result.error;
    searchIds = [...new Set(searches.flatMap(({ data }) => data.map(({ id }) => id)))];
    if (!searchIds.length) return res.json([]);
  }

  const order = sort === 'price_asc' ? ['price', true]
    : sort === 'price_desc' ? ['price', false]
      : sort === 'name' ? ['name', true] : ['created_at', false];
  let query = applyFilters(supabase.from('products').select(
    '*, category:categories(name, icon), supermarket:supermarkets(name, logo_color)'
  ));
  if (searchIds) query = query.in('id', searchIds);
  const { data, error } = await query.order(order[0], { ascending: order[1] });
  if (error) throw error;

  const rows = data.map((product) => ({
    ...product,
    category_name: product.category?.name ?? null,
    category_icon: product.category?.icon ?? null,
    supermarket_name: product.supermarket?.name ?? null,
    supermarket_color: product.supermarket?.logo_color ?? null
  }));
  const { data: promos, error: promoError } = await supabase.from('promotions')
    .select('*').eq('active', 1);
  if (promoError) throw promoError;
  res.json(rows.map((product) => decorate(product, promos)));
}));

router.get('/brands', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('products').select('brand')
    .not('brand', 'is', null).order('brand');
  if (error) throw error;
  res.json([...new Set(data.map(({ brand }) => brand))]);
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('products').select(
    '*, category:categories(name, icon), supermarket:supermarkets(name, logo_color)'
  ).eq('id', req.params.id).maybeSingle();
  if (error) throw error;
  const product = data && {
    ...data,
    category_name: data.category?.name ?? null,
    category_icon: data.category?.icon ?? null,
    supermarket_name: data.supermarket?.name ?? null,
    supermarket_color: data.supermarket?.logo_color ?? null
  };
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  const { data: promos, error: promoError } = await supabase.from('promotions')
    .select('*').eq('active', 1);
  if (promoError) throw promoError;
  res.json(decorate(product, promos));
}));

export default router;
