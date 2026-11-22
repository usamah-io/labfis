import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './src/config/env.js';
import { attachCurrentUser, requireAuthPage } from './src/middleware/auth.js';
import authRoutes from './src/routes/auth.js';
import inventoryRoutes from './src/routes/inventory.js';
import loansRoutes from './src/routes/loans.js';
import usersRoutes from './src/routes/users.js';
import { initDb } from './src/services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

initDb();

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(
  express.static(publicDir, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(`${path.sep}sw.js`) || filePath.endsWith('/sw.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.endsWith(`${path.sep}manifest.json`) || filePath.endsWith('/manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      }
    },
  })
);
app.use(attachCurrentUser);

app.use(authRoutes);
app.use(inventoryRoutes);
app.use(loansRoutes);
app.use(usersRoutes);

app.get('/', (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/login', (req, res) => {
  return res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/pinjam', requireAuthPage, (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/profil', requireAuthPage, (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`LabFis server running at http://localhost:${config.port}`);
});
