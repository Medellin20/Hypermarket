import { supabase } from '../db/supabase.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError?.status === 401 || authError?.status === 403)
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    if (authError) throw authError;
    if (!authData.user?.email) return res.status(401).json({ error: 'Token invalide ou expiré' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, loyalty_credits')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'Compte HyperMarket introuvable' });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Réserve la route aux administrateurs
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  next();
}
