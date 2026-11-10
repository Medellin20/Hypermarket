export function discountForProduct(product, promos) {
  let best = 0;
  for (const promotion of promos) {
    if (promotion.scope === 'global') best = Math.max(best, promotion.percent);
    if (promotion.scope === 'category' && promotion.scope_id === product.category_id)
      best = Math.max(best, promotion.percent);
    if (promotion.scope === 'supermarket' && promotion.scope_id === product.supermarket_id)
      best = Math.max(best, promotion.percent);
  }
  return best;
}
