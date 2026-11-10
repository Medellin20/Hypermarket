'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, fcfa } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Catalogue() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supermarkets, setSupermarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: '', category: '', supermarket: '', sort: '', max: '', in_stock: '',
  });

  useEffect(() => {
    Promise.all([api.categories(), api.supermarkets()])
      .then(([c, s]) => { setCategories(c); setSupermarkets(s); })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    api.products(filters)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters]);

  // Débounce léger sur les filtres
  useEffect(() => {
    const t = setTimeout(fetchProducts, 250);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const toggleCat = (id) => set('category', filters.category === String(id) ? '' : String(id));

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="rise">
            <span className="eyebrow">Le marché de Cotonou, en ligne</span>
            <h1>Tous vos supermarchés, <em>livrés</em> chez vous.</h1>
            <p>
              Erevan, Super U, La Pointe, Marina… Comparez les prix, remplissez votre panier
              et payez par Mobile Money. Livraison express partout à Cotonou.
            </p>
            <div className="hero-cta">
              <a href="#catalogue" className="btn btn-primary">Découvrir le catalogue</a>
              <Link href="/inscription" className="btn btn-ghost">Créer un compte</Link>
            </div>
            <div className="hero-stats">
              <div className="s"><b>{supermarkets.length || 4}</b><span>Supermarchés</span></div>
              <div className="s"><b>{categories.length || 8}</b><span>Catégories</span></div>
              <div className="s"><b>30 min</b><span>Livraison express</span></div>
            </div>
          </div>

          <div className="hero-card rise">
            <h3>🛍️ Votre panier type</h3>
            {[
              ['🍚', 'Riz parfumé 5 kg', 6500],
              ['🥬', 'Légumes frais', 1200],
              ['🥛', 'Lait & yaourts', 2550],
              ['💧', 'Eau minérale (pack 6)', 2400],
            ].map(([e, n, p]) => (
              <div className="basket-row" key={n}>
                <span className="emo">{e}</span>
                <span className="grow"><span className="nm">{n}</span></span>
                <span className="pr">{fcfa(p)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Livré en ~30 min</span>
              <Link href="/panier" className="btn btn-terra btn-sm">Voir mon panier</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="section" id="catalogue">
        <div className="container">
          <div className="cat-strip">
            <div className={`cat-chip ${!filters.category ? 'active' : ''}`} onClick={() => set('category', '')}>
              <span className="ico">🏬</span> Tout
            </div>
            {categories.map((c) => (
              <div
                key={c.id}
                className={`cat-chip ${filters.category === String(c.id) ? 'active' : ''}`}
                onClick={() => toggleCat(c.id)}
              >
                <span className="ico">{c.icon}</span> {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Catalogue</span>
              <h2>{loading ? 'Chargement…' : `${products.length} produits disponibles`}</h2>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span className="ico">🔎</span>
              <input
                className="input"
                placeholder="Rechercher un produit, une marque…"
                value={filters.q}
                onChange={(e) => set('q', e.target.value)}
              />
            </div>
            <select className="input" value={filters.supermarket} onChange={(e) => set('supermarket', e.target.value)}>
              <option value="">Tous les supermarchés</option>
              {supermarkets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="input" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="">Trier par</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name">Nom (A–Z)</option>
            </select>
            <select className="input" value={filters.max} onChange={(e) => set('max', e.target.value)}>
              <option value="">Prix max</option>
              <option value="1000">≤ 1 000</option>
              <option value="2500">≤ 2 500</option>
              <option value="5000">≤ 5 000</option>
            </select>
            <label className="btn btn-ghost btn-sm" style={{ gap: '.4rem' }}>
              <input
                type="checkbox"
                checked={filters.in_stock === '1'}
                onChange={(e) => set('in_stock', e.target.checked ? '1' : '')}
              />
              En stock
            </label>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div className="empty">
              <span className="emo">🫙</span>
              Aucun produit ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid-products">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
