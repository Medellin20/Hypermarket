import db from './database.js';
import bcrypt from 'bcryptjs';

await db.transaction(async (tx) => {
await tx.exec(`TRUNCATE TABLE order_items, orders, notifications, promotions,
  products, categories, supermarkets, addresses, users RESTART IDENTITY CASCADE`);

// =====================================================================
// Utilisateurs
// =====================================================================
const insUser = tx.prepare(
  `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_credits)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const adminHash  = bcrypt.hashSync('admin123', 10);
const clientHash = bcrypt.hashSync('client123', 10);

await insUser.run('Administrateur', 'admin@hypermarket.bj', '+22990000000', adminHash, 'admin', 0);
const clientId = (await insUser.run('Aïcha Hounkpatin', 'client@hypermarket.bj', '+22997123456', clientHash, 'client', 2000)).lastInsertRowid;

// Adresse par défaut du client démo
await tx.prepare(
  `INSERT INTO addresses (user_id, label, quarter, details, is_default)
   VALUES (?, ?, ?, ?, 1)`
).run(clientId, 'Maison', 'Cadjèhoun', 'Immeuble bleu, près de la pharmacie');

// =====================================================================
// Supermarchés partenaires (Cotonou)
// =====================================================================
const insSuper = tx.prepare(
  `INSERT INTO supermarkets (name, address, quarter, hours, logo_color, rating)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const supers = [
  ['Erevan Cotonou',     'Bd Saint-Michel',        'Saint-Michel', '08h–21h',         '#1F4D3A', 4.6],
  ['Super U Ganhi',      'Avenue Clozel',          'Ganhi',        '08h30–20h30',     '#E8833A', 4.4],
  ['La Pointe Market',   'Carrefour Cadjèhoun',    'Cadjèhoun',    '07h30–22h',       '#C2410C', 4.7],
  ['Marina Market',      'Bd de la Marina',        'Akpakpa',      '08h–21h30',       '#0F766E', 4.3],
];
const superIds = [];
for (const supermarket of supers) {
  superIds.push((await insSuper.run(...supermarket)).lastInsertRowid);
}

// =====================================================================
// Catégories
// =====================================================================
const insCat = tx.prepare(`INSERT INTO categories (name, icon) VALUES (?, ?)`);
const cats = [
  ['Épicerie',           '🧺'],
  ['Fruits & Légumes',   '🥬'],
  ['Boissons',           '🥤'],
  ['Hygiène & Beauté',   '🧴'],
  ['Produits laitiers',  '🥛'],
  ['Viandes & Poissons', '🍗'],
  ['Boulangerie',        '🥖'],
  ['Bébé & Enfant',      '🍼'],
];
const catIds = {};
for (const [name, icon] of cats) {
  catIds[name] = (await insCat.run(name, icon)).lastInsertRowid;
}

// =====================================================================
// Produits (prix en FCFA)
// =====================================================================
const insProd = tx.prepare(
  `INSERT INTO products (supermarket_id, category_id, name, brand, description, price, unit, stock, image_emoji)
   VALUES (@super, @cat, @name, @brand, @desc, @price, @unit, @stock, @emoji)`
);

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rand(0, arr.length - 1)];

const catalogue = [
  // Épicerie
  ['Épicerie', 'Riz parfumé 5 kg', 'Uncle Bens', 'Riz long grain importé', 6500, 'sac', '🍚'],
  ['Épicerie', 'Huile végétale 1 L', 'Dinor', 'Huile de cuisine raffinée', 1200, 'bouteille', '🛢️'],
  ['Épicerie', 'Sucre en poudre 1 kg', 'Saint Louis', 'Sucre blanc cristallisé', 900, 'paquet', '🧂'],
  ['Épicerie', 'Spaghetti 500 g', 'Panzani', 'Pâtes alimentaires', 750, 'paquet', '🍝'],
  ['Épicerie', 'Tomate concentrée 400 g', 'Gino', 'Double concentré de tomate', 600, 'boîte', '🥫'],
  ['Épicerie', 'Café soluble 100 g', 'Nescafé', 'Café instantané', 2800, 'pot', '☕'],
  // Fruits & Légumes
  ['Fruits & Légumes', 'Bananes plantains', 'Local', 'Régime de plantains mûrs', 1500, 'régime', '🍌'],
  ['Fruits & Légumes', 'Tomates fraîches 1 kg', 'Local', 'Tomates du marché Dantokpa', 800, 'kg', '🍅'],
  ['Fruits & Légumes', 'Oignons 1 kg', 'Local', 'Oignons rouges', 700, 'kg', '🧅'],
  ['Fruits & Légumes', 'Ananas pain de sucre', 'Allada', 'Ananas sucré du plateau', 600, 'pièce', '🍍'],
  ['Fruits & Légumes', 'Mangues 1 kg', 'Local', 'Mangues de saison', 900, 'kg', '🥭'],
  // Boissons
  ['Boissons', 'Eau minérale 1,5 L (pack 6)', 'Possotomè', 'Pack de 6 bouteilles', 2400, 'pack', '💧'],
  ['Boissons', 'Coca-Cola 1,5 L', 'Coca-Cola', 'Boisson gazeuse', 900, 'bouteille', '🥤'],
  ['Boissons', 'Jus d\'ananas 1 L', 'Fruité', 'Jus de fruit naturel', 1100, 'brique', '🧃'],
  ['Boissons', 'Bière La Béninoise (pack 6)', 'SOBEBRA', 'Bière blonde locale', 3600, 'pack', '🍺'],
  // Hygiène
  ['Hygiène & Beauté', 'Savon de Marseille', 'Le Chat', 'Savon multi-usage', 500, 'pièce', '🧼'],
  ['Hygiène & Beauté', 'Dentifrice 100 ml', 'Signal', 'Protection complète', 850, 'tube', '🪥'],
  ['Hygiène & Beauté', 'Gel douche 250 ml', 'Dove', 'Hydratation intense', 1900, 'flacon', '🧴'],
  ['Hygiène & Beauté', 'Papier hygiénique x8', 'Lotus', 'Rouleaux double épaisseur', 2200, 'paquet', '🧻'],
  // Laitiers
  ['Produits laitiers', 'Lait concentré sucré', 'Nestlé', 'Boîte 397 g', 950, 'boîte', '🥛'],
  ['Produits laitiers', 'Yaourt nature x4', 'Danone', 'Pack de 4 pots', 1600, 'pack', '🍶'],
  ['Produits laitiers', 'Beurre doux 250 g', 'President', 'Beurre de table', 2100, 'plaquette', '🧈'],
  // Viandes & poissons
  ['Viandes & Poissons', 'Poulet entier ~1,5 kg', 'Local', 'Poulet bicyclette', 4500, 'pièce', '🍗'],
  ['Viandes & Poissons', 'Poisson chinchard 1 kg', 'Local', 'Poisson frais', 2000, 'kg', '🐟'],
  ['Viandes & Poissons', 'Œufs (plateau de 30)', 'Local', 'Œufs frais', 2700, 'plateau', '🥚'],
  // Boulangerie
  ['Boulangerie', 'Pain baguette', 'Local', 'Baguette croustillante', 200, 'pièce', '🥖'],
  ['Boulangerie', 'Croissant au beurre', 'Local', 'Viennoiserie', 350, 'pièce', '🥐'],
  // Bébé
  ['Bébé & Enfant', 'Couches taille 3 x40', 'Pampers', 'Couches bébé', 6800, 'paquet', '🍼'],
  ['Bébé & Enfant', 'Lait infantile 400 g', 'Guigoz', 'Lait 2e âge', 5400, 'boîte', '🍼'],
];

let count = 0;
for (const superId of superIds) {
  for (const [cat, name, brand, desc, basePrice, unit, emoji] of catalogue) {
    // Légère variation de prix entre supermarchés (-5% à +8%)
    const factor = 1 + rand(-5, 8) / 100;
    await insProd.run({
      super: superId,
      cat: catIds[cat],
      name, brand, desc,
      price: Math.round(basePrice * factor / 25) * 25, // arrondi à 25 FCFA
      unit,
      stock: pick([0, 4, 8, 12, 25, 40, 60, 100]),     // certains en rupture
      emoji
    });
    count++;
  }
}

// =====================================================================
// Promotions
// =====================================================================
const insPromo = tx.prepare(
  `INSERT INTO promotions (name, percent, scope, scope_id, active) VALUES (?, ?, ?, ?, 1)`
);
await insPromo.run('Promo de lancement', 10, 'global', null);
await insPromo.run('Fraîcheur du jour', 15, 'category', catIds['Fruits & Légumes']);

// =====================================================================
// Notification de bienvenue
// =====================================================================
await tx.prepare(
  `INSERT INTO notifications (user_id, title, body, type)
   VALUES (?, ?, ?, 'promo')`
).run(clientId, 'Bienvenue sur HyperMarket Cotonou 🎉',
      'Profitez de -10% sur votre première commande grâce à la promo de lancement.');

console.log('✅ Base peuplée avec succès');
console.log(`   • ${supers.length} supermarchés`);
console.log(`   • ${cats.length} catégories`);
console.log(`   • ${count} produits`);
console.log('   • 2 utilisateurs (admin@hypermarket.bj / admin123, client@hypermarket.bj / client123)');
})();
