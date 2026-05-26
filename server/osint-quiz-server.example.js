/**
 * NETEK OSINT + QUIZ SERVER EXAMPLE
 * Legal-first public-data pipeline for Mozambique trends and quizzes.
 *
 * Install:
 *   npm i express cors helmet morgan node-cron rss-parser axios cheerio
 * Run:
 *   node osint-quiz-server.example.js
 *
 * Legal/Safety principles:
 * - Prefer official APIs and RSS feeds.
 * - Respect robots.txt, rate limits and terms of service.
 * - Do not scrape private profiles or private groups.
 * - Store only public, non-sensitive metadata with source URLs.
 * - Require user consent before profile enrichment.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// In production: PostgreSQL/Firestore tables.
const db = {
  trends: [],
  quizzes: [],
  profiles: [],
  leaderboard: [],
  sources: [
    { id: 'rss-noticias', type: 'rss', name: 'Portal Notícias MZ', url: 'https://example.com/rss.xml', trust: 0.8, active: true },
    { id: 'rss-governo', type: 'rss', name: 'Comunicados Governo', url: 'https://example.gov.mz/rss.xml', trust: 0.95, active: true },
    { id: 'yt-public', type: 'api', name: 'YouTube Data API', url: 'https://www.googleapis.com/youtube/v3', trust: 0.9, active: false },
    { id: 'openstreetmap', type: 'api', name: 'OpenStreetMap/Overpass', url: 'https://overpass-api.de/api/interpreter', trust: 0.85, active: true },
  ],
};

function generateQuizFromTrend(trend) {
  const options = [trend.label, 'Matapa', 'Nampula', 'Marrabenta'];
  return {
    id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: trend.type === 'music' ? 'Música e Artistas' : 'Notícias e Manchetes',
    question: `Qual tópico apareceu nas tendências das últimas 24h?`,
    options: options.sort(() => Math.random() - 0.5),
    answer: options.indexOf(trend.label),
    source: trend.source,
    trendId: trend.id,
    approved: false,
    createdAt: new Date().toISOString(),
  };
}

async function runScrape() {
  const now = new Date().toISOString();
  // Example RSS pass. Replace example URLs with legal RSS/API sources.
  for (const src of db.sources.filter(s => s.active && s.type === 'rss')) {
    try {
      // const feed = await parser.parseURL(src.url);
      // feed.items.slice(0, 10).forEach(item => ...)
      // Demo trend until real URLs are configured:
      const trend = {
        id: `trend-${Date.now()}-${src.id}`,
        label: src.id.includes('governo') ? 'Comunicado oficial do Governo' : 'Manchetes de Moçambique',
        type: 'news',
        source: src.name,
        sourceUrl: src.url,
        score: Math.round(70 + Math.random() * 25),
        capturedAt: now,
      };
      db.trends.unshift(trend);
      db.quizzes.unshift(generateQuizFromTrend(trend));
    } catch (err) {
      console.error('Scrape failed:', src.name, err.message);
    }
  }
  db.trends = db.trends.slice(0, 200);
  db.quizzes = db.quizzes.slice(0, 300);
  return { trends: db.trends.length, quizzes: db.quizzes.length };
}

// Once per day at 03:00. Admin can change frequency in production.
cron.schedule('0 3 * * *', runScrape);

app.post('/api/osint/scrape/force', async (_req, res) => {
  const result = await runScrape();
  res.json({ ok: true, result });
});

app.get('/api/osint/trends', (_req, res) => res.json({ ok: true, trends: db.trends }));
app.get('/api/quizzes', (req, res) => {
  const category = req.query.category;
  const quizzes = category ? db.quizzes.filter(q => q.category === category) : db.quizzes;
  res.json({ ok: true, quizzes });
});

app.post('/api/quizzes/manual', (req, res) => {
  const q = { ...req.body, id: `manual-${Date.now()}`, approved: true, createdAt: new Date().toISOString() };
  db.quizzes.unshift(q);
  res.json({ ok: true, quiz: q });
});

app.post('/api/quizzes/answer', (req, res) => {
  const { quizId, option, userId, timeMs } = req.body;
  const quiz = db.quizzes.find(q => q.id === quizId);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const correct = option === quiz.answer;
  const speedBonus = Math.max(0, 20 - Math.floor((timeMs || 0) / 1000));
  const points = correct ? 10 + speedBonus : 0;
  db.leaderboard.push({ userId, points, quizId, correct, date: new Date().toISOString() });
  res.json({ ok: true, correct, points });
});

app.get('/api/quizzes/leaderboard', (_req, res) => {
  const summed = {};
  for (const row of db.leaderboard) summed[row.userId] = (summed[row.userId] || 0) + row.points;
  const ranking = Object.entries(summed).map(([userId, points]) => ({ userId, points })).sort((a, b) => b.points - a.points).slice(0, 50);
  res.json({ ok: true, ranking });
});

// Public profile enrichment: consent required.
app.post('/api/osint/profile/enrich', (req, res) => {
  const { username, province, consent } = req.body;
  if (!consent) return res.status(403).json({ error: 'Consent required' });
  // Production: query only public APIs/search indexes and store source URLs.
  const matches = [
    { name: 'Perfil público encontrado', username, province, source: 'Public search index', confidence: 0.71 },
    { name: 'Portfolio provável', username, province, source: 'GitHub/Behance public', confidence: 0.55 },
  ];
  res.json({ ok: true, matches });
});

app.listen(process.env.PORT || 4100, () => console.log('OSINT Quiz API on http://localhost:4100'));
