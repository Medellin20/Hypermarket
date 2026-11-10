import 'dotenv/config';
import express from 'express';
import next from 'next';
import api from './server/server.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
await nextApp.prepare();

const app = express();
const port = Number(process.env.PORT || 3000);
const handleNextRequest = nextApp.getRequestHandler();

app.use(api);
app.use((req, res) => handleNextRequest(req, res));

app.listen(port, () => {
  console.log(`HyperMarket disponible sur http://localhost:${port}`);
});
