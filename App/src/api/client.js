// Client API centralisé. Le token est conservé en mémoire + localStorage.
const BASE = '/api';

let token = typeof window === 'undefined' ? null : window.localStorage.getItem('hm_token') || null;

export function setToken(t) {
  token = t;
  if (typeof window !== 'undefined') {
    if (t) window.localStorage.setItem('hm_token', t);
    else window.localStorage.removeItem('hm_token');
  }
}
export function getToken() { return token; }

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* réponse vide */ }

  if (!res.ok) {
    const message = data?.error || `Erreur ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Auth
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login:    (b) => request('/auth/login', { method: 'POST', body: b }),
  me:       () => request('/auth/me'),
  addAddress: (b) => request('/auth/addresses', { method: 'POST', body: b }),

  // Catalogue
  supermarkets: () => request('/supermarkets'),
  categories:   () => request('/categories'),
  brands:       () => request('/brands'),
  promotions:   () => request('/promotions'),
  products: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  product: (id) => request(`/products/${id}`),

  // Commandes
  createOrder: (b) => request('/orders', { method: 'POST', body: b }),
  myOrders:    () => request('/orders'),
  order:       (id) => request(`/orders/${id}`),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),

  // Notifications
  notifications:    () => request('/notifications'),
  unreadCount:      () => request('/notifications/unread-count'),
  readNotif:        (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifs:    () => request('/notifications/read-all', { method: 'POST' }),

  // Admin
  adminDashboard:   () => request('/admin/dashboard'),
  adminOrders:      () => request('/admin/orders'),
  adminProducts:    () => request('/admin/products'),
  adminUpdateProduct: (id, b) => request(`/admin/products/${id}`, { method: 'PATCH', body: b }),
  adminCreateProduct: (b) => request('/admin/products', { method: 'POST', body: b }),
  adminPromotions:  () => request('/admin/promotions'),
  adminCreatePromo: (b) => request('/admin/promotions', { method: 'POST', body: b }),
  adminTogglePromo: (id, active) => request(`/admin/promotions/${id}`, { method: 'PATCH', body: { active } }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};

// Format monétaire FCFA
export const fcfa = (n) =>
  `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
