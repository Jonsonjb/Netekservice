import { useMemo, useState } from 'react';
import { WA } from '../data';
import { jobAreas, mockJobs, mozambiqueProvinces, type JobContract, type JobPosting, type JobWorkMode } from './jobsData';

type SortMode = 'recent' | 'salary_desc' | 'salary_asc';

const contractOptions: ('Todos' | JobContract)[] = ['Todos', 'Tempo inteiro', 'Part-time', 'Temporário', 'Freelance', 'Estágio'];
const workModeOptions: ('Todos' | JobWorkMode)[] = ['Todos', 'Presencial', 'Remoto', 'Híbrido'];

function waLink(message: string) {
  return `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;
}

function salary(job: JobPosting) {
  return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} ${job.currency}`;
}

function JobCard({ job, onOpen }: { job: JobPosting; onOpen: (job: JobPosting) => void }) {
  return (
    <article className="group rounded-2xl border border-slate-700 bg-slate-800/50 p-5 transition-all hover:-translate-y-1 hover:border-cyan-500/60 hover:bg-slate-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {job.urgent && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">URGENTE</span>}
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400">{job.area}</span>
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400">{job.workMode}</span>
          </div>
          <h3 className="text-lg font-bold leading-snug text-white group-hover:text-cyan-300">{job.title}</h3>
          <p className="mt-1 text-sm text-gray-400">{job.company}</p>
        </div>
        <div className="rounded-xl bg-slate-900 px-3 py-2 text-right">
          <p className="text-xs text-gray-500">Salário</p>
          <p className="whitespace-nowrap text-sm font-bold text-green-400">{salary(job)}</p>
        </div>
      </div>
      <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-400">{job.description}</p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span>📍 {job.city}, {job.province}</span>
        <span>🕒 {job.postedAt}</span>
        <span>📄 {job.contract}</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {job.skills.slice(0, 4).map(skill => <span key={skill} className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-gray-400">{skill}</span>)}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onOpen(job)} className="flex-1 rounded-xl bg-cyan-500/20 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-500/30">Ver detalhes</button>
        <a href={waLink(`Olá! Quero candidatar-me à vaga: ${job.title} (${job.company}).`)} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-green-500 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-green-600">Candidatar</a>
      </div>
    </article>
  );
}

function JobDetailsModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{job.area} · {job.contract}</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{job.title}</h2>
              <p className="mt-1 text-gray-400">{job.company} · {job.city}, {job.province}</p>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30">✕</button>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-gray-500">Salário</p><p className="font-bold text-green-400">{salary(job)}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-gray-500">Modo</p><p className="font-bold text-purple-400">{job.workMode}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-gray-500">Publicado</p><p className="font-bold text-cyan-400">{job.postedAt}</p></div>
          </div>
          <section>
            <h3 className="mb-2 font-bold text-white">Descrição</h3>
            <p className="leading-7 text-gray-400">{job.description}</p>
          </section>
          <section>
            <h3 className="mb-2 font-bold text-white">Requisitos</h3>
            <ul className="space-y-2">{job.requirements.map(req => <li key={req} className="flex gap-2 text-sm text-gray-400"><span className="text-cyan-400">✓</span>{req}</li>)}</ul>
          </section>
          <section>
            <h3 className="mb-2 font-bold text-white">Benefícios</h3>
            <ul className="space-y-2">{job.benefits.map(b => <li key={b} className="flex gap-2 text-sm text-gray-400"><span className="text-green-400">+</span>{b}</li>)}</ul>
          </section>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={waLink(`Olá! Quero candidatar-me à vaga: ${job.title}. Tenho interesse e gostaria de enviar o meu CV.`)} target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-green-500 px-5 py-3 text-center font-bold text-white hover:bg-green-600">Enviar candidatura via WhatsApp</a>
            <a href={waLink(`Olá! Quero receber vagas parecidas com: ${job.title}.`)} target="_blank" rel="noreferrer" className="flex-1 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-center font-bold text-cyan-300 hover:bg-cyan-500/20">Criar alerta de vagas</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RandstadJobSearchPage() {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('Todas');
  const [area, setArea] = useState('Todas');
  const [contract, setContract] = useState<'Todos' | JobContract>('Todos');
  const [workMode, setWorkMode] = useState<'Todos' | JobWorkMode>('Todos');
  const [sort, setSort] = useState<SortMode>('recent');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = mockJobs.filter(job => {
      const matchesQuery = !q || [job.title, job.company, job.description, job.city, ...job.skills].join(' ').toLowerCase().includes(q);
      const matchesProvince = province === 'Todas' || job.province === province;
      const matchesArea = area === 'Todas' || job.area === area;
      const matchesContract = contract === 'Todos' || job.contract === contract;
      const matchesMode = workMode === 'Todos' || job.workMode === workMode;
      return matchesQuery && matchesProvince && matchesArea && matchesContract && matchesMode;
    });
    if (sort === 'salary_desc') return [...result].sort((a, b) => b.salaryMax - a.salaryMax);
    if (sort === 'salary_asc') return [...result].sort((a, b) => a.salaryMin - b.salaryMin);
    return result;
  }, [query, province, area, contract, workMode, sort]);

  const clearFilters = () => {
    setQuery(''); setProvince('Todas'); setArea('Todas'); setContract('Todos'); setWorkMode('Todos'); setSort('recent');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400">SPRINT A · MOTOR DE BUSCA</span>
          <h1 className="text-4xl font-bold text-white">Motor de Busca de Empregos</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">Funcionalidade modular inspirada em Randstad: pesquisa, filtros, detalhes da vaga e candidatura.</p>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cargo, empresa, palavra-chave..." className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            <select value={province} onChange={e => setProvince(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500">{mozambiqueProvinces.map(p => <option key={p}>{p}</option>)}</select>
            <select value={area} onChange={e => setArea(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500">{jobAreas.map(a => <option key={a}>{a}</option>)}</select>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <select value={contract} onChange={e => setContract(e.target.value as 'Todos' | JobContract)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none">{contractOptions.map(c => <option key={c}>{c}</option>)}</select>
            <select value={workMode} onChange={e => setWorkMode(e.target.value as 'Todos' | JobWorkMode)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none">{workModeOptions.map(m => <option key={m}>{m}</option>)}</select>
            <select value={sort} onChange={e => setSort(e.target.value as SortMode)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"><option value="recent">Mais recentes</option><option value="salary_desc">Maior salário</option><option value="salary_asc">Menor salário</option></select>
            <button onClick={clearFilters} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-slate-800">Limpar filtros</button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-400"><span className="font-bold text-cyan-400">{filteredJobs.length}</span> vagas encontradas</p>
          <a href={waLink('Olá! Quero publicar uma vaga de emprego no motor de busca Netek.')} target="_blank" rel="noreferrer" className="rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30">Publicar vaga</a>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800/50 p-12 text-center">
            <div className="mb-3 text-5xl">🔎</div>
            <h3 className="text-xl font-bold text-white">Nenhuma vaga encontrada</h3>
            <p className="mt-2 text-gray-400">Tente remover filtros ou pesquisar por outra palavra-chave.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map(job => <JobCard key={job.id} job={job} onOpen={setSelectedJob} />)}
          </div>
        )}
      </div>
    </section>
  );
}
