import { supabase, throwIfSupabaseError } from './supabase.js';

const existing = throwIfSupabaseError(await supabase.from('users')
  .select('auth_user_id').not('auth_user_id', 'is', null));
for (const { auth_user_id } of existing) {
  const { error } = await supabase.auth.admin.deleteUser(auth_user_id);
  if (error) throw error;
}

throwIfSupabaseError(await supabase.rpc('reset_demo_data'));

async function createDemoUser(full_name, email, password, role, phone, loyalty_credits = 0) {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (authError) throw authError;
  return throwIfSupabaseError(await supabase.from('users').insert({
    auth_user_id: authData.user.id, full_name, email, phone, role, loyalty_credits
  }).select('id').single());
}

const admin = await createDemoUser(
  'Administrateur', 'admin@hypermarket.bj', 'admin123', 'admin', '+22990000000'
);
const client = await createDemoUser(
  'Aïcha Hounkpatin', 'client@hypermarket.bj', 'client123', 'client',
  '+22997123456', 2000
);

throwIfSupabaseError(await supabase.from('addresses').insert({
  user_id: client.id, label: 'Maison', quarter: 'Cadjèhoun',
  details: 'Immeuble bleu, près de la pharmacie', is_default: 1
}));

const supermarkets = throwIfSupabaseError(await supabase.from('supermarkets').insert([
  { name: 'Erevan Cotonou', address: 'Bd Saint-Michel', quarter: 'Saint-Michel', hours: '08h–21h', logo_color: '#1F4D3A', rating: 4.6 },
  { name: 'Super U Ganhi', address: 'Avenue Clozel', quarter: 'Ganhi', hours: '08h30–20h30', logo_color: '#E8833A', rating: 4.4 },
  { name: 'La Pointe Market', address: 'Carrefour Cadjèhoun', quarter: 'Cadjèhoun', hours: '07h30–22h', logo_color: '#C2410C', rating: 4.7 },
  { name: 'Marina Market', address: 'Bd de la Marina', quarter: 'Akpakpa', hours: '08h–21h30', logo_color: '#0F766E', rating: 4.3 }
]).select('id'));

const categories = [
  ['Épicerie', '🧺'], ['Fruits & Légumes', '🥬'], ['Boissons', '🥤'],
  ['Hygiène & Beauté', '🧴'], ['Produits laitiers', '🥛'],
  ['Viandes & Poissons', '🍗'], ['Boulangerie', '🥖'], ['Bébé & Enfant', '🍼']
];
const insertedCategories = throwIfSupabaseError(await supabase.from('categories')
  .insert(categories.map(([name, icon]) => ({ name, icon }))).select('id, name'));
const categoryIds = Object.fromEntries(insertedCategories.map(({ id, name }) => [name, id]));

const catalogue = [
  ['Épicerie', 'Riz parfumé 5 kg', 'Uncle Bens', 'Riz long grain importé', 6500, 'sac', '🍚'],
  ['Épicerie', 'Huile végétale 1 L', 'Dinor', 'Huile de cuisine raffinée', 1200, 'bouteille', '🛢️'],
  ['Épicerie', 'Sucre en poudre 1 kg', 'Saint Louis', 'Sucre blanc cristallisé', 900, 'paquet', '🧂'],
  ['Épicerie', 'Spaghetti 500 g', 'Panzani', 'Pâtes alimentaires', 750, 'paquet', '🍝'],
  ['Épicerie', 'Tomate concentrée 400 g', 'Gino', 'Double concentré de tomate', 600, 'boîte', '🥫'],
  ['Épicerie', 'Café soluble 100 g', 'Nescafé', 'Café instantané', 2800, 'pot', '☕'],
  ['Fruits & Légumes', 'Bananes plantains', 'Local', 'Régime de plantains mûrs', 1500, 'régime', '🍌'],
  ['Fruits & Légumes', 'Tomates fraîches 1 kg', 'Local', 'Tomates du marché Dantokpa', 800, 'kg', '🍅'],
  ['Fruits & Légumes', 'Oignons 1 kg', 'Local', 'Oignons rouges', 700, 'kg', '🧅'],
  ['Fruits & Légumes', 'Ananas pain de sucre', 'Allada', 'Ananas sucré du plateau', 600, 'pièce', '🍍'],
  ['Fruits & Légumes', 'Mangues 1 kg', 'Local', 'Mangues de saison', 900, 'kg', '🥭'],
  ['Boissons', 'Eau minérale 1,5 L (pack 6)', 'Possotomè', 'Pack de 6 bouteilles', 2400, 'pack', '💧'],
  ['Boissons', 'Coca-Cola 1,5 L', 'Coca-Cola', 'Boisson gazeuse', 900, 'bouteille', '🥤'],
  ['Boissons', "Jus d'ananas 1 L", 'Fruité', 'Jus de fruit naturel', 1100, 'brique', '🧃'],
  ['Boissons', 'Bière La Béninoise (pack 6)', 'SOBEBRA', 'Bière blonde locale', 3600, 'pack', '🍺'],
  ['Hygiène & Beauté', 'Savon de Marseille', 'Le Chat', 'Savon multi-usage', 500, 'pièce', '🧼'],
  ['Hygiène & Beauté', 'Dentifrice 100 ml', 'Signal', 'Protection complète', 850, 'tube', '🪥'],
  ['Hygiène & Beauté', 'Gel douche 250 ml', 'Dove', 'Hydratation intense', 1900, 'flacon', '🧴'],
  ['Hygiène & Beauté', 'Papier hygiénique x8', 'Lotus', 'Rouleaux double épaisseur', 2200, 'paquet', '🧻'],
  ['Produits laitiers', 'Lait concentré sucré', 'Nestlé', 'Boîte 397 g', 950, 'boîte', '🥛'],
  ['Produits laitiers', 'Yaourt nature x4', 'Danone', 'Pack de 4 pots', 1600, 'pack', '🍶'],
  ['Produits laitiers', 'Beurre doux 250 g', 'President', 'Beurre de table', 2100, 'plaquette', '🧈'],
  ['Viandes & Poissons', 'Poulet entier ~1,5 kg', 'Local', 'Poulet bicyclette', 4500, 'pièce', '🍗'],
  ['Viandes & Poissons', 'Poisson chinchard 1 kg', 'Local', 'Poisson frais', 2000, 'kg', '🐟'],
  ['Viandes & Poissons', 'Œufs (plateau de 30)', 'Local', 'Œufs frais', 2700, 'plateau', '🥚'],
  ['Boulangerie', 'Pain baguette', 'Local', 'Baguette croustillante', 200, 'pièce', '🥖'],
  ['Boulangerie', 'Croissant au beurre', 'Local', 'Viennoiserie', 350, 'pièce', '🥐'],
  ['Bébé & Enfant', 'Couches taille 3 x40', 'Pampers', 'Couches bébé', 6800, 'paquet', '🍼'],
  ['Bébé & Enfant', 'Lait infantile 400 g', 'Guigoz', 'Lait 2e âge', 5400, 'boîte', '🍼']
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const stockLevels = [0, 4, 8, 12, 25, 40, 60, 100];
const products = supermarkets.flatMap(({ id: supermarket_id }) => catalogue.map(
  ([category, name, brand, description, basePrice, unit, image_emoji]) => ({
    supermarket_id,
    category_id: categoryIds[category],
    name,
    brand,
    description,
    price: Math.round(basePrice * (1 + rand(-5, 8) / 100) / 25) * 25,
    unit,
    stock: stockLevels[rand(0, stockLevels.length - 1)],
    image_emoji
  })
));
throwIfSupabaseError(await supabase.from('products').insert(products));
throwIfSupabaseError(await supabase.from('promotions').insert([
  { name: 'Promo de lancement', percent: 10, scope: 'global' },
  { name: 'Fraîcheur du jour', percent: 15, scope: 'category', scope_id: categoryIds['Fruits & Légumes'] }
]));
throwIfSupabaseError(await supabase.from('notifications').insert({
  user_id: client.id,
  title: 'Bienvenue sur HyperMarket Cotonou 🎉',
  body: 'Profitez de -10% sur votre première commande grâce à la promo de lancement.',
  type: 'promo'
}));

console.log('Base Supabase peuplée avec succès.');
console.log(`   • ${supermarkets.length} supermarchés`);
console.log(`   • ${categories.length} catégories`);
console.log(`   • ${products.length} produits`);
console.log(`   • Comptes de démonstration recréés (admin@hypermarket.bj / admin123, client@hypermarket.bj / client123)`);
console.log(`   • Administrateur interne : ${admin.id}`);
