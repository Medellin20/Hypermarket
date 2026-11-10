import { supabase, supabaseAuth } from '../../../server/db/supabase.js';
import { discountForProduct } from '../../../server/pricing.js';

const PAYMENT_METHODS = ['momo_mtn', 'moov', 'celtiis', 'cash', 'crypto_btc', 'carte'];
const DELIVERY_TYPES = ['standard', 'express', 'retrait'];
const ORDER_STATUSES = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee'];
const PRODUCT_FIELDS = ['name', 'brand', 'description', 'price', 'unit', 'stock', 'image_emoji', 'category_id', 'is_active'];

const json = (body, status = 200) => Response.json(body, { status });
const failed = (error) => {
  console.error(error);
  return json({ error: 'Erreur serveur' }, 500);
};

async function bodyOf(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function currentUser(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return { response: json({ error: 'Authentification requise' }, 401) };

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError?.status === 401 || authError?.status === 403)
    return { response: json({ error: 'Token invalide ou expiré' }, 401) };
  if (authError) throw authError;
  if (!authData.user?.email)
    return { response: json({ error: 'Token invalide ou expiré' }, 401) };

  const { data: user, error } = await supabase.from('users')
    .select('id, full_name, email, phone, role, loyalty_credits')
    .eq('auth_user_id', authData.user.id).maybeSingle();
  if (error) throw error;
  if (!user) return { response: json({ error: 'Compte HyperMarket introuvable' }, 401) };
  return { user };
}

async function authorizedUser(request, admin = false) {
  const result = await currentUser(request);
  if (result.response) return result;
  if (admin && result.user.role !== 'admin')
    return { response: json({ error: 'Accès réservé aux administrateurs' }, 403) };
  return result;
}

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    loyalty_credits: user.loyalty_credits
  };
}

function decorate(product, promotions) {
  const discount = discountForProduct(product, promotions);
  return {
    ...product,
    in_stock: product.stock > 0,
    discount_percent: discount,
    final_price: Math.round(product.price * (1 - discount / 100))
  };
}

async function fullOrder(id) {
  const { data, error } = await supabase.from('orders')
    .select('*, items:order_items(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function handleRegister(request) {
  const input = await bodyOf(request);
  if (!input) return json({ error: 'Corps JSON invalide' }, 400);
  const { full_name, email, phone, password } = input;
  if (!full_name || !email || !password)
    return json({ error: 'Nom, email et mot de passe requis' }, 400);
  if (password.length < 8)
    return json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);

  const { data: exists, error: lookupError } = await supabase
    .from('users').select('id').eq('email', email).maybeSingle();
  if (lookupError) throw lookupError;
  if (exists) return json({ error: 'Cet email est déjà utilisé' }, 409);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  });
  if (authError) {
    if (authError.code === 'email_exists')
      return json({ error: 'Cet email est déjà utilisé' }, 409);
    throw authError;
  }

  let user;
  try {
    const userResult = await supabase.from('users').insert({
      auth_user_id: authData.user.id,
      full_name,
      email,
      phone: phone || null,
      role: 'client'
    }).select('id, full_name, email, phone, role, loyalty_credits').single();
    if (userResult.error) throw userResult.error;
    user = userResult.data;

    const notificationResult = await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Bienvenue 🎉',
      body: 'Votre compte HyperMarket Cotonou est prêt.',
      type: 'info'
    });
    if (notificationResult.error) throw notificationResult.error;
  } catch (error) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(authData.user.id);
    if (cleanupError) console.error('Échec du nettoyage du compte Supabase Auth :', cleanupError);
    if (error.code === '23505')
      return json({ error: 'Cet email est déjà utilisé' }, 409);
    throw error;
  }

  const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  if (sessionError) throw sessionError;
  return json({ token: sessionData.session.access_token, user: publicUser(user) }, 201);
}

async function handleLogin(request) {
  const input = await bodyOf(request);
  if (!input) return json({ error: 'Corps JSON invalide' }, 400);
  const { email, password } = input;
  const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  if (sessionError?.code === 'invalid_credentials' || sessionError?.status === 400)
    return json({ error: 'Email ou mot de passe incorrect' }, 401);
  if (sessionError) throw sessionError;

  const { data: user, error } = await supabase.from('users')
    .select('id, full_name, email, phone, role, loyalty_credits')
    .eq('auth_user_id', sessionData.user.id).maybeSingle();
  if (error) throw error;
  if (!user) return json({ error: 'Compte à réactiver auprès du support' }, 403);
  return json({ token: sessionData.session.access_token, user: publicUser(user) });
}

async function catalogGet(path, request) {
  const url = new URL(request.url);

  if (path === 'supermarkets') {
    const { data, error } = await supabase.from('supermarkets').select('*')
      .eq('is_active', 1).order('rating', { ascending: false });
    if (error) throw error;
    await Promise.all(data.map(async (supermarket) => {
      const result = await supabase.from('products').select('id', { count: 'exact', head: true })
        .eq('supermarket_id', supermarket.id).eq('is_active', 1);
      if (result.error) throw result.error;
      supermarket.product_count = result.count;
    }));
    return json(data);
  }

  if (path === 'categories') {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return json(data);
  }

  if (path === 'promotions') {
    const { data, error } = await supabase.from('promotions').select('*').eq('active', 1);
    if (error) throw error;
    return json(data);
  }

  if (path === 'brands') {
    const { data, error } = await supabase.from('products').select('brand')
      .not('brand', 'is', null).order('brand');
    if (error) throw error;
    return json([...new Set(data.map(({ brand }) => brand))]);
  }

  if (path === 'products') {
    const { q, category, supermarket, min, max, brand, sort, in_stock } = Object.fromEntries(url.searchParams);
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
      if (!searchIds.length) return json([]);
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

    const { data: promotions, error: promotionError } = await supabase.from('promotions')
      .select('*').eq('active', 1);
    if (promotionError) throw promotionError;
    return json(data.map((product) => decorate({
      ...product,
      category_name: product.category?.name ?? null,
      category_icon: product.category?.icon ?? null,
      supermarket_name: product.supermarket?.name ?? null,
      supermarket_color: product.supermarket?.logo_color ?? null
    }, promotions)));
  }

  const productMatch = path.match(/^products\/([^/]+)$/);
  if (productMatch) {
    const { data, error } = await supabase.from('products').select(
      '*, category:categories(name, icon), supermarket:supermarkets(name, logo_color)'
    ).eq('id', productMatch[1]).maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Produit introuvable' }, 404);
    const { data: promotions, error: promotionError } = await supabase.from('promotions')
      .select('*').eq('active', 1);
    if (promotionError) throw promotionError;
    return json(decorate({
      ...data,
      category_name: data.category?.name ?? null,
      category_icon: data.category?.icon ?? null,
      supermarket_name: data.supermarket?.name ?? null,
      supermarket_color: data.supermarket?.logo_color ?? null
    }, promotions));
  }

  return null;
}

async function adminGet(path) {
  if (path === 'admin/dashboard') {
    const { data, error } = await supabase.rpc('admin_dashboard_stats');
    if (error) throw error;
    return json(data);
  }
  if (path === 'admin/orders') {
    const { data, error } = await supabase.from('orders')
      .select('*, client:users!orders_user_id_fkey(full_name, phone), items:order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return json(data.map(({ client, ...order }) => ({
      ...order,
      client_name: client?.full_name ?? null,
      client_phone: client?.phone ?? null
    })));
  }
  if (path === 'admin/products') {
    const { data, error } = await supabase.from('products')
      .select('*, category:categories(name), supermarket:supermarkets(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return json(data.map(({ category, supermarket, ...product }) => ({
      ...product,
      category_name: category?.name ?? null,
      supermarket_name: supermarket?.name ?? null
    })));
  }
  if (path === 'admin/promotions') {
    const { data, error } = await supabase.from('promotions')
      .select('*').order('id', { ascending: false });
    if (error) throw error;
    return json(data);
  }
  return null;
}

async function handleGet(request, segments) {
  const path = segments.join('/');
  if (path === 'health')
    return json({ status: 'ok', service: 'HyperMarket Cotonou API' });

  const catalog = await catalogGet(path, request);
  if (catalog) return catalog;

  if (path === 'auth/me') {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const { data: addresses, error } = await supabase.from('addresses')
      .select('*').eq('user_id', result.user.id);
    if (error) throw error;
    return json({ user: publicUser(result.user), addresses });
  }

  if (path === 'notifications' || path === 'notifications/unread-count') {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    if (path.endsWith('unread-count')) {
      const { count, error } = await supabase.from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', result.user.id).eq('is_read', 0);
      if (error) throw error;
      return json({ count });
    }
    const { data, error } = await supabase.from('notifications').select('*')
      .eq('user_id', result.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return json(data);
  }

  if (path === 'orders' || path.startsWith('orders/')) {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    if (path === 'orders') {
      const { data, error } = await supabase.from('orders')
        .select('*, items:order_items(*)').eq('user_id', result.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(data);
    }
    const match = path.match(/^orders\/([^/]+)$/);
    if (!match) return null;
    const order = await fullOrder(match[1]);
    if (!order) return json({ error: 'Commande introuvable' }, 404);
    if (order.user_id !== result.user.id && result.user.role !== 'admin')
      return json({ error: 'Accès refusé' }, 403);
    return json(order);
  }

  if (path.startsWith('admin/')) {
    const result = await authorizedUser(request, true);
    if (result.response) return result.response;
    return adminGet(path);
  }
  return null;
}

async function handlePost(request, segments) {
  const path = segments.join('/');
  if (path === 'auth/register') return handleRegister(request);
  if (path === 'auth/login') return handleLogin(request);

  if (path === 'auth/addresses') {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const input = await bodyOf(request);
    if (!input) return json({ error: 'Corps JSON invalide' }, 400);
    const { label, quarter, details, is_default } = input;
    if (!label || !quarter) return json({ error: 'Libellé et quartier requis' }, 400);
    const { data, error } = await supabase.rpc('add_user_address', {
      p_user_id: result.user.id,
      p_label: label,
      p_quarter: quarter,
      p_details: details || null,
      p_is_default: Boolean(is_default)
    });
    if (error) throw error;
    return json(data, 201);
  }

  if (path === 'orders') {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const input = await bodyOf(request);
    if (!input) return json({ error: 'Corps JSON invalide' }, 400);
    const {
      items, payment_method, delivery_type = 'standard',
      delivery_quarter, delivery_slot, use_credits = 0
    } = input;
    if (!Array.isArray(items) || items.length === 0)
      return json({ error: 'Le panier est vide' }, 400);
    if (!PAYMENT_METHODS.includes(payment_method))
      return json({ error: 'Moyen de paiement invalide' }, 400);
    if (!DELIVERY_TYPES.includes(delivery_type))
      return json({ error: 'Mode de livraison invalide' }, 400);

    const quantities = new Map();
    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      if (!Number.isSafeInteger(productId) || productId <= 0 ||
          !Number.isSafeInteger(quantity) || quantity <= 0)
        return json({ error: 'Produit ou quantité invalide' }, 400);
      const totalQuantity = (quantities.get(productId) || 0) + quantity;
      if (!Number.isSafeInteger(totalQuantity))
        return json({ error: 'Quantité invalide' }, 400);
      quantities.set(productId, totalQuantity);
    }

    const { data, error } = await supabase.rpc('create_order', {
      p_user_id: result.user.id,
      p_items: [...quantities].map(([product_id, quantity]) => ({ product_id, quantity })),
      p_payment_method: payment_method,
      p_delivery_type: delivery_type,
      p_delivery_quarter: delivery_quarter || null,
      p_delivery_slot: delivery_slot || null,
      p_use_credits: Number(use_credits) || 0
    });
    if (error) {
      if (error.code === 'P1001') return json({ error: error.message }, 404);
      if (error.code === 'P1002') return json({ error: error.message }, 409);
      throw error;
    }
    return json({
      order: await fullOrder(data.orderId),
      credits_earned: data.earned
    }, 201);
  }

  const cancelMatch = path.match(/^orders\/([^/]+)\/cancel$/);
  if (cancelMatch) {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: cancelMatch[1],
      p_user_id: result.user.id
    });
    if (error) throw error;
    if (data.error) return json({ error: data.error }, data.status);
    return json(await fullOrder(data.orderId));
  }

  const notificationReadMatch = path.match(/^notifications\/([^/]+)\/read$/);
  if (notificationReadMatch) {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const { error } = await supabase.from('notifications').update({ is_read: 1 })
      .eq('id', notificationReadMatch[1]).eq('user_id', result.user.id);
    if (error) throw error;
    return json({ ok: true });
  }

  if (path === 'notifications/read-all') {
    const result = await authorizedUser(request);
    if (result.response) return result.response;
    const { error } = await supabase.from('notifications').update({ is_read: 1 })
      .eq('user_id', result.user.id);
    if (error) throw error;
    return json({ ok: true });
  }

  const adminUser = path.startsWith('admin/') ? await authorizedUser(request, true) : null;
  if (adminUser?.response) return adminUser.response;
  if (path === 'admin/products') {
    const input = await bodyOf(request);
    if (!input) return json({ error: 'Corps JSON invalide' }, 400);
    const { supermarket_id, category_id, name, brand, description, price, unit, stock, image_emoji } = input;
    if (!name || !price || !supermarket_id)
      return json({ error: 'Nom, prix et supermarché requis' }, 400);
    const { data, error } = await supabase.from('products').insert({
      supermarket_id, category_id: category_id || null, name, brand: brand || null,
      description: description || null, price, unit: unit || 'unité',
      stock: stock || 0, image_emoji: image_emoji || '🛒'
    }).select().single();
    if (error) throw error;
    return json(data, 201);
  }

  if (path === 'admin/supermarkets') {
    const input = await bodyOf(request);
    if (!input) return json({ error: 'Corps JSON invalide' }, 400);
    const { name, address, quarter, hours, logo_color } = input;
    if (!name || !address) return json({ error: 'Nom et adresse requis' }, 400);
    const { data, error } = await supabase.from('supermarkets').insert({
      name, address, quarter: quarter || null, hours: hours || null,
      logo_color: logo_color || '#1F4D3A'
    }).select().single();
    if (error) throw error;
    return json(data, 201);
  }

  if (path === 'admin/promotions') {
    const input = await bodyOf(request);
    if (!input) return json({ error: 'Corps JSON invalide' }, 400);
    const { name, percent, scope, scope_id } = input;
    if (!name || !percent) return json({ error: 'Nom et pourcentage requis' }, 400);
    const { data, error } = await supabase.from('promotions').insert({
      name, percent, scope: scope || 'global', scope_id: scope_id || null
    }).select().single();
    if (error) throw error;
    return json(data, 201);
  }
  return null;
}

async function handlePatch(request, segments) {
  const path = segments.join('/');
  const orderMatch = path.match(/^orders\/([^/]+)\/status$/);
  const productMatch = path.match(/^admin\/products\/([^/]+)$/);
  const promotionMatch = path.match(/^admin\/promotions\/([^/]+)$/);
  if (!orderMatch && !productMatch && !promotionMatch) return null;

  const result = await authorizedUser(request, true);
  if (result.response) return result.response;
  const input = await bodyOf(request);
  if (!input) return json({ error: 'Corps JSON invalide' }, 400);

  if (orderMatch) {
    const { status } = input;
    if (!ORDER_STATUSES.includes(status)) return json({ error: 'Statut invalide' }, 400);
    const { data: order, error: lookupError } = await supabase.from('orders')
      .select('*').eq('id', orderMatch[1]).maybeSingle();
    if (lookupError) throw lookupError;
    if (!order) return json({ error: 'Commande introuvable' }, 404);

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
    return json(await fullOrder(order.id));
  }

  if (productMatch) {
    const updates = Object.fromEntries(PRODUCT_FIELDS.filter((key) => key in input)
      .map((key) => [key, key === 'is_active' ? (input[key] ? 1 : 0) : input[key]]));
    if (!Object.keys(updates).length)
      return json({ error: 'Aucun champ à mettre à jour' }, 400);
    const { data, error } = await supabase.from('products').update(updates)
      .eq('id', productMatch[1]).select().maybeSingle();
    if (error) throw error;
    return json(data);
  }

  const { data, error } = await supabase.from('promotions')
    .update({ active: input.active ? 1 : 0 })
    .eq('id', promotionMatch[1]).select().maybeSingle();
  if (error) throw error;
  return json(data);
}

async function handleDelete(request, segments) {
  const match = segments.join('/').match(/^admin\/products\/([^/]+)$/);
  if (!match) return null;
  const result = await authorizedUser(request, true);
  if (result.response) return result.response;
  const { error } = await supabase.from('products')
    .update({ is_active: 0 }).eq('id', match[1]);
  if (error) throw error;
  return json({ ok: true });
}

async function dispatch(request, method) {
  try {
    const segments = new URL(request.url).pathname
      .replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const response = method === 'GET' ? await handleGet(request, segments)
      : method === 'POST' ? await handlePost(request, segments)
        : method === 'PATCH' ? await handlePatch(request, segments)
          : await handleDelete(request, segments);
    return response || json({ error: 'Route introuvable' }, 404);
  } catch (error) {
    return failed(error);
  }
}

export const GET = (request) => dispatch(request, 'GET');
export const POST = (request) => dispatch(request, 'POST');
export const PATCH = (request) => dispatch(request, 'PATCH');
export const DELETE = (request) => dispatch(request, 'DELETE');
