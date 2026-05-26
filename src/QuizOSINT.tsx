import { useMemo, useState } from 'react';

type QuizCategory = 'Dia a Dia em Moçambique' | 'Notícias e Manchetes' | 'Entretenimento' | 'Música e Artistas';

type QuizQuestion = {
  id: string;
  category: QuizCategory;
  question: string;
  options: string[];
  answer: number;
  source: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  trendTag?: string;
};

type Trend = {
  id: string;
  label: string;
  type: 'manchete' | 'artista' | 'música' | 'celebridade' | 'evento';
  source: string;
  score: number;
  last24h: number;
  related: string[];
};

type PublicProfile = {
  name: string;
  province: string;
  interests: string[];
  publicHandles: string[];
  publicMentions: string[];
};

const baseQuestions: QuizQuestion[] = [
  {
    id: 'mz-cultura-1', category: 'Dia a Dia em Moçambique', difficulty: 'Fácil', source: 'Conhecimento cultural geral',
    question: 'Qual prato moçambicano é feito com folhas de mandioca e amendoim?',
    options: ['Matapa', 'Feijoada', 'Mucapata', 'Caril de frango'], answer: 0,
  },
  {
    id: 'mz-prov-1', category: 'Dia a Dia em Moçambique', difficulty: 'Fácil', source: 'Geografia de Moçambique',
    question: 'Qual é a capital de Moçambique?',
    options: ['Beira', 'Nampula', 'Maputo', 'Xai-Xai'], answer: 2,
  },
  {
    id: 'mz-hist-1', category: 'Dia a Dia em Moçambique', difficulty: 'Médio', source: 'História nacional',
    question: 'Em que data se celebra a independência de Moçambique?',
    options: ['25 de Junho', '7 de Setembro', '1 de Maio', '4 de Outubro'], answer: 0,
  },
  {
    id: 'musica-1', category: 'Música e Artistas', difficulty: 'Fácil', source: 'Cultura musical moçambicana', trendTag: 'marrabenta',
    question: 'Qual género musical é tradicionalmente associado à cidade de Maputo?',
    options: ['Marrabenta', 'Semba', 'Funana', 'Forró'], answer: 0,
  },
  {
    id: 'musica-2', category: 'Música e Artistas', difficulty: 'Médio', source: 'Tendências musicais locais', trendTag: 'pandza',
    question: 'Pandza é principalmente conhecido como um estilo musical de qual país?',
    options: ['Angola', 'Moçambique', 'Cabo Verde', 'Brasil'], answer: 1,
  },
  {
    id: 'tv-1', category: 'Entretenimento', difficulty: 'Fácil', source: 'Televisão e entretenimento', trendTag: 'novelas',
    question: 'Novelas e programas de entretenimento são geralmente acompanhados em que tipo de meio?',
    options: ['Televisão e streaming', 'Apenas rádio', 'Apenas jornais impressos', 'Só bibliotecas'], answer: 0,
  },
];

const scrapedTrends: Trend[] = [
  { id: 't1', label: 'Eleições autárquicas', type: 'manchete', source: 'RSS portais MZ', score: 94, last24h: 18400, related: ['política', 'municípios', 'participação cívica'] },
  { id: 't2', label: 'Preço do combustível', type: 'manchete', source: 'Notícias económicas', score: 88, last24h: 14200, related: ['transporte', 'custo de vida', 'chapa'] },
  { id: 't3', label: 'Pandza 2025', type: 'música', source: 'YouTube Trending público', score: 81, last24h: 11900, related: ['música', 'lançamentos', 'artistas jovens'] },
  { id: 't4', label: 'Marrabenta clássica', type: 'música', source: 'Pesquisa pública web', score: 76, last24h: 9300, related: ['cultura', 'Maputo', 'música tradicional'] },
  { id: 't5', label: 'Novelas brasileiras em horário nobre', type: 'celebridade', source: 'Tendências TV / redes públicas', score: 70, last24h: 7200, related: ['entretenimento', 'TV', 'família'] },
  { id: 't6', label: 'Feira de emprego tecnológica', type: 'evento', source: 'Eventos públicos', score: 69, last24h: 6500, related: ['emprego', 'tecnologia', 'jovens'] },
];

function generateNewsQuestions(trends: Trend[]): QuizQuestion[] {
  return trends.filter(t => t.type === 'manchete' || t.type === 'evento').map((t, idx) => ({
    id: `auto-news-${idx}`,
    category: 'Notícias e Manchetes' as QuizCategory,
    difficulty: idx % 2 === 0 ? 'Médio' : 'Fácil',
    source: `${t.source} · gerado automaticamente`,
    trendTag: t.label,
    question: `Nas tendências das últimas 24h, qual tema esteve associado a "${t.label}"?`,
    options: [t.related[0] || 'cultura', 'culinária tradicional', 'clima espacial', 'moda internacional'],
    answer: 0,
  }));
}

function generateMusicQuestions(trends: Trend[]): QuizQuestion[] {
  return trends.filter(t => t.type === 'música' || t.type === 'celebridade').map((t, idx) => ({
    id: `auto-music-${idx}`,
    category: t.type === 'música' ? 'Música e Artistas' : 'Entretenimento',
    difficulty: 'Médio',
    source: `${t.source} · dados públicos`,
    trendTag: t.label,
    question: `O tópico "${t.label}" aparece principalmente em que área?`,
    options: [t.type === 'música' ? 'Música e Artistas' : 'Entretenimento', 'Agricultura', 'Direito fiscal', 'Meteorologia'],
    answer: 0,
  }));
}

const sampleProfiles: PublicProfile[] = [
  { name: 'Maria Santos', province: 'Maputo Cidade', interests: ['IA', 'música', 'marketing'], publicHandles: ['@maria_design'], publicMentions: ['portfolio Behance público', 'Instagram público de design'] },
  { name: 'Pedro Nhaca', province: 'Maputo Cidade', interests: ['Python', 'tecnologia', 'emprego'], publicHandles: ['@pedro_tech'], publicMentions: ['GitHub público', 'comentários em fórum tech'] },
  { name: 'Lúcia Viegas', province: 'Maputo Cidade', interests: ['educação', 'matemática', 'crianças'], publicHandles: ['@lucia_explica'], publicMentions: ['página pública de explicações'] },
  { name: 'Carlos Machava', province: 'Maputo Província', interests: ['serviços', 'electricidade', 'construção'], publicHandles: ['@carlos_elec'], publicMentions: ['KayaMoz verificado'] },
];

function updateLeaderboard(points: number, name = 'Cidadão Netek') {
  const current = JSON.parse(localStorage.getItem('netek_quiz_rank') || '[]') as { name: string; points: number; date: string }[];
  current.push({ name, points, date: new Date().toLocaleDateString('pt-MZ') });
  current.sort((a, b) => b.points - a.points);
  localStorage.setItem('netek_quiz_rank', JSON.stringify(current.slice(0, 20)));
  return current.slice(0, 20);
}

export function QuizOSINTPage() {
  const [category, setCategory] = useState<QuizCategory | 'Todos'>('Todos');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [ranking, setRanking] = useState<{ name: string; points: number; date: string }[]>(() => JSON.parse(localStorage.getItem('netek_quiz_rank') || '[]'));
  const [osintName, setOsintName] = useState('');
  const [osintProvince, setOsintProvince] = useState('Maputo Cidade');
  const [consent, setConsent] = useState(false);
  const [matches, setMatches] = useState<PublicProfile[]>([]);

  const questions = useMemo(() => [...baseQuestions, ...generateNewsQuestions(scrapedTrends), ...generateMusicQuestions(scrapedTrends)], []);
  const filtered = category === 'Todos' ? questions : questions.filter(q => q.category === category);
  const q = filtered[index % filtered.length];
  const categories: (QuizCategory | 'Todos')[] = ['Todos', 'Dia a Dia em Moçambique', 'Notícias e Manchetes', 'Entretenimento', 'Música e Artistas'];

  const answer = (opt: number) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const secs = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const speedBonus = Math.max(0, 20 - secs);
    if (opt === q.answer) setScore(s => s + 10 + speedBonus);
  };

  const next = () => {
    setSelected(null); setAnswered(false); setStartedAt(Date.now());
    if (index + 1 >= filtered.length) {
      const rank = updateLeaderboard(score, 'Cidadão Netek');
      setRanking(rank);
      setIndex(0); setScore(0);
    } else setIndex(i => i + 1);
  };

  const runOsint = () => {
    if (!consent) return;
    const interests = osintName.toLowerCase().includes('tech') ? ['tecnologia', 'Python'] : ['música', 'marketing'];
    const res = sampleProfiles.filter(p => p.province === osintProvince || p.interests.some(i => interests.some(x => i.toLowerCase().includes(x.toLowerCase()))));
    setMatches(res);
  };

  return <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen"><div className="max-w-7xl mx-auto px-4"><div className="text-center mb-10"><span className="inline-block px-4 py-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-full text-sm font-medium mb-4">🧠 QUIZZES + OSINT</span><h1 className="text-4xl font-bold text-white mb-4">Quizzes Inteligentes de Moçambique</h1><p className="text-gray-400 max-w-2xl mx-auto">Perguntas sobre cultura, notícias, entretenimento e música, geradas a partir de tendências e fontes públicas legais.</p></div><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><div className="flex flex-wrap gap-2 mb-5">{categories.map(c=><button key={c} onClick={()=>{setCategory(c);setIndex(0);setScore(0);setAnswered(false)}} className={`px-3 py-2 rounded-xl text-xs font-medium ${category===c?'bg-fuchsia-500 text-white':'bg-slate-900 text-gray-400 border border-slate-700'}`}>{c}</button>)}</div><div className="flex items-center justify-between mb-4"><span className="px-3 py-1 bg-slate-900 text-gray-400 rounded-full text-xs">{q.category}</span><span className="text-yellow-400 font-bold">Pontos: {score}</span></div><h2 className="text-2xl font-bold text-white mb-5">{q.question}</h2><div className="space-y-3">{q.options.map((o,i)=><button key={i} onClick={()=>answer(i)} className={`w-full text-left p-4 rounded-xl border transition-all ${answered&&i===q.answer?'bg-green-500/20 border-green-500 text-green-400':answered&&selected===i&&i!==q.answer?'bg-red-500/20 border-red-500 text-red-400':selected===i?'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300':'bg-slate-900/60 border-slate-700 text-gray-300 hover:border-fuchsia-500/50'}`}><span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{o}</button>)}</div>{answered&&<div className="mt-5 p-4 bg-slate-900/60 rounded-xl"><p className={selected===q.answer?'text-green-400':'text-red-400'}>{selected===q.answer?'✅ Correcto!':'❌ Errado.'} <span className="text-gray-400">Fonte: {q.source}</span></p><button onClick={next} className="mt-3 px-6 py-2 bg-fuchsia-500 text-white rounded-xl font-bold">Próxima →</button></div>}</div><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">🌐 Inteligência de Rede (OSINT autorizado)</h3><p className="text-gray-400 text-sm mb-4">Cruza apenas dados públicos/autorizados para sugerir conexões dentro da plataforma e enriquecer o perfil comunitário.</p><div className="grid md:grid-cols-2 gap-3 mb-3"><input value={osintName} onChange={e=>setOsintName(e.target.value)} placeholder="Nome ou username público" className="px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"/><select value={osintProvince} onChange={e=>setOsintProvince(e.target.value)} className="px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"><option>Maputo Cidade</option><option>Maputo Província</option><option>Sofala</option><option>Nampula</option></select></div><label className="flex items-start gap-2 text-gray-400 text-xs mb-4"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>Autorizo a verificação de perfis públicos e aceito que dados privados não sejam consultados.</label><button onClick={runOsint} disabled={!consent} className="px-5 py-2 bg-cyan-500 text-white rounded-xl font-semibold disabled:opacity-40">Cruzamento OSINT</button><div className="mt-4 space-y-2">{matches.map(m=><div key={m.name} className="p-3 bg-slate-900/60 rounded-xl"><p className="text-white font-medium">{m.name} · {m.province}</p><p className="text-gray-500 text-xs">Interesses: {m.interests.join(', ')}</p><p className="text-purple-400 text-xs">Perfis públicos: {m.publicHandles.join(', ')}</p></div>)}</div></div></div><div className="space-y-6"><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">🏆 Ranking Semanal</h3>{ranking.length===0?<p className="text-gray-500 text-sm">Responda o quiz para aparecer no ranking.</p>:ranking.map((r,i)=><div key={i} className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl mb-2"><span className="text-yellow-400 font-bold w-6">#{i+1}</span><span className="text-white flex-1">{r.name}</span><span className="text-fuchsia-400 font-bold">{r.points}</span></div>)}</div><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">📈 Tendências 24h</h3>{scrapedTrends.map(t=><div key={t.id} className="mb-3"><div className="flex justify-between text-sm"><span className="text-gray-300">{t.label}</span><span className="text-cyan-400">{t.last24h.toLocaleString()}</span></div><div className="w-full bg-slate-700 h-2 rounded-full mt-1"><div className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 h-2 rounded-full" style={{width:`${t.score}%`}}/></div><p className="text-gray-600 text-[10px] mt-1">{t.source}</p></div>)}</div></div></div></div></section>;
}

export function AdminQuizPanel(){const[suggested,setSuggested]=useState(baseQuestions.slice(0,3));const[manual,setManual]=useState({q:'',cat:'Dia a Dia em Moçambique',a:'',b:'',c:'',d:'',answer:'0'});const add=()=>{if(!manual.q)return;setSuggested(p=>[{id:'manual-'+Date.now(),category:manual.cat as QuizCategory,question:manual.q,options:[manual.a,manual.b,manual.c,manual.d],answer:Number(manual.answer),source:'Manual admin',difficulty:'Médio'},...p]);setManual({q:'',cat:'Dia a Dia em Moçambique',a:'',b:'',c:'',d:'',answer:'0'})};return <section className="py-20 bg-slate-900 min-h-screen"><div className="max-w-6xl mx-auto px-4"><div className="text-center mb-8"><span className="inline-block px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-4">👑 GESTÃO DE QUIZZES</span><h1 className="text-4xl font-bold text-white">Quizzes e Tendências</h1></div><div className="grid lg:grid-cols-2 gap-6"><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">Criar pergunta manual</h3><input value={manual.q} onChange={e=>setManual(p=>({...p,q:e.target.value}))} placeholder="Pergunta" className="w-full mb-3 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"/><select value={manual.cat} onChange={e=>setManual(p=>({...p,cat:e.target.value}))} className="w-full mb-3 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"><option>Dia a Dia em Moçambique</option><option>Notícias e Manchetes</option><option>Entretenimento</option><option>Música e Artistas</option></select><div className="grid grid-cols-2 gap-3 mb-3">{['a','b','c','d'].map(k=><input key={k} value={(manual as any)[k]} onChange={e=>setManual(p=>({...p,[k]:e.target.value}))} placeholder={`Opção ${k.toUpperCase()}`} className="px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"/>)}<select value={manual.answer} onChange={e=>setManual(p=>({...p,answer:e.target.value}))} className="col-span-2 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-700"><option value="0">Resposta A</option><option value="1">Resposta B</option><option value="2">Resposta C</option><option value="3">Resposta D</option></select></div><button onClick={add} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold">Adicionar pergunta</button></div><div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">Perguntas para moderação</h3>{suggested.map(q=><div key={q.id} className="p-3 bg-slate-900/60 rounded-xl mb-2"><p className="text-white text-sm">{q.question}</p><p className="text-gray-500 text-xs">{q.category} · {q.source}</p><div className="flex gap-2 mt-2"><button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">Aprovar</button><button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs" onClick={()=>setSuggested(p=>p.filter(x=>x.id!==q.id))}>Remover</button></div></div>)}<button onClick={()=>localStorage.removeItem('netek_quiz_rank')} className="mt-4 w-full py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-sm">Resetar ranking semanal</button></div></div><div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-5"><h3 className="text-white font-semibold mb-4">Central de Tendências 24h</h3><div className="grid md:grid-cols-2 gap-3">{scrapedTrends.map(t=><div key={t.id} className="p-3 bg-slate-900/60 rounded-xl"><div className="flex justify-between"><span className="text-white">{t.label}</span><span className="text-cyan-400">{t.last24h.toLocaleString()}</span></div><p className="text-gray-500 text-xs">{t.type} · {t.source}</p></div>)}</div></div></div></section>}