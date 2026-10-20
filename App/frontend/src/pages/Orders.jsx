import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { api, fcfa } from '../api/client.js';

const STEPS = [
  { id: 'confirmee', label: 'Confirmée', icon: '✓' },
  { id: 'en_preparation', label: 'Préparation', icon: '📦' },
  { id: 'en_livraison', label: 'Livraison', icon: '🚲' },
  { id: 'livree', label: 'Livrée', icon: '🏠' },
];
const STATUS_LABEL = {
  en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation',
  en_livraison: 'En livraison', livree: 'Livrée', annulee: 'Annulée',
};
const PAY_LABEL = {
  momo_mtn: 'MTN MoMo', moov: 'Moov Money', celtiis: 'Celtiis Cash',
  cash: 'À la livraison', carte: 'Carte', crypto_btc: 'Crypto BTC',
};

function Tracker({ status }) {
  if (status === 'annulee') return null;
  const idx = STEPS.findIndex((s) => s.id === status);
  return (
    <div className="tracker">
      {STEPS.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <div className={`bar ${i <= idx ? 'done' : ''}`} />}
          <div className={`step ${i <= idx ? 'done' : ''}`}>
            <div className="pt">{s.icon}</div>
            {s.label}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.myOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    try { await api.cancelOrder(id); load(); }
    catch (e) { alert(e.message); }
  };

  if (loading) return <div className="spinner" />;

  if (orders.length === 0) {
    return (
      <div className="container section">
        <div className="empty card" style={{ padding: '4rem 1rem' }}>
          <span className="emo">📦</span>
          <h2>Aucune commande pour l'instant</h2>
          <p style={{ margin: '.5rem 0 1.4rem' }}>Vos commandes et leur suivi apparaîtront ici.</p>
          <Link to="/" className="btn btn-primary">Commander maintenant</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <span className="eyebrow">Suivi</span>
      <h2 style={{ fontSize: '1.9rem', marginBottom: '1.4rem' }}>Mes commandes</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {orders.map((o) => (
          <div key={o.id} className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.6rem' }}>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Commande #{o.id}</strong>
                <span style={{ color: 'var(--muted)', marginLeft: '.6rem', fontSize: '.85rem' }}>
                  {new Date(o.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <span className={`status-pill s-${o.status}`}>{STATUS_LABEL[o.status]}</span>
            </div>

            <Tracker status={o.status} />

            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', margin: '.6rem 0' }}>
              {o.items.map((it) => (
                <span key={it.id} className="badge badge-green" style={{ textTransform: 'none' }}>
                  {it.quantity}× {it.product_name}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--line)', paddingTop: '.8rem', flexWrap: 'wrap', gap: '.6rem' }}>
              <span style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>
                💳 {PAY_LABEL[o.payment_method]} · {o.delivery_type === 'retrait' ? 'Retrait magasin' : `Livraison ${o.delivery_type}`}
                {o.delivery_quarter ? ` · ${o.delivery_quarter}` : ''}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>{fcfa(o.total)}</span>
            </div>

            {['en_attente', 'confirmee', 'en_preparation'].includes(o.status) && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '.8rem' }} onClick={() => cancel(o.id)}>
                Annuler la commande
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
