export function discountForProduct(product, promos) {
  let best = 0;
  for (const p of promos) {
    if (p.scope === 'global') best = Math.max(best, p.percent);
    if (p.scope === 'category' && p.scope_id === product.category_id) best = Math.max(best, p.percent);
    if (p.scope === 'supermarket' && p.scope_id === product.supermarket_id) best = Math.max(best, p.percent);
  }
  return best;
}
