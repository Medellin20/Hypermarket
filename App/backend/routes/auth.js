import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { auth, JWT_SECRET } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    JWT_SECRET, { expiresIn: '7d' }
  );
}

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

  const exists = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare(
    `INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)`
  );
  let inserted;
  try {
    inserted = await info.run(full_name, email, phone || null, hash);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    throw error;
  }

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(inserted.lastInsertRowid);

  await db.prepare(
    `INSERT INTO notifications (user_id, title, body, type)
     VALUES (?, 'Bienvenue 🎉', 'Votre compte HyperMarket Cotonou est prêt.', 'info')`
  ).run(user.id);

  res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
}));

// Connexion -------------------------------------------------------------
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !await bcrypt.compare(password, user.password_hash))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  res.json({ token: tokenFor(user), user: publicUser(user) });
}));

// Profil courant --------------------------------------------------------
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const addresses = await db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(user.id);
  res.json({ user: publicUser(user), addresses });
}));

// Ajout d'une adresse ---------------------------------------------------
router.post('/addresses', auth, asyncHandler(async (req, res) => {
  const { label, quarter, details, is_default } = req.body;
  if (!label || !quarter) return res.status(400).json({ error: 'Libellé et quartier requis' });
  const inserted = await db.transaction(async (tx) => {
    if (is_default)
      await tx.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    return tx.prepare(
      `INSERT INTO addresses (user_id, label, quarter, details, is_default)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.user.id, label, quarter, details || null, is_default ? 1 : 0);
  })();
  res.status(201).json(await db.prepare('SELECT * FROM addresses WHERE id = ?').get(inserted.lastInsertRowid));
}));

export default router;
