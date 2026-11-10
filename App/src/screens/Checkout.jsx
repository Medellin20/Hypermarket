'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, fcfa } from '../api/client.js';

const DELIVERY = [
  { id: 'standard', t: '🚲 Standard', d: 'Livraison sous ~90 min', fee: 1000 },
  { id: 'express',  t: '⚡ Express',  d: 'Livraison sous ~30 min', fee: 2000 },
  { id: 'retrait',  t: '🏬 Retrait',  d: 'À récupérer en magasin', fee: 0 },
];

const PAYMENTS = [
  { id: 'momo_mtn', t: '📱 MTN MoMo', d: 'Mobile Money MTN' },
  { id: 'moov',     t: '📱 Moov Money', d: 'Mobile Money Moov' },
  { id: 'celtiis',  t: '📱 Celtiis Cash', d: 'Mobile Money Celtiis' },
  { id: 'cash',     t: '💵 À la livraison', d: 'Espèces à réception' },
  { id: 'carte',    t: '💳 Carte bancaire', d: 'Visa / Mastercard' },
  { id: 'crypto_btc', t: '₿ Crypto (BTC)', d: 'Conversion automatique' },
];

const QUARTERS = ['Cadjèhoun', 'Akpakpa', 'Ganhi', 'Fidjrossè', 'Gbégamey', 'Cocotomey', 'Calavi', 'Zogbo'];

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('momo_mtn');
  const [quarter, setQuarter] = useState('Cadjèhoun');
  const [slot, setSlot] = useState('');
  const [useCredits, setUseCredits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const deliveryFee = DELIVERY.find((d) => d.id === delivery).fee;
  const credits = user?.loyalty_credits || 0;
  const beforeCredits = totals.afterDiscount + deliveryFee;
  const creditsApplied = useCredits ? Math.min(credits, beforeCredits) : 0;
  const grandTotal = beforeCredits - creditsApplied;

  useEffect(() => {
    if (items.length === 0 && !done) router.replace('/');
  }, [done, items.length, router]);

  if (items.length === 0 && !done) return null;

  const submit = async () => {
    setError(''); setSubmitting(true);
    try {
      const res = await api.createOrder({
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: payment,
        delivery_type: delivery,
        delivery_quarter: delivery === 'retrait' ? null : quarter,
        delivery_slot: slot || null,
        use_credits: creditsApplied,
      });
      clear();
      await refresh();
      setDone(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="container section">
        <div className="card rise" style={{ maxWidth: 560, margin: '2rem auto', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem' }}>✅</div>
          <h2 style={{ margin: '.6rem 0' }}>Commande confirmée&nbsp;!</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            Votre commande <b>#{done.order.id}</b> est enregistrée. Total payé&nbsp;:
            <b style={{ color: 'var(--green)' }}> {fcfa(done.order.total)}</b>.
          </p>
          <p className="badge badge-green" style={{ marginTop: '1rem' }}>
            + {done.credits_earned} crédits fidélité gagnés 🎁
          </p>
          <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'center', marginTop: '1.6rem' }}>
            <button className="btn btn-primary" onClick={() => router.push('/mes-commandes')}>Suivre ma commande</button>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>Retour au catalogue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <span className="eyebrow">Finalisation</span>
      <h2 style={{ fontSize: '1.9rem', marginBottom: '1.4rem' }}>Votre commande</h2>

      <div className="layout-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Livraison */}
          <div className="card" style={{ padding: '1.3rem' }}>
            <h3 style={{ marginBottom: '.9rem' }}>1 · Mode de livraison</h3>
            <div className="opt-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {DELIVERY.map((d) => (
                <div key={d.id} className={`opt ${delivery === d.id ? 'active' : ''}`} onClick={() => setDelivery(d.id)}>
                  <span className="t">{d.t}</span>
                  <span className="d">{d.d}</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)' }}>{d.fee ? fcfa(d.fee) : 'Gratuit'}</span>
                </div>
              ))}
            </div>

            {delivery !== 'retrait' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginTop: '1rem' }}>
                <div className="field">
                  <label>Quartier de livraison</label>
                  <select className="input" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                    {QUARTERS.map((q) => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Créneau souhaité (optionnel)</label>
                  <input className="input" type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Paiement */}
          <div className="card" style={{ padding: '1.3rem' }}>
            <h3 style={{ marginBottom: '.9rem' }}>2 · Moyen de paiement</h3>
            <div className="opt-grid">
              {PAYMENTS.map((p) => (
                <div key={p.id} className={`opt ${payment === p.id ? 'active' : ''}`} onClick={() => setPayment(p.id)}>
                  <span className="t">{p.t}</span>
                  <span className="d">{p.d}</span>
                </div>
              ))}
            </div>
            {payment === 'crypto_btc' && (
              <p className="notice" style={{ marginTop: '.9rem', background: 'var(--cream-2)', color: 'var(--ink-soft)' }}>
                ₿ Le montant en FCFA sera converti automatiquement au taux du jour (simulation v1).
              </p>
            )}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="card summary">
          <h3 style={{ marginBottom: '.8rem' }}>Récapitulatif</h3>
          <div className="row"><span>Sous-total</span><span>{fcfa(totals.subtotal)}</span></div>
          {totals.discount > 0 && <div className="row" style={{ color: 'var(--terra-2)' }}><span>Réductions produits</span><span>− {fcfa(totals.discount)}</span></div>}
          <div className="row"><span>Livraison</span><span>{deliveryFee ? fcfa(deliveryFee) : 'Gratuit'}</span></div>

          {credits > 0 && (
            <label className="row" style={{ cursor: 'pointer', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <input type="checkbox" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} />
                Utiliser mes crédits ({credits})
              </span>
              <span style={{ color: 'var(--terra-2)' }}>{creditsApplied ? `− ${fcfa(creditsApplied)}` : '—'}</span>
            </label>
          )}

          <div className="row total"><span>Total à payer</span><b>{fcfa(grandTotal)}</b></div>

          {error && <div className="notice notice-err" style={{ marginTop: '.8rem' }}>{error}</div>}

          <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} disabled={submitting} onClick={submit}>
            {submitting ? 'Traitement…' : `Payer ${fcfa(grandTotal)}`}
          </button>
          <p style={{ fontSize: '.76rem', color: 'var(--muted)', textAlign: 'center', marginTop: '.6rem' }}>
            🔒 Paiement sécurisé · Vous gagnez 1% en crédits fidélité
          </p>
        </div>
      </div>
    </div>
  );
}
