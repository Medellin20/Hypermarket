import db from '../db/database.js';

// Retourne le meilleur pourcentage de réduction applicable à un produit
// en tenant compte des promotions globales / catégorie / supermarché actives.
export async function bestDiscountForProduct(product) {
  const promos = await db.prepare('SELECT * FROM promotions WHERE active = 1').all();
  let best = 0;
  for (const p of promos) {
    if (p.scope === 'global') best = Math.max(best, p.percent);
    if (p.scope === 'category' && p.scope_id === product.category_id) best = Math.max(best, p.percent);
    if (p.scope === 'supermarket' && p.scope_id === product.supermarket_id) best = Math.max(best, p.percent);
  }
  return best;
}

// Bonus fidélité : +1% de réduction par tranche de 5 commandes livrées (plafonné à 5%)
export async function loyaltyBonusPercent(userId) {
  const { c } = await db.prepare(
    `SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND status = 'livree'`
  ).get(userId);
  return Math.min(5, Math.floor(c / 5));
}

export const DELIVERY_FEES = { standard: 1000, express: 2000, retrait: 0 };

// Crédits fidélité gagnés : 1% du sous-total (arrondi)
export function creditsEarned(subtotal) {
  return Math.round(subtotal * 0.01);
}
