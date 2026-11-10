import { Router } from 'express';
import { supabase, supabaseAuth, throwIfSupabaseError } from '../db/supabase.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id, full_name: u.full_name, email: u.email,
    phone: u.phone, role: u.role, loyalty_credits: u.loyalty_credits
  };
}

// Inscription -----------------------------------------------------------
router.post('/register', asyncHandler(async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });

  const { data: exists, error: lookupError } = await supabase
    .from('users').select('id').eq('email', email).maybeSingle();
  if (lookupError) throw lookupError;
  if (exists) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  });
  if (authError) {
    if (authError.code === 'email_exists')
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    throw authError;
  }

  let user;
  try {
    user = throwIfSupabaseError(await supabase.from('users').insert({
      auth_user_id: authData.user.id,
      full_name,
      email,
      phone: phone || null,
      role: 'client'
    }).select('id, full_name, email, phone, role, loyalty_credits').single());
    throwIfSupabaseError(await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Bienvenue 🎉',
      body: 'Votre compte HyperMarket Cotonou est prêt.',
      type: 'info'
    }));
  } catch (error) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(authData.user.id);
    if (cleanupError) console.error('Échec du nettoyage du compte Supabase Auth :', cleanupError);
    if (error.code === '23505')
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    throw error;
  }

  const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  if (sessionError) throw sessionError;
  res.status(201).json({ token: sessionData.session.access_token, user: publicUser(user) });
}));

// Connexion -------------------------------------------------------------
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  if (sessionError?.code === 'invalid_credentials' || sessionError?.status === 400)
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  if (sessionError) throw sessionError;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, loyalty_credits')
    .eq('auth_user_id', sessionData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!user) return res.status(403).json({ error: 'Compte à réactiver auprès du support' });
  res.json({ token: sessionData.session.access_token, user: publicUser(user) });
}));

// Profil courant --------------------------------------------------------
router.get('/me', auth, asyncHandler(async (req, res) => {
  const { data: addresses, error } = await supabase
    .from('addresses').select('*').eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ user: publicUser(req.user), addresses });
}));

// Ajout d'une adresse ---------------------------------------------------
router.post('/addresses', auth, asyncHandler(async (req, res) => {
  const { label, quarter, details, is_default } = req.body;
  if (!label || !quarter) return res.status(400).json({ error: 'Libellé et quartier requis' });
  const address = throwIfSupabaseError(await supabase.rpc('add_user_address', {
    p_user_id: req.user.id,
    p_label: label,
    p_quarter: quarter,
    p_details: details || null,
    p_is_default: Boolean(is_default)
  }));
  res.status(201).json(address);
}));

export default router;
