import { useMemo, useRef, useState } from 'react';
import { WA_BUSINESS } from './data';

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  source: string;
  format: 'TXT' | 'PDF' | 'EPUB';
  description: string;
  content: string;
  externalUrl: string;
  cover: string;
  pages: string[];
};

const books: Book[] = [
  { id: 'g1', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Literatura', source: 'Project Gutenberg', format: 'TXT', cover: '📖', description: 'Clássico de domínio público.', externalUrl: 'https://www.gutenberg.org/ebooks/1342', content: 'It is a truth universally acknowledged...', pages: ['Pride and Prejudice\nJane Austen', 'It is a truth universally acknowledged...', 'Para o texto completo use a fonte oficial.'] },
  { id: 'g2', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Literatura', source: 'Project Gutenberg', format: 'TXT', cover: '🕵️', description: 'Contos clássicos de Sherlock Holmes.', externalUrl: 'https://www.gutenberg.org/ebooks/1661', content: 'To Sherlock Holmes she is always the woman...', pages: ['Sherlock Holmes', 'To Sherlock Holmes she is always the woman...', 'Texto completo disponível no Project Gutenberg.'] },
  { id: 'm1', title: 'Matemática Básica para Estudo', author: 'OER', category: 'Didáticos/Estudo', source: 'Open Library/OER', format: 'PDF', cover: '📐', description: 'Revisão de matemática básica.', externalUrl: 'https://openlibrary.org/', content: 'Números, operações e problemas.', pages: ['Matemática Básica', 'Calcule 15% de 2.000 MT = 300 MT', 'Use OER para aprofundar estudos.'] },
  { id: 't1', title: 'Introdução à Web Moderna', author: 'MDN/Comunidade', category: 'Tecnologia', source: 'MDN', format: 'TXT', cover: '🌐', description: 'HTML, CSS e JavaScript.', externalUrl: 'https://developer.mozilla.org/', content: 'A Web é construída com HTML, CSS e JavaScript.', pages: ['Introdução à Web', 'HTML estrutura', 'CSS visual', 'JavaScript interatividade'] },
  { id: 'c1', title: 'Histórias Curtas para Crianças', author: 'Contos Populares', category: 'Crianças', source: 'Domínio Público', format: 'TXT', cover: '🧒', description: 'Histórias educativas infantis.', externalUrl: '#', content: 'Era uma vez uma criança curiosa...', pages: ['Histórias para Crianças', 'Era uma vez uma criança curiosa.', 'Moral: ler abre caminhos.'] },
  { id: 'h1', title: 'Notas de História de Moçambique', author: 'Fontes abertas', category: 'História', source: 'OER/Governo', format: 'PDF', cover: '🇲🇿', description: 'Resumo educativo de história e cidadania.', externalUrl: '#', content: 'Moçambique tem uma história rica...', pages: ['História de Moçambique', 'Comércio no Índico', 'Independência: 25 de Junho de 1975', 'Cidadania digital.'] },
  { id: 'a1', title: 'Hábitos de Estudo e Produtividade', author: 'Netek Academy', category: 'Autoajuda', source: 'Netek', format: 'TXT', cover: '🌱', description: 'Guia prático de foco e produtividade.', externalUrl: '#', content: 'A produtividade começa com clareza.', pages: ['Hábitos de Estudo', 'Defina metas claras', 'Use blocos de foco', 'Registe progresso.'] },
  { id: 'ag1', title: 'Manual Aberto de Agricultura Familiar', author: 'OER Rural', category: 'Didáticos/Estudo', source: 'OER/Governo', format: 'PDF', cover: '🌾', description: 'Agricultura familiar e boas práticas.', externalUrl: '#', content: 'Agricultura familiar depende de planeamento.', pages: ['Agricultura Familiar', 'Conservação do solo', 'Rotação de culturas', 'Registo de custos.'] },
];

const donationChannels = {
  mpesa: { label: 'M-Pesa', color: 'red', phone: '258840166592', ussd: '*150#' },
  emola: { label: 'E-Mola', color: 'orange', phone: '258874786943', ussd: '*898#' },
  mkesh: { label: 'M-Kesh', color: 'yellow', phone: '', ussd: '*500#' },
  paypal: { label: 'PayPal', color: 'blue', email: 'netekservice@gmail.com' },
};

function ussdLink(code: string) {
  return `tel:${code.replace('#', '%23')}`;
}

export function DonationWidget({ compact = false }: { compact?: boolean }) {
  const [amount, setAmount] = useState('50');
  const [custom, setCustom] = useState('');
  const value = custom || amount;
  const msg = `DONATIVO VOLUNTARIO NETEK\n\nQuero contribuir com ${value || 'um valor a minha escolha'} MT. Sei que os servicos sao gratuitos e este donativo e voluntario.`;
  return (
    <div className={`${compact ? 'p-4' : 'p-6'} rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-cyan-500/10`}>
      <div className="mb-4 flex gap-3">
        <span className="text-3xl">💚</span>
        <div>
          <h3 className="font-bold text-white">Donativo voluntário</h3>
          <p className="text-sm text-gray-400">Nossos serviços são 100% gratuitos. Se este sistema te ajudou, você escolhe se e quanto quer oferecer como donativo para nos ajudar a manter os servidores e o site em dia.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {['20', '50', '100', '250', '500'].map(v => (
          <button key={v} onClick={() => { setAmount(v); setCustom(''); }} className={`rounded-xl px-3 py-2 text-sm ${amount === v && !custom ? 'bg-green-500 text-white' : 'border border-slate-700 bg-slate-800 text-gray-400'}`}>{v} MT</button>
        ))}
        <input value={custom} onChange={e => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="Outro" className="w-24 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white" />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <a href={ussdLink(donationChannels.mpesa.ussd)} className="rounded-xl bg-red-500 px-3 py-2.5 text-center text-sm font-bold text-white">🔴 M-Pesa<br/><span className="text-xs font-normal">{donationChannels.mpesa.ussd}</span></a>
        <a href={ussdLink(donationChannels.emola.ussd)} className="rounded-xl bg-orange-500 px-3 py-2.5 text-center text-sm font-bold text-white">🟠 E-Mola<br/><span className="text-xs font-normal">{donationChannels.emola.ussd}</span></a>
        <a href={ussdLink(donationChannels.mkesh.ussd)} className="rounded-xl bg-yellow-500 px-3 py-2.5 text-center text-sm font-bold text-black">🟡 M-Kesh<br/><span className="text-xs font-normal">{donationChannels.mkesh.ussd}</span></a>
        <a href={`https://www.paypal.com/paypalme/${donationChannels.paypal.email}`} target="_blank" rel="noreferrer" className="rounded-xl border border-blue-500/30 bg-blue-500/20 px-3 py-2.5 text-center text-sm font-bold text-blue-300">PayPal<br/><span className="text-xs font-normal">netekservice</span></a>
      </div>
      <a href={`https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-slate-800 px-4 py-2.5 text-center text-sm font-semibold text-gray-200 hover:bg-slate-700">Enviar comprovativo pelo WhatsApp</a>
    </div>
  );
}

function Reader({ book, onClose }: { book: Book; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [font, setFont] = useState(18);
  const [night, setNight] = useState(true);
  const pages = book.pages.length ? book.pages : [book.content];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-700 p-4">
          <span className="text-3xl">{book.cover}</span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-bold text-white">{book.title}</h2><p className="text-xs text-gray-500">{book.author} · {book.source} · {book.format}</p></div>
          <button onClick={() => setFont(f => Math.max(14, f - 2))} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-gray-300">A-</button>
          <button onClick={() => setFont(f => Math.min(28, f + 2))} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-gray-300">A+</button>
          <button onClick={() => setNight(!night)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-gray-300">{night ? '☀️' : '🌙'}</button>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-red-500/20 text-red-400">✕</button>
        </div>
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 ${night ? 'bg-[#0b1220] text-gray-200' : 'bg-amber-50 text-gray-900'}`}><article style={{ fontSize: font }} className="mx-auto max-w-3xl whitespace-pre-wrap leading-relaxed">{pages[page]}</article></div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-700 p-4"><button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-xl bg-slate-800 px-4 py-2 text-white disabled:opacity-40">← Página anterior</button><div className="text-sm text-gray-400">Página {page + 1} de {pages.length}</div><button onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1} className="rounded-xl bg-slate-800 px-4 py-2 text-white disabled:opacity-40">Próxima →</button></div>
      </div>
    </div>
  );
}

export function LibraryPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');
  const [reader, setReader] = useState<Book | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>(() => JSON.parse(localStorage.getItem('netek_downloaded_books') || '[]'));
  const cats = ['Todos', ...Array.from(new Set(books.map(b => b.category)))];
  const filtered = useMemo(() => books.filter(b => {
    const s = search.toLowerCase();
    return (cat === 'Todos' || b.category === cat) && (!s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || b.category.toLowerCase().includes(s));
  }), [search, cat]);
  const metric = (b: Book, k: 'reads' | 'downloads') => {
    const m = JSON.parse(localStorage.getItem('netek_library_metrics') || '{}');
    m[b.id] = { ...(m[b.id] || {}), [k]: ((m[b.id]?.[k] || 0) + 1), category: b.category, title: b.title };
    localStorage.setItem('netek_library_metrics', JSON.stringify(m));
  };
  const download = (b: Book) => {
    const blob = new Blob([`${b.title}\n${b.author}\nFonte: ${b.source}\n\n${b.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `${b.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`; a.click(); URL.revokeObjectURL(url);
    const next = Array.from(new Set([...downloaded, b.id])); setDownloaded(next); localStorage.setItem('netek_downloaded_books', JSON.stringify(next)); metric(b, 'downloads');
  };
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      {reader && <Reader book={reader} onClose={() => setReader(null)} />}
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center"><span className="mb-4 inline-block rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">📚 BIBLIOTECA DIGITAL</span><h1 className="mb-4 text-4xl font-bold text-white">Livros Gratuitos e Legais</h1><p className="mx-auto max-w-2xl text-gray-400">Domínio público, Open Library, Project Gutenberg e fontes educacionais abertas. Leia online ou baixe legalmente.</p></div>
        <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="text-sm text-emerald-300">✅ Todos os livros são de domínio público, OER ou previews com fonte oficial.</p></div>
        <div className="mb-6 flex flex-col gap-3 lg:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Pesquisar por título, autor ou categoria..." className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-white focus:border-emerald-500 focus:outline-none"/><select value={cat} onChange={e => setCat(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white">{cats.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="mb-8 flex flex-wrap gap-2">{cats.map(c => <button key={c} onClick={() => setCat(c)} className={`rounded-xl px-3 py-2 text-xs font-medium ${cat === c ? 'bg-emerald-500 text-white' : 'border border-slate-700 bg-slate-800 text-gray-400'}`}>{c}</button>)}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(b => <div key={b.id} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 transition-all hover:-translate-y-1 hover:border-emerald-500/50"><div className="mb-4 text-center text-6xl">{b.cover}</div><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">{b.category}</span><span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-gray-300">{b.format}</span>{downloaded.includes(b.id) && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">Baixado</span>}</div><h3 className="mb-1 line-clamp-2 text-sm font-semibold text-white">{b.title}</h3><p className="mb-2 text-xs text-gray-500">por {b.author}</p><p className="mb-4 line-clamp-3 text-xs text-gray-400">{b.description}</p><div className="mb-2 flex gap-2"><button onClick={() => { setReader(b); metric(b, 'reads'); }} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white">📖 Ler Online</button><button onClick={() => download(b)} className="rounded-xl bg-slate-700 px-3 py-2 text-xs text-white">⬇️</button></div>{b.externalUrl !== '#' && <a href={b.externalUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-emerald-400">Fonte oficial</a>}</div>)}</div>
        <div className="mt-10"><DonationWidget /></div>
      </div>
    </section>
  );
}

type Cell = 'empty' | 'wall' | 'door' | 'window' | 'bed' | 'table' | 'sofa' | 'tree' | 'kitchen' | 'bath';
const L: Record<Cell, string> = { empty: '', wall: '🧱', door: '🚪', window: '🪟', bed: '🛏️', table: '🪑', sofa: '🛋️', tree: '🌳', kitchen: '🍳', bath: '🚿' };
const toolNames: Record<Cell, string> = { empty: 'Apagar', wall: 'Parede', door: 'Porta', window: 'Janela', bed: 'Cama', table: 'Mesa', sofa: 'Sofá', tree: 'Árvore', kitchen: 'Cozinha', bath: 'Banho' };
const size = 14;

type Room = { id: number; cells: number[]; area: number; name: string; center: { x: number; y: number }; items: Partial<Record<Cell, number>> };

function defaultPlan(): Cell[] {
  const g = Array(size * size).fill('empty') as Cell[];
  const idx = (x: number, y: number) => y * size + x;
  for (let x = 0; x < size; x++) { g[idx(x, 0)] = 'wall'; g[idx(x, size - 1)] = 'wall'; }
  for (let y = 0; y < size; y++) { g[idx(0, y)] = 'wall'; g[idx(size - 1, y)] = 'wall'; }
  for (let y = 1; y < size - 1; y++) if (![4, 9].includes(y)) g[idx(5, y)] = 'wall';
  for (let x = 1; x < size - 1; x++) if (![2, 8, 11].includes(x)) g[idx(x, 7)] = 'wall';
  for (let y = 1; y < 7; y++) if (![3].includes(y)) g[idx(9, y)] = 'wall';
  g[idx(5, 4)] = 'door'; g[idx(5, 9)] = 'door'; g[idx(2, 7)] = 'door'; g[idx(8, 7)] = 'door'; g[idx(11, 7)] = 'door';
  g[idx(2, 0)] = 'window'; g[idx(10, 0)] = 'window'; g[idx(13, 4)] = 'window'; g[idx(13, 10)] = 'window';
  g[idx(2, 2)] = 'sofa'; g[idx(3, 3)] = 'table'; g[idx(7, 2)] = 'bed'; g[idx(11, 2)] = 'kitchen'; g[idx(11, 5)] = 'bath'; g[idx(2, 10)] = 'bed'; g[idx(8, 10)] = 'table'; g[idx(12, 12)] = 'tree';
  return g;
}

function computeRooms(grid: Cell[]): Room[] {
  const visited = new Set<number>();
  const rooms: Room[] = [];
  const names = ['Sala de Estar', 'Quarto Principal', 'Cozinha', 'Casa de Banho', 'Quarto 2', 'Escritório', 'Área Exterior'];
  const passable = (c: Cell) => c !== 'wall' && c !== 'window';
  for (let i = 0; i < grid.length; i++) {
    if (visited.has(i) || !passable(grid[i])) continue;
    const queue = [i], cells: number[] = []; visited.add(i);
    while (queue.length) {
      const cur = queue.shift()!; cells.push(cur);
      const x = cur % size, y = Math.floor(cur / size);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, ni = ny * size + nx;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited.has(ni) && passable(grid[ni])) { visited.add(ni); queue.push(ni); }
      });
    }
    if (cells.length < 4) continue;
    const items: Partial<Record<Cell, number>> = {};
    cells.forEach(ci => { if (grid[ci] !== 'empty' && grid[ci] !== 'door') items[grid[ci]] = (items[grid[ci]] || 0) + 1; });
    const avgX = cells.reduce((s, ci) => s + ci % size, 0) / cells.length;
    const avgY = cells.reduce((s, ci) => s + Math.floor(ci / size), 0) / cells.length;
    let name = names[rooms.length] || `Cômodo ${rooms.length + 1}`;
    if (items.bed) name = rooms.length ? 'Quarto' : 'Quarto Principal';
    if (items.kitchen) name = 'Cozinha';
    if (items.bath) name = 'Casa de Banho';
    if (items.sofa) name = 'Sala de Estar';
    rooms.push({ id: rooms.length, cells, area: cells.length * 1.44, name, center: { x: avgX, y: avgY }, items });
  }
  return rooms;
}

export function FloorPlannerPage() {
  const [tool, setTool] = useState<Cell>('wall');
  const [view, setView] = useState<'2d' | '3d' | 'tour'>('3d');
  const [grid, setGrid] = useState<Cell[]>(() => JSON.parse(localStorage.getItem('netek_floorplan') || 'null') || defaultPlan());
  const [roomId, setRoomId] = useState(0);
  const [camera, setCamera] = useState({ rotX: 58, rotZ: -35, zoom: 1, panX: 0, panY: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rooms = useMemo(() => computeRooms(grid), [grid]);
  const room = rooms[roomId] || rooms[0];
  const roomSet = useMemo(() => new Set(room?.cells || []), [room]);
  const tile = 38;

  const saveGrid = (next: Cell[]) => { setGrid(next); localStorage.setItem('netek_floorplan', JSON.stringify(next)); };
  const setCell = (i: number) => { const n = [...grid]; n[i] = tool; saveGrid(n); };
  const clear = () => saveGrid(Array(size * size).fill('empty') as Cell[]);
  const resetDemo = () => saveGrid(defaultPlan());
  const focusRoom = (rid: number) => { setRoomId(rid); const r = rooms[rid]; if (r) setCamera(c => ({ ...c, rotX: 62, rotZ: -38, zoom: 1.25, panX: (size / 2 - r.center.x) * 8, panY: (size / 2 - r.center.y) * 6 })); };
  const nextRoom = () => focusRoom((roomId + 1) % Math.max(rooms.length, 1));
  const prevRoom = () => focusRoom((roomId - 1 + Math.max(rooms.length, 1)) % Math.max(rooms.length, 1));
  const exportProject = () => { const blob = new Blob([JSON.stringify({ version: 2, size, grid }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'planta-netek-pro.json'; a.click(); };
  const importProject = (file: File) => { const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(String(r.result)); if (Array.isArray(d.grid)) saveGrid(d.grid); } catch {} }; r.readAsText(file); };
  const generatePDF = () => {
    const m = JSON.parse(localStorage.getItem('netek_floor_metrics') || '{"pdfs":0}'); m.pdfs = (m.pdfs || 0) + 1; localStorage.setItem('netek_floor_metrics', JSON.stringify(m));
    const roomRows = rooms.map(r => `<tr><td>${r.name}</td><td>${r.area.toFixed(1)} m²</td><td>${Object.entries(r.items).map(([k, v]) => `${L[k as Cell]} ${v}`).join(', ') || '-'}</td></tr>`).join('');
    const html = `<!doctype html><html><head><title>Planta Netek</title><style>body{font-family:Arial;padding:24px}.grid{display:grid;grid-template-columns:repeat(${size},32px);gap:2px}.cell{width:32px;height:32px;border:1px solid #bbb;text-align:center;line-height:32px;font-size:18px}.wall{background:#334155}table{border-collapse:collapse;margin-top:18px}td,th{border:1px solid #ccc;padding:8px}</style></head><body><h1>Planta Profissional - Netek Services</h1><p>Gerado em ${new Date().toLocaleString('pt-MZ')} · Escala visual: 1 célula ≈ 1,2m x 1,2m</p><div class="grid">${grid.map(c => `<div class="cell ${c === 'wall' ? 'wall' : ''}">${L[c]}</div>`).join('')}</div><h2>Cômodos</h2><table><tr><th>Cômodo</th><th>Área estimada</th><th>Elementos</th></tr>${roomRows}</table><p>Legenda: 🧱 parede · 🚪 porta · 🪟 janela · 🛏️ cama · 🪑 mesa · 🛋️ sofá · 🍳 cozinha · 🚿 banho · 🌳 exterior</p><script>window.print()</script></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
  };
  const onMove = (e: React.MouseEvent) => { if (!drag.current) return; const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; drag.current = { x: e.clientX, y: e.clientY }; setCamera(c => ({ ...c, rotZ: c.rotZ + dx * 0.35, rotX: Math.max(35, Math.min(76, c.rotX - dy * 0.25)) })); };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center"><span className="mb-4 inline-block rounded-full bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400">🏠 PLANTAS 2D / 3D PROFISSIONAL</span><h1 className="mb-3 text-4xl font-bold text-white">Criador Interativo de Casas</h1><p className="mx-auto max-w-2xl text-gray-400">Desenhe a planta, navegue pelos cômodos em 3D, visualize mobiliário e exporte para PDF.</p></div>
        <div className="grid gap-6 lg:grid-cols-5">
          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 lg:col-span-1">
            <div><h3 className="mb-3 font-semibold text-white">Ferramentas</h3><div className="grid grid-cols-2 gap-2">{(['wall','door','window','bed','table','sofa','kitchen','bath','tree','empty'] as Cell[]).map(t => <button key={t} onClick={() => setTool(t)} className={`rounded-xl border p-3 text-sm transition-all ${tool === t ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-slate-700 bg-slate-950/60 text-gray-400 hover:border-orange-500/50'}`}><span className="text-xl">{L[t] || '🧽'}</span><br/><span className="text-[10px]">{toolNames[t]}</span></button>)}</div></div>
            <div><h3 className="mb-3 font-semibold text-white">Modo</h3><div className="grid grid-cols-3 gap-2"><button onClick={() => setView('2d')} className={`rounded-xl py-2 text-sm ${view === '2d' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-gray-400'}`}>2D</button><button onClick={() => setView('3d')} className={`rounded-xl py-2 text-sm ${view === '3d' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-gray-400'}`}>3D</button><button onClick={() => setView('tour')} className={`rounded-xl py-2 text-sm ${view === 'tour' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-gray-400'}`}>Tour</button></div></div>
            <div className="space-y-2"><button onClick={generatePDF} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-bold text-white">📄 Baixar Planta</button><button onClick={exportProject} className="w-full rounded-xl bg-slate-800 py-2 text-sm text-white">💾 Exportar</button><button onClick={() => fileRef.current?.click()} className="w-full rounded-xl bg-slate-800 py-2 text-sm text-white">📂 Importar</button><button onClick={resetDemo} className="w-full rounded-xl bg-blue-500/20 py-2 text-sm text-blue-300">🏗️ Modelo demo</button><button onClick={clear} className="w-full rounded-xl bg-red-500/20 py-2 text-sm text-red-400">🗑️ Limpar</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importProject(e.target.files[0])}/></div>
            <div className="rounded-xl bg-slate-950/70 p-3 text-xs text-gray-500">Arraste no 3D para girar. Use a roda do rato para zoom. Clique num cômodo para visitar.</div>
          </aside>
          <main className="lg:col-span-4">
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs text-gray-500">Cômodos detectados</p><p className="text-3xl font-bold text-cyan-400">{rooms.length}</p></div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs text-gray-500">Área total estimada</p><p className="text-3xl font-bold text-green-400">{rooms.reduce((s,r)=>s+r.area,0).toFixed(1)} m²</p></div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs text-gray-500">Cômodo em foco</p><p className="truncate text-xl font-bold text-orange-400">{room?.name || 'Nenhum'}</p></div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
              <div className="min-h-[560px] overflow-hidden rounded-2xl border border-slate-700 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,.13),transparent_45%),linear-gradient(180deg,#0f172a,#020617)] p-4">
                {view === '2d' && <div className="mx-auto grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 38px)`, width: size * 42 }}>{grid.map((c, i) => <button key={i} onClick={() => setCell(i)} className={`flex h-10 w-10 items-center justify-center rounded border text-lg transition-all ${roomSet.has(i) ? 'border-orange-500/60 bg-orange-500/10' : c === 'wall' ? 'border-slate-500 bg-slate-600' : c === 'empty' ? 'border-slate-700 bg-slate-950 hover:border-orange-500' : 'border-cyan-500/40 bg-cyan-500/10'}`}>{L[c]}</button>)}</div>}
                {(view === '3d' || view === 'tour') && <div className="h-full min-h-[520px] select-none" onMouseDown={e => drag.current = { x: e.clientX, y: e.clientY }} onMouseMove={onMove} onMouseUp={() => drag.current = null} onMouseLeave={() => drag.current = null} onWheel={e => setCamera(c => ({ ...c, zoom: Math.max(.55, Math.min(2.3, c.zoom - e.deltaY * .001)) }))} style={{ perspective: 1100 }}><div className="relative mx-auto" style={{ width: size * tile, height: size * tile, transformStyle: 'preserve-3d', transform: `translate(${camera.panX}px, ${camera.panY}px) rotateX(${camera.rotX}deg) rotateZ(${camera.rotZ}deg) scale(${camera.zoom})`, transition: 'transform .25s ease' }}>{grid.map((c, i) => { const x = i % size, y = Math.floor(i / size), selected = roomSet.has(i); return <div key={i} onClick={() => setCell(i)} className={`absolute flex items-center justify-center border text-lg transition-all ${selected ? 'border-orange-400/70 bg-orange-400/20' : 'border-slate-700/70 bg-slate-900/80'} ${c === 'wall' ? 'bg-slate-500 border-slate-300 shadow-[0_22px_0_#1e293b]' : ''} ${c === 'door' ? 'bg-amber-700/70' : ''} ${c === 'window' ? 'bg-sky-400/40' : ''}`} style={{ left: x * tile, top: y * tile, width: tile, height: tile, transform: c === 'wall' ? 'translateZ(42px)' : c === 'window' ? 'translateZ(48px)' : c === 'door' ? 'translateZ(20px)' : c === 'empty' ? 'translateZ(0)' : 'translateZ(16px)', boxShadow: c === 'wall' ? '0 18px 30px rgba(15,23,42,.7)' : undefined }}>{L[c]}</div>})}</div></div>}
                {view === 'tour' && room && <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4"><div className="flex items-center justify-between gap-3"><button onClick={prevRoom} className="rounded-xl bg-slate-800 px-4 py-2 text-white">← Cômodo</button><div className="text-center"><p className="font-bold text-white">Você está em: {room.name}</p><p className="text-xs text-gray-400">Área estimada {room.area.toFixed(1)} m² · {Object.entries(room.items).map(([k,v])=>`${L[k as Cell]} ${v}`).join(' · ') || 'sem mobiliário'}</p></div><button onClick={nextRoom} className="rounded-xl bg-slate-800 px-4 py-2 text-white">Próximo →</button></div></div>}
              </div>
              <aside className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <h3 className="font-semibold text-white">Cômodos</h3>
                {rooms.map(r => <button key={r.id} onClick={() => focusRoom(r.id)} className={`w-full rounded-xl border p-3 text-left transition-all ${roomId === r.id ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-950/60 hover:border-orange-500/50'}`}><p className="font-semibold text-white">{r.name}</p><p className="text-xs text-gray-500">{r.area.toFixed(1)} m² · {r.cells.length} células</p></button>)}
                <div className="rounded-xl bg-slate-950/70 p-3"><p className="text-xs font-semibold text-gray-400">Câmera</p><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => setCamera({ rotX: 58, rotZ: -35, zoom: 1, panX: 0, panY: 0 })} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-gray-300">Reset</button><button onClick={() => setCamera(c => ({ ...c, zoom: Math.min(2.3, c.zoom + .15) }))} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-gray-300">Zoom +</button><button onClick={() => setCamera(c => ({ ...c, zoom: Math.max(.55, c.zoom - .15) }))} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-gray-300">Zoom -</button><button onClick={nextRoom} className="rounded-lg bg-orange-500/20 px-3 py-2 text-xs text-orange-300">Tour</button></div></div>
              </aside>
            </div>
          </main>
        </div>
        <div className="mt-8"><DonationWidget /></div>
      </div>
    </section>
  );
}

export function DonationsPage(){return <section className="min-h-screen bg-slate-900 py-20"><div className="mx-auto max-w-4xl px-4"><div className="mb-8 text-center"><span className="mb-4 inline-block rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">💚 DONATIVOS</span><h1 className="mb-3 text-4xl font-bold text-white">Apoie a Netek Services</h1></div><DonationWidget/><div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-5"><h3 className="mb-3 font-semibold text-white">Política Pay-What-You-Want</h3><p className="text-sm text-gray-400">Nenhum serviço da plataforma é cobrado obrigatoriamente: pré-marcações, downloads, ferramentas, biblioteca, plantas e utilidades são gratuitos. O donativo é 100% voluntário.</p></div></div></section>}

export function AdminUtilityPanels(){const[tab,setTab]=useState<'library'|'donations'|'floor'>('library');const library=JSON.parse(localStorage.getItem('netek_library_metrics')||'{}');const floor=JSON.parse(localStorage.getItem('netek_floor_metrics')||'{"pdfs":0}');const[files,setFiles]=useState<{name:string;size:number}[]>([]);return <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20"><div className="mx-auto max-w-6xl px-4"><div className="mb-8 text-center"><span className="mb-4 inline-block rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">👑 ADMIN UTILIDADES</span><h1 className="text-4xl font-bold text-white">Biblioteca, Donativos e Plantas</h1></div><div className="mb-8 flex gap-2 overflow-x-auto rounded-2xl bg-slate-800/50 p-2">{[['library','📚 Biblioteca'],['donations','💚 Donativos'],['floor','🏠 Plantas']].map(([id,l])=><button key={id} onClick={()=>setTab(id as typeof tab)} className={`flex-1 rounded-xl py-3 text-sm font-medium ${tab===id?'bg-red-500 text-white':'text-gray-400 hover:text-white'}`}>{l}</button>)}</div>{tab==='library'&&<div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5"><h3 className="mb-4 font-semibold text-white">Upload Manual de PDF autorizado</h3><input type="file" accept="application/pdf" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).map(f=>({name:f.name,size:f.size})))} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white"/>{files.map(b=><div key={b.name} className="mt-3 rounded-xl bg-slate-900/50 p-3 text-sm text-gray-300">📄 {b.name} <span className="text-gray-500">({Math.round(b.size/1024)} KB)</span></div>)}</div><div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5"><h3 className="mb-4 font-semibold text-white">Estatísticas de livros</h3>{Object.values(library).length===0?<p className="text-gray-500">Ainda sem leituras/downloads.</p>:Object.entries(library).map(([id,m])=><div key={id} className="mb-2 rounded-xl bg-slate-900/50 p-3"><p className="text-sm text-white">{(m as any).title}</p><p className="text-xs text-gray-500">Reads: {(m as any).reads||0} · Downloads: {(m as any).downloads||0}</p></div>)}</div></div>}{tab==='donations'&&<div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5"><h3 className="mb-4 font-semibold text-white">Donativos Recebidos</h3><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center"><p className="text-3xl font-bold text-green-400">0 MT</p><p className="text-sm text-gray-400">Confirmado</p></div><div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center"><p className="text-3xl font-bold text-yellow-400">0</p><p className="text-sm text-gray-400">Pendentes</p></div><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-center"><p className="text-3xl font-bold text-cyan-400">M-Pesa</p><p className="text-sm text-gray-400">Canal principal</p></div></div></div>}{tab==='floor'&&<div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5"><h3 className="mb-4 font-semibold text-white">Métricas da Ferramenta de Plantas</h3><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-center"><p className="text-3xl font-bold text-orange-400">{floor.pdfs||0}</p><p className="text-sm text-gray-400">PDFs gerados</p></div><div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-center"><p className="text-3xl font-bold text-purple-400">localStorage</p><p className="text-sm text-gray-400">Projetos guardados</p></div><div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center"><p className="text-3xl font-bold text-blue-400">2D/3D</p><p className="text-sm text-gray-400">Modos ativos</p></div></div></div>}</div></section>}