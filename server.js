import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './src/config/env.js';
import authRoutes from './src/routes/auth.js';
import { getSessionUser } from './src/services/session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(publicDir, { index: false }));

app.use(authRoutes);

app.get('/', (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.redirect('/');
  }
  return res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.listen(config.port, () => {
  console.log(`LabFis server running at http://localhost:${config.port}`);
});
