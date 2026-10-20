import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fcfa } from '../api/client.js';

export default function Cart() {
  const { items, setQty, remove, totals } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty card" style={{ padding: '4rem 1rem' }}>
          <span className="emo">🛍️</span>
          <h2 style={{ marginBottom: '.5rem' }}>Votre panier est vide</h2>
          <p style={{ marginBottom: '1.4rem' }}>Parcourez le catalogue et ajoutez vos produits préférés.</p>
          <Link to="/" className="btn btn-primary">Voir le catalogue</Link>
        </div>
      </div>
    );
  }

  const goCheckout = () => navigate(user ? '/commande' : '/connexion', { state: { from: { pathname: '/commande' } } });

  return (
    <div className="container section">
      <span className="eyebrow">Panier</span>
      <h2 style={{ fontSize: '1.9rem', marginBottom: '1.4rem' }}>Votre panier ({totals.count} articles)</h2>

      <div className="layout-2">
        <div className="card" style={{ padding: '0 1.3rem' }}>
          {items.map((i) => (
            <div className="cart-line" key={i.id}>
              <span className="emo">{i.image_emoji}</span>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{i.name}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {i.supermarket_name} · {fcfa(i.final_price)} / {i.unit}
                  {i.discount_percent > 0 && <span className="badge badge-promo" style={{ marginLeft: '.4rem' }}>-{i.discount_percent}%</span>}
                </div>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock}>+</button>
              </div>
              <div style={{ width: 110, textAlign: 'right', fontWeight: 800, color: 'var(--green)' }}>
                {fcfa(i.final_price * i.quantity)}
              </div>
              <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => remove(i.id)} title="Retirer">🗑️</button>
            </div>
          ))}
        </div>

        <div className="card summary">
          <h3 style={{ marginBottom: '.8rem' }}>Récapitulatif</h3>
          <div className="row"><span>Sous-total</span><span>{fcfa(totals.subtotal)}</span></div>
          {totals.discount > 0 && (
            <div className="row" style={{ color: 'var(--terra-2)' }}>
              <span>Réductions</span><span>− {fcfa(totals.discount)}</span>
            </div>
          )}
          <div className="row"><span>Livraison</span><span>calculée à l'étape suivante</span></div>
          <div className="row total"><span>Total estimé</span><b>{fcfa(totals.afterDiscount)}</b></div>
          <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} onClick={goCheckout}>
            Passer la commande →
          </button>
          <Link to="/" className="btn btn-ghost btn-block" style={{ marginTop: '.6rem' }}>
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
