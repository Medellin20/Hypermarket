import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import notifRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Petit logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'HyperMarket Cotonou API' }));

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);          // supermarkets, categories, products, brands, promotions
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/admin', adminRoutes);

// 404 + erreurs
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Ne démarre le serveur que lorsqu'il est lancé directement (pas à l'import)
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
const isMain = argv[1] && fileURLToPath(import.meta.url) === argv[1];
if (isMain) {
  app.listen(PORT, () => {
    console.log(`\n🛒 HyperMarket Cotonou API → http://localhost:${PORT}`);
    console.log(`   Santé : http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
