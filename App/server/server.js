import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import notifRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const api = express();

api.use('/api', cors());
api.use('/api', express.json());
api.use('/api', (req, _res, next) => {
  console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.url}`);
  next();
});

api.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'HyperMarket Cotonou API' }));

api.use('/api/auth', authRoutes);
api.use('/api', catalogRoutes);
api.use('/api/orders', orderRoutes);
api.use('/api/notifications', notifRoutes);
api.use('/api/admin', adminRoutes);

api.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));
api.use('/api', (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

export default api;
