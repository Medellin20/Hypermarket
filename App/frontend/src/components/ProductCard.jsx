import { useCart } from '../context/CartContext.jsx';
import { fcfa } from '../api/client.js';

export default function ProductCard({ product }) {
  const { items, add, setQty } = useCart();
  const inCart = items.find((i) => i.id === product.id);
  const out = product.stock <= 0;

  return (
    <article className="product rise">
      <div className="thumb">{product.image_emoji}</div>

      {product.discount_percent > 0 && (
        <span className="badge badge-promo corner">-{product.discount_percent}%</span>
      )}
      {out
        ? <span className="badge badge-out corner-r">Rupture</span>
        : product.stock <= 5 && <span className="badge badge-green corner-r">Plus que {product.stock}</span>}

      <div className="body">
        <span className="super">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: product.supermarket_color || 'var(--green)', display: 'inline-block' }} />
          {product.supermarket_name}
        </span>
        <span className="name">{product.name}</span>
        {product.brand && <span className="brand">{product.brand}</span>}

        <div className="price-row">
          <span className="price">{fcfa(product.final_price)}</span>
          {product.discount_percent > 0 && (
            <span className="price old">{fcfa(product.price)}</span>
          )}
        </div>
        <span className="unit">le/la {product.unit}</span>

        <div className="add">
          {out ? (
            <button className="btn btn-ghost btn-sm btn-block" disabled>Indisponible</button>
          ) : inCart ? (
            <div className="qty" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button onClick={() => setQty(product.id, inCart.quantity - 1)}>−</button>
              <span>{inCart.quantity}</span>
              <button onClick={() => setQty(product.id, inCart.quantity + 1)} disabled={inCart.quantity >= product.stock}>+</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm btn-block" onClick={() => add(product)}>
              + Ajouter
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
