'use client';

import { useEffect, useState } from 'react';
import { api, fcfa } from '../api/client.js';

const NEXT_STATUS = {
  confirmee: 'en_preparation',
  en_preparation: 'en_livraison',
  en_livraison: 'livree',
};
const STATUS_LABEL = {
  en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation',
  en_livraison: 'En livraison', livree: 'Livrée', annulee: 'Annulée',
};

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.adminDashboard().then(setData).catch(() => {}); }, []);
  if (!data) return <div className="spinner" />;
  const { stats, topProducts, recentOrders } = data;

  return (
    <>
      <div className="kpi-grid">
        <div className="card kpi"><div className="v">{fcfa(stats.revenue)}</div><div className="l">Chiffre d'affaires</div></div>
        <div className="card kpi"><div className="v">{stats.orders}</div><div className="l">Commandes</div></div>
        <div className="card kpi"><div className="v">{stats.pending}</div><div className="l">En cours</div></div>
        <div className="card kpi"><div className="v">{stats.clients}</div><div className="l">Clients</div></div>
        <div className="card kpi"><div className="v">{stats.products}</div><div className="l">Produits actifs</div></div>
        <div className={`card kpi ${stats.outOfStock ? 'warn' : ''}`}><div className="v">{stats.outOfStock}</div><div className="l">En rupture</div></div>
      </div>

      <div className="layout-2" style={{ marginTop: '1.4rem' }}>
        <div className="card" style={{ padding: '1.3rem' }}>
          <h3 style={{ marginBottom: '.8rem' }}>Commandes récentes</h3>
          <table className="tbl">
            <thead><tr><th>#</th><th>Client</th><th>Total</th><th>Statut</th></tr></thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td><td>{o.client_name}</td><td>{fcfa(o.total)}</td>
                  <td><span className={`status-pill s-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ padding: '1.3rem' }}>
          <h3 style={{ marginBottom: '.8rem' }}>Top produits</h3>
          {topProducts.length === 0 ? <p style={{ color: 'var(--muted)' }}>Aucune vente.</p> :
            topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid var(--line)' }}>
                <span>{i + 1}. {p.product_name}</span>
                <strong style={{ color: 'var(--green)' }}>{p.qty} vendus</strong>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const load = () => api.adminOrders().then(setOrders).catch(() => {});
  useEffect(load, []);

  const advance = async (o) => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    await api.updateOrderStatus(o.id, next);
    load();
  };

  return (
    <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
      <table className="tbl">
        <thead><tr><th>#</th><th>Client</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.client_name}<br /><small style={{ color: 'var(--muted)' }}>{o.client_phone || '—'}</small></td>
              <td>{o.items.reduce((s, i) => s + i.quantity, 0)} art.</td>
              <td>{fcfa(o.total)}</td>
              <td><small>{o.payment_method}</small></td>
              <td><span className={`status-pill s-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
              <td>
                {NEXT_STATUS[o.status] && (
                  <button className="btn btn-primary btn-sm" onClick={() => advance(o)}>
                    → {STATUS_LABEL[NEXT_STATUS[o.status]]}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [edit, setEdit] = useState({}); // id -> {price, stock}
  const load = () => api.adminProducts().then(setProducts).catch(() => {});
  useEffect(load, []);

  const save = async (p) => {
    const e = edit[p.id] || {};
    await api.adminUpdateProduct(p.id, {
      price: e.price != null ? Number(e.price) : p.price,
      stock: e.stock != null ? Number(e.stock) : p.stock,
    });
    setEdit((prev) => { const c = { ...prev }; delete c[p.id]; return c; });
    load();
  };

  return (
    <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
      <table className="tbl">
        <thead><tr><th>Produit</th><th>Supermarché</th><th>Prix (FCFA)</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          {products.slice(0, 60).map((p) => (
            <tr key={p.id}>
              <td>{p.image_emoji} {p.name}</td>
              <td><small>{p.supermarket_name}</small></td>
              <td>
                <input className="input" style={{ width: 100, padding: '.3rem .5rem' }}
                  defaultValue={p.price}
                  onChange={(e) => setEdit((prev) => ({ ...prev, [p.id]: { ...prev[p.id], price: e.target.value } }))} />
              </td>
              <td>
                <input className="input" style={{ width: 70, padding: '.3rem .5rem' }}
                  defaultValue={p.stock}
                  onChange={(e) => setEdit((prev) => ({ ...prev, [p.id]: { ...prev[p.id], stock: e.target.value } }))} />
              </td>
              <td>{edit[p.id] && <button className="btn btn-terra btn-sm" onClick={() => save(p)}>Enregistrer</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromosAdmin() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ name: '', percent: 10, scope: 'global' });
  const load = () => api.adminPromotions().then(setPromos).catch(() => {});
  useEffect(load, []);

  const create = async () => {
    if (!form.name) return;
    await api.adminCreatePromo({ ...form, percent: Number(form.percent) });
    setForm({ name: '', percent: 10, scope: 'global' });
    load();
  };
  const toggle = async (p) => { await api.adminTogglePromo(p.id, p.active ? 0 : 1); load(); };

  return (
    <>
      <div className="card" style={{ padding: '1.2rem', marginBottom: '1.2rem', display: 'flex', gap: '.7rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div className="field"><label>Nom</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Black Friday" /></div>
        <div className="field"><label>Réduction %</label><input className="input" type="number" style={{ width: 100 }} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} /></div>
        <button className="btn btn-primary" onClick={create}>+ Créer la promo</button>
      </div>
      <div className="card" style={{ padding: '1rem' }}>
        <table className="tbl">
          <thead><tr><th>Promotion</th><th>Réduction</th><th>Portée</th><th>État</th><th></th></tr></thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td><td>-{p.percent}%</td><td>{p.scope}</td>
                <td><span className={`status-pill ${p.active ? 's-livree' : 's-annulee'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => toggle(p)}>{p.active ? 'Désactiver' : 'Activer'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const TABS = [
    ['dashboard', '📊 Tableau de bord'],
    ['orders', '📦 Commandes'],
    ['products', '🛒 Produits & stocks'],
    ['promos', '🎁 Promotions'],
  ];

  return (
    <div className="container section">
      <span className="eyebrow">Administration</span>
      <h2 style={{ fontSize: '1.9rem' }}>Console HyperMarket</h2>

      <div className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'orders' && <OrdersAdmin />}
      {tab === 'products' && <ProductsAdmin />}
      {tab === 'promos' && <PromosAdmin />}
    </div>
  );
}
