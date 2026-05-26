/**
 * NETEK LIBRARY SERVER EXAMPLE
 * Node.js + Express backend for legal public-domain/open-access books.
 *
 * Run separately from the Vite frontend:
 *   mkdir server && cd server
 *   npm init -y
 *   npm i express cors multer axios helmet morgan
 *   node library-server.example.js
 *
 * Folders created:
 *   /uploads/livros  -> manual uploads and external download cache
 *   /uploads/tmp     -> temporary upload folder
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const ROOT = __dirname;
const BOOK_DIR = path.join(ROOT, 'uploads', 'livros');
const TMP_DIR = path.join(ROOT, 'uploads', 'tmp');

fs.mkdirSync(BOOK_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

app.use(cors({ origin: ['http://localhost:5173', 'https://jonsonjb.github.io'] }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads/livros', express.static(BOOK_DIR));

// Simple mock auth middleware. Production: verify JWT role admin/mod.
function requireAdmin(req, res, next) {
  const role = req.headers['x-role'];
  if (role !== 'admin' && role !== 'moderator') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['application/pdf', 'text/plain', 'application/epub+zip'].includes(file.mimetype);
    cb(ok ? null : new Error('Formato não permitido'), ok);
  }
});

// Metadata cache. Production: move to PostgreSQL/Firestore.
const catalog = new Map();

function safeName(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9._-]+/gi, '_').slice(0, 120);
}

// Search external APIs. This example queries Open Library search endpoint.
app.get('/api/books/search', async (req, res) => {
  const q = req.query.q || 'mozambique history';
  const category = req.query.category || '';
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const books = (data.docs || []).map((b) => ({
      source: 'Open Library',
      externalId: b.key,
      title: b.title,
      author: (b.author_name || ['Desconhecido']).join(', '),
      year: b.first_publish_year,
      category,
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
      readUrl: b.key ? `https://openlibrary.org${b.key}` : null,
      downloadable: Boolean(b.ia && b.ia.length),
      ia: b.ia?.[0] || null,
    }));
    res.json({ ok: true, books });
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Erro ao consultar Open Library' });
  }
});

// Download/cache an external public-domain file.
// Body: { id, title, downloadUrl }
app.post('/api/books/download', async (req, res) => {
  const { id, title, downloadUrl } = req.body;
  if (!id || !title || !downloadUrl) return res.status(400).json({ error: 'Dados incompletos' });

  const filename = `${safeName(id)}-${safeName(title)}.bin`;
  const localPath = path.join(BOOK_DIR, filename);

  try {
    if (!fs.existsSync(localPath)) {
      const response = await axios.get(downloadUrl, { responseType: 'stream', timeout: 30000 });
      await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(localPath);
        response.data.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
      });
      catalog.set(id, { id, title, filename, source: downloadUrl, cachedAt: new Date().toISOString() });
    }
    res.download(localPath, filename);
  } catch (err) {
    res.status(502).json({ error: 'Falha ao baixar/cachear livro' });
  }
});

// Manual upload for authorized PDFs/EPUB/TXT.
app.post('/api/admin/books/upload', requireAdmin, upload.single('book'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Ficheiro obrigatório' });
  const title = req.body.title || file.originalname;
  const category = req.body.category || 'Outros';
  const filename = `${Date.now()}-${safeName(file.originalname)}`;
  const dest = path.join(BOOK_DIR, filename);
  fs.renameSync(file.path, dest);
  const id = `manual-${Date.now()}`;
  catalog.set(id, { id, title, category, filename, manual: true, uploadedAt: new Date().toISOString() });
  res.json({ ok: true, id, title, category, url: `/uploads/livros/${filename}` });
});

app.get('/api/admin/books/cache', requireAdmin, (_req, res) => {
  res.json({ ok: true, cache: Array.from(catalog.values()) });
});

app.delete('/api/admin/books/:id', requireAdmin, (req, res) => {
  const item = catalog.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Livro não encontrado' });
  try { fs.unlinkSync(path.join(BOOK_DIR, item.filename)); } catch {}
  catalog.delete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Netek Library API running at http://localhost:${PORT}`));
