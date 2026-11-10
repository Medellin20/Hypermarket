'use client';

import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const ICONS = { order: '📦', promo: '🎁', stock: '⚠️', info: '🔔' };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.notifications().then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const readAll = async () => { await api.readAllNotifs(); load(); };
  const read = async (id) => { await api.readNotif(id); load(); };

  if (loading) return <div className="spinner" />;

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Activité</span>
          <h2 style={{ fontSize: '1.9rem' }}>Notifications</h2>
        </div>
        {items.some((n) => !n.is_read) && (
          <button className="btn btn-ghost btn-sm" onClick={readAll}>Tout marquer comme lu</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty"><span className="emo">🔔</span>Aucune notification.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {items.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.is_read ? '' : 'unread'}`}
              onClick={() => !n.is_read && read(n.id)}
              style={{ cursor: n.is_read ? 'default' : 'pointer' }}
            >
              <span className="ico">{ICONS[n.type] || '🔔'}</span>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: '.88rem', color: 'var(--ink-soft)' }}>{n.body}</div>}
                <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
              {!n.is_read && <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--terra)', alignSelf: 'center' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
