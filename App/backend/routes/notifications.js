import { Router } from 'express';
import db from '../db/database.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(await db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id));
}));

router.get('/unread-count', auth, asyncHandler(async (req, res) => {
  const { c } = await db.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);
  res.json({ count: c });
}));

router.post('/:id/read', auth, asyncHandler(async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

router.post('/read-all', auth, asyncHandler(async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
}));

export default router;
