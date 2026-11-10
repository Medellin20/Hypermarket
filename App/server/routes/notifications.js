import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('notifications').select('*')
    .eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  res.json(data);
}));

router.get('/unread-count', auth, asyncHandler(async (req, res) => {
  const { count, error } = await supabase.from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id).eq('is_read', 0);
  if (error) throw error;
  res.json({ count });
}));

router.post('/:id/read', auth, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ is_read: 1 })
    .eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ ok: true });
}));

router.post('/read-all', auth, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ is_read: 1 })
    .eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ ok: true });
}));

export default router;
