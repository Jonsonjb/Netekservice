/**
 * Sprint A - Motor de Busca de Empregos
 * Backend exemplo Node.js + Express.
 *
 * Como testar:
 *   cd server
 *   npm init -y
 *   npm i express cors helmet morgan
 *   node randstad-jobs-api.example.js
 *
 * Endpoints:
 *   GET  /api/jobs
 *   GET  /api/jobs/:id
 *   POST /api/jobs/:id/apply
 *   POST /api/jobs/alerts
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const jobs = [
  {
    id: 'job-001', title: 'Técnico de Suporte Informático', company: 'Netek Services Partner',
    province: 'Maputo Cidade', city: 'Maputo', area: 'Tecnologia', contract: 'Tempo inteiro',
    workMode: 'Presencial', salaryMin: 18000, salaryMax: 28000, currency: 'MT', urgent: true,
    description: 'Prestar suporte técnico, configurar redes e resolver incidentes.',
    requirements: ['Windows', 'Redes', 'Boa comunicação'], benefits: ['Formação', 'Transporte']
  },
  {
    id: 'job-002', title: 'Programador Front-end React', company: 'Startup Digital MZ',
    province: 'Maputo Cidade', city: 'Remoto', area: 'Tecnologia', contract: 'Freelance',
    workMode: 'Remoto', salaryMin: 45000, salaryMax: 90000, currency: 'MT', urgent: true,
    description: 'Desenvolver interfaces React e integrar APIs.',
    requirements: ['React', 'TypeScript', 'Git'], benefits: ['Remoto', 'Milestones']
  }
];

const applications = [];
const alerts = [];

app.get('/api/jobs', (req, res) => {
  const { q = '', province = 'Todas', area = 'Todas', contract = 'Todos', workMode = 'Todos' } = req.query;
  const query = String(q).toLowerCase();
  const result = jobs.filter(job => {
    const matchesQuery = !query || [job.title, job.company, job.description, job.city].join(' ').toLowerCase().includes(query);
    const matchesProvince = province === 'Todas' || job.province === province;
    const matchesArea = area === 'Todas' || job.area === area;
    const matchesContract = contract === 'Todos' || job.contract === contract;
    const matchesMode = workMode === 'Todos' || job.workMode === workMode;
    return matchesQuery && matchesProvince && matchesArea && matchesContract && matchesMode;
  });
  res.json({ ok: true, count: result.length, jobs: result });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: 'Vaga não encontrada' });
  res.json({ ok: true, job });
});

app.post('/api/jobs/:id/apply', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: 'Vaga não encontrada' });
  const { name, email, phone, cvUrl, message } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ ok: false, error: 'Nome, email e telefone são obrigatórios' });
  const application = { id: `app-${Date.now()}`, jobId: job.id, jobTitle: job.title, name, email, phone, cvUrl, message, status: 'received', createdAt: new Date().toISOString() };
  applications.push(application);
  res.status(201).json({ ok: true, application });
});

app.post('/api/jobs/alerts', (req, res) => {
  const { email, keyword, province, area } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'Email obrigatório' });
  const alert = { id: `alert-${Date.now()}`, email, keyword, province, area, createdAt: new Date().toISOString() };
  alerts.push(alert);
  res.status(201).json({ ok: true, alert });
});

app.listen(process.env.PORT || 4200, () => {
  console.log('Randstad-like Jobs API running on http://localhost:4200');
});
