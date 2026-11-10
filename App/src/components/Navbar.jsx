'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api/client.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (!user) return setUnread(0);
      api.unreadCount().then((d) => active && setUnread(d.count)).catch(() => {});
    };
    load();
    const t = setInterval(load, 15000); // rafraîchit les notifications
    return () => { active = false; clearInterval(t); };
  }, [user]);

  return (
    <>
      <div className="promo-ribbon">
        🚚 Livraison à Cotonou dès 1 000 FCFA — <b>-10%</b> sur votre première commande avec la promo de lancement
      </div>
      <nav className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="mark">🛒</span> HyperMarket <small>Cotonou</small>
          </Link>
          <div className="nav-links">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>Catalogue</Link>
            {user && <Link href="/mes-commandes" className={pathname === '/mes-commandes' ? 'active' : ''}>Mes commandes</Link>}
            {user?.role === 'admin' && <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>Admin</Link>}
          </div>
          <div className="nav-spacer" />
          <div className="nav-actions">
            {user && (
              <Link href="/notifications" className="icon-btn" title="Notifications">
                🔔{unread > 0 && <span className="dot">{unread}</span>}
              </Link>
            )}
            <Link href="/panier" className="icon-btn" title="Panier">
              🛍️{totals.count > 0 && <span className="dot">{totals.count}</span>}
            </Link>
            {user ? (
              <>
                <span style={{ fontWeight: 700, fontSize: '.9rem' }}>
                  👋 {user.full_name.split(' ')[0]}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push('/'); }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/connexion" className="btn btn-primary btn-sm">Connexion</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
