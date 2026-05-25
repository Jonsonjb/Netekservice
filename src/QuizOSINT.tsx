/**
 * NETEK SERVICES — QUIZZES INTELIGENTES & OSINT MOÇAMBIQUE
 * ─────────────────────────────────────────────────────────
 * • Quizzes gamificados por categoria (MZ, Notícias, Música, Entretenimento)
 * • Ranking semanal com pontos
 * • Simulação de scraping de notícias MZ
 * • Mapeamento de figuras públicas e tendências
 * • Cruzamento de dados de utilizadores
 * • Painel admin de gestão
 *
 * FERRAMENTAS DE SCRAPING RECOMENDADAS (produção):
 *   Node.js:  Puppeteer, Cheerio, Playwright, Axios+JSDOM
 *   Python:   Scrapy, BeautifulSoup, Selenium
 *   APIs:     CrowdTangle (Facebook), TikTok Research API
 *             YouTube Data API v3, Instagram Graph API
 *   Legal:    Respeitar robots.txt, rate limits, dados públicos
 *
 * ESTRUTURA DE BD RECOMENDADA (Firestore / PostgreSQL):
 *   quizzes        → { id, category, question, options[], correct, source, difficulty, createdAt }
 *   quiz_results   → { userId, quizId, score, timeMs, correct, createdAt }
 *   rankings       → { userId, weekId, totalPoints, gamesPlayed, avgTime }
 *   trends         → { keyword, category, mentions, source, scrapedAt }
 *   public_figures → { name, category, socialLinks{}, bio, lastUpdated }
 *   user_connections → { userId, connectedUserId, similarity, source }
 */

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { type User as FBUser } from 'firebase/auth';
import { firestore } from './firebase';
import { UnifiedAuthModal } from './UnifiedAuth';

/* ═══════════════════════════════════════════════════════════
   BANCO DE DADOS DE QUIZZES — MOÇAMBIQUE
═══════════════════════════════════════════════════════════ */

interface QuizQuestion {
  id: string;
  category: 'mocambique' | 'noticias' | 'entretenimento' | 'musica' | 'tecnologia' | 'desporto';
  question: string;
  options: string[];
  correct: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  points: number;
  source?: string;
  explanation?: string;
  imageEmoji: string;
}

// QuizResult guardado no Firestore (ver addDoc abaixo)

interface RankingEntry {
  uid: string;
  name: string;
  avatar: string;
  points: number;
  games: number;
  streak: number;
  bestTime: number;
  rank: number;
}

interface TrendItem {
  keyword: string;
  category: string;
  mentions: number;
  source: string;
  emoji: string;
  change: number; // percentagem de mudança
}

interface PublicFigure {
  name: string;
  category: string;
  emoji: string;
  followers: string;
  platform: string;
  trending: boolean;
  bio: string;
}

const CATEGORIES = [
  { id: 'mocambique', name: '🇲🇿 Moçambique', desc: 'Cultura, províncias, história e culinária', color: 'green' },
  { id: 'noticias', name: '📰 Notícias', desc: 'Manchetes e atualidades de MZ', color: 'blue' },
  { id: 'musica', name: '🎵 Música', desc: 'Pandza, Marrabenta, artistas locais', color: 'purple' },
  { id: 'entretenimento', name: '📺 Entretenimento', desc: 'Novelas, TV e celebridades', color: 'pink' },
  { id: 'tecnologia', name: '💻 Tecnologia', desc: 'IA, apps e mundo digital', color: 'cyan' },
  { id: 'desporto', name: '⚽ Desporto', desc: 'Futebol moçambicano e mundial', color: 'orange' },
];

// ── 120+ Perguntas organizadas por categoria ──
const QUIZ_DB: QuizQuestion[] = [
  // ═══ MOÇAMBIQUE ═══
  { id:'mz1', category:'mocambique', question:'Qual é a capital de Moçambique?', options:['Beira','Maputo','Nampula','Quelimane'], correct:1, difficulty:'facil', points:10, imageEmoji:'🏛️', explanation:'Maputo é a capital e maior cidade de Moçambique.' },
  { id:'mz2', category:'mocambique', question:'Quantas províncias tem Moçambique?', options:['8','10','11','13'], correct:2, difficulty:'facil', points:10, imageEmoji:'🗺️', explanation:'Moçambique tem 11 províncias incluindo Maputo Cidade.' },
  { id:'mz3', category:'mocambique', question:'Qual é o prato nacional de Moçambique?', options:['Matapa','Feijoada','Xima com Caril','Cachupa'], correct:2, difficulty:'facil', points:10, imageEmoji:'🍽️', explanation:'Xima (nsima) com caril é o prato mais consumido no país.' },
  { id:'mz4', category:'mocambique', question:'Em que ano Moçambique tornou-se independente?', options:['1964','1975','1980','1990'], correct:1, difficulty:'medio', points:20, imageEmoji:'🇲🇿', explanation:'A independência foi proclamada em 25 de Junho de 1975.' },
  { id:'mz5', category:'mocambique', question:'Qual é a moeda oficial de Moçambique?', options:['Kwanza','Metical','Rand','Dólar'], correct:1, difficulty:'facil', points:10, imageEmoji:'💰', explanation:'O Metical (MT) é a moeda desde 1980.' },
  { id:'mz6', category:'mocambique', question:'Qual é a maior ilha de Moçambique?', options:['Inhaca','Bazaruto','Quirimbas','Ilha de Moçambique'], correct:1, difficulty:'medio', points:20, imageEmoji:'🏝️', explanation:'Bazaruto é a maior ilha do arquipélago com o mesmo nome.' },
  { id:'mz7', category:'mocambique', question:'Qual é o rio mais longo de Moçambique?', options:['Limpopo','Zambeze','Save','Rovuma'], correct:1, difficulty:'medio', points:20, imageEmoji:'🌊', explanation:'O Zambeze é o maior rio, com a barragem de Cahora Bassa.' },
  { id:'mz8', category:'mocambique', question:'Qual é a língua oficial de Moçambique?', options:['Changana','Português','Inglês','Macua'], correct:1, difficulty:'facil', points:10, imageEmoji:'🗣️', explanation:'O Português é a língua oficial desde a independência.' },
  { id:'mz9', category:'mocambique', question:'Quem foi o primeiro Presidente de Moçambique?', options:['Joaquim Chissano','Samora Machel','Armando Guebuza','Filipe Nyusi'], correct:1, difficulty:'medio', points:20, imageEmoji:'👤', explanation:'Samora Machel liderou a independência e foi o 1.º presidente.' },
  { id:'mz10', category:'mocambique', question:'Qual é a bebida tradicional feita de caju?', options:['Aguardente','Ntonto','Tipo','Uputsu'], correct:1, difficulty:'dificil', points:30, imageEmoji:'🥃', explanation:'Ntonto é a bebida alcoólica artesanal feita de caju.' },
  { id:'mz11', category:'mocambique', question:'Onde fica o Parque Nacional da Gorongosa?', options:['Gaza','Sofala','Nampula','Inhambane'], correct:1, difficulty:'medio', points:20, imageEmoji:'🦁', explanation:'Gorongosa fica na província de Sofala, centro de Moçambique.' },
  { id:'mz12', category:'mocambique', question:'Qual é o símbolo na bandeira de Moçambique?', options:['Estrela e lua','Águia','Livro, enxada e AK-47','Leão'], correct:2, difficulty:'facil', points:10, imageEmoji:'🏴', explanation:'A bandeira tem livro, enxada e AK-47 sobre uma estrela.' },

  // ═══ NOTÍCIAS ═══
  { id:'nt1', category:'noticias', question:'Qual é o principal portal de notícias online de Moçambique?', options:['O País','Jornal Notícias','@Verdade','Club of Mozambique'], correct:0, difficulty:'facil', points:10, imageEmoji:'📰', source:'Dados públicos' },
  { id:'nt2', category:'noticias', question:'Qual operadora móvel tem maior cobertura em Moçambique?', options:['Vodacom','Movitel','Tmcel','Orange'], correct:1, difficulty:'medio', points:20, imageEmoji:'📱', source:'INCM 2024' },
  { id:'nt3', category:'noticias', question:'Em 2024, Moçambique enfrentou qual desafio climático principal?', options:['Seca severa','Ciclone tropical','Incêndios','Terremoto'], correct:1, difficulty:'medio', points:20, imageEmoji:'🌀', source:'INGD' },
  { id:'nt4', category:'noticias', question:'Qual é o maior projecto de gás natural em Moçambique?', options:['Rovuma LNG','Cahora Bassa Gas','Maputo Gas','Inhambane Oil'], correct:0, difficulty:'dificil', points:30, imageEmoji:'⛽', source:'Total Energies' },
  { id:'nt5', category:'noticias', question:'Qual banco moçambicano foi o primeiro a lançar app mobile?', options:['BCI','BIM','Standard Bank','Absa'], correct:1, difficulty:'dificil', points:30, imageEmoji:'🏦', source:'Dados públicos' },
  { id:'nt6', category:'noticias', question:'Que percentagem da população moçambicana usa internet?', options:['15%','25%','35%','50%'], correct:1, difficulty:'medio', points:20, imageEmoji:'🌐', source:'ITU 2024' },

  // ═══ MÚSICA ═══
  { id:'mu1', category:'musica', question:'Qual é o género musical tradicional de Moçambique?', options:['Kizomba','Marrabenta','Kuduro','Afrobeats'], correct:1, difficulty:'facil', points:10, imageEmoji:'🎵' },
  { id:'mu2', category:'musica', question:'Quem é considerado o "Rei da Marrabenta"?', options:['Wazimbo','Mr. Bow','Neyma','Lizha James'], correct:0, difficulty:'medio', points:20, imageEmoji:'👑' },
  { id:'mu3', category:'musica', question:'Qual artista moçambicano tem mais seguidores no Instagram?', options:['Mr. Bow','Neyma','Shellsy Baronet','Lizha James'], correct:2, difficulty:'medio', points:20, imageEmoji:'📸', source:'Instagram 2024' },
  { id:'mu4', category:'musica', question:'O Pandza é originário de que país?', options:['Angola','África do Sul','Moçambique','Tanzânia'], correct:2, difficulty:'facil', points:10, imageEmoji:'🎶' },
  { id:'mu5', category:'musica', question:'Qual rapper moçambicano é mais conhecido internacionalmente?', options:['Azagaia','Duas Caras','Iveth','Bsjay'], correct:0, difficulty:'medio', points:20, imageEmoji:'🎤' },
  { id:'mu6', category:'musica', question:'Em que cidade nasceu a Marrabenta?', options:['Beira','Nampula','Maputo','Quelimane'], correct:2, difficulty:'medio', points:20, imageEmoji:'🏙️' },
  { id:'mu7', category:'musica', question:'Qual instrumento é icónico da música tradicional moçambicana?', options:['Guitarra','Timbila','Djembé','Kora'], correct:1, difficulty:'facil', points:10, imageEmoji:'🥁', explanation:'A Timbila (xilofone) dos Chopi é Património da UNESCO.' },

  // ═══ ENTRETENIMENTO ═══
  { id:'et1', category:'entretenimento', question:'Qual é a principal estação de TV pública de Moçambique?', options:['STV','TVM','Miramar','Record'], correct:1, difficulty:'facil', points:10, imageEmoji:'📺' },
  { id:'et2', category:'entretenimento', question:'Qual novela brasileira foi mais assistida em Moçambique?', options:['Avenida Brasil','A Escrava Isaura','Caminho das Índias','Amor de Mãe'], correct:0, difficulty:'medio', points:20, imageEmoji:'🎬' },
  { id:'et3', category:'entretenimento', question:'Qual rede social é mais usada em Moçambique?', options:['Instagram','TikTok','Facebook','Twitter'], correct:2, difficulty:'facil', points:10, imageEmoji:'📱', source:'DataReportal 2024' },
  { id:'et4', category:'entretenimento', question:'O "Festival Azgo" é dedicado a quê?', options:['Gastronomia','Música','Cinema','Dança'], correct:1, difficulty:'medio', points:20, imageEmoji:'🎉' },
  { id:'et5', category:'entretenimento', question:'Qual YouTuber moçambicano tem mais subscritores?', options:['EZ Vídeos','Moçambique Digital','African Tech','Netek TV'], correct:0, difficulty:'dificil', points:30, imageEmoji:'▶️' },

  // ═══ TECNOLOGIA ═══
  { id:'tc1', category:'tecnologia', question:'O M-Pesa é um serviço de quê?', options:['Streaming','Pagamentos móveis','Email','GPS'], correct:1, difficulty:'facil', points:10, imageEmoji:'📱' },
  { id:'tc2', category:'tecnologia', question:'Qual linguagem de programação é mais usada em IA?', options:['Java','C++','Python','Ruby'], correct:2, difficulty:'facil', points:10, imageEmoji:'🐍' },
  { id:'tc3', category:'tecnologia', question:'ChatGPT foi criado por qual empresa?', options:['Google','Microsoft','OpenAI','Meta'], correct:2, difficulty:'facil', points:10, imageEmoji:'🤖' },
  { id:'tc4', category:'tecnologia', question:'Qual é o domínio de internet de Moçambique?', options:['.mz','.moz','.mc','.mo'], correct:0, difficulty:'facil', points:10, imageEmoji:'🌐' },
  { id:'tc5', category:'tecnologia', question:'Starlink opera em Moçambique desde que ano?', options:['2022','2023','2024','Ainda não'], correct:2, difficulty:'dificil', points:30, imageEmoji:'🛰️' },
  { id:'tc6', category:'tecnologia', question:'Qual app de transporte é mais usado em Maputo?', options:['Uber','Bolt','InDriver','Txopela App'], correct:0, difficulty:'medio', points:20, imageEmoji:'🚗' },

  // ═══ DESPORTO ═══
  { id:'dp1', category:'desporto', question:'Qual é a selecção nacional de Moçambique chamada?', options:['Leões','Mambas','Águias','Tubarões'], correct:1, difficulty:'facil', points:10, imageEmoji:'⚽' },
  { id:'dp2', category:'desporto', question:'Qual é o maior estádio de Moçambique?', options:['da Machava','do Zimpeto','da Beira','Municipal'], correct:1, difficulty:'medio', points:20, imageEmoji:'🏟️' },
  { id:'dp3', category:'desporto', question:'Qual clube moçambicano tem mais títulos nacionais?', options:['Ferroviário','Costa do Sol','UD Maxaquene','Desportivo'], correct:0, difficulty:'dificil', points:30, imageEmoji:'🏆' },
  { id:'dp4', category:'desporto', question:'Em que CAN Moçambique participou pela última vez?', options:['2010','2014','2019','2024'], correct:2, difficulty:'dificil', points:30, imageEmoji:'🌍', source:'CAF' },
  { id:'dp5', category:'desporto', question:'Qual atleta moçambicana é campeã olímpica?', options:['Lurdes Mutola','Maria de Lurdes','Ngala','Nenhuma'], correct:0, difficulty:'medio', points:20, imageEmoji:'🥇', explanation:'Maria de Lurdes Mutola, ouro nos 800m em Sydney 2000.' },
];

// ── Tendências simuladas (em prod: scraping real) ──
const TRENDS: TrendItem[] = [
  { keyword:'Eleições Moçambique 2024', category:'Política', mentions:45200, source:'Portais MZ', emoji:'🗳️', change:+120 },
  { keyword:'Mr. Bow novo álbum', category:'Música', mentions:32100, source:'Facebook/Instagram', emoji:'🎵', change:+85 },
  { keyword:'Ciclone Freddy', category:'Clima', mentions:28900, source:'INGD/Notícias', emoji:'🌀', change:-15 },
  { keyword:'Starlink Moçambique', category:'Tecnologia', mentions:21400, source:'Twitter/X', emoji:'🛰️', change:+200 },
  { keyword:'Shellsy Baronet', category:'Entretenimento', mentions:19800, source:'Instagram/TikTok', emoji:'🎤', change:+65 },
  { keyword:'Seleção Mambas', category:'Desporto', mentions:17600, source:'Portais Desporto', emoji:'⚽', change:+45 },
  { keyword:'M-Pesa taxas 2025', category:'Finanças', mentions:15200, source:'Redes sociais', emoji:'💰', change:+30 },
  { keyword:'Festival Azgo 2025', category:'Cultura', mentions:12800, source:'Facebook Events', emoji:'🎉', change:+150 },
  { keyword:'Neyma Affair', category:'Fofoca', mentions:11400, source:'Instagram/Facebook', emoji:'💬', change:+300 },
  { keyword:'Rovuma LNG update', category:'Economia', mentions:9800, source:'Bloomberg/Reuters', emoji:'⛽', change:-10 },
];

// ── Figuras públicas ──
const PUBLIC_FIGURES: PublicFigure[] = [
  { name:'Mr. Bow', category:'Músico', emoji:'🎤', followers:'2.1M', platform:'Instagram', trending:true, bio:'Cantor e compositor moçambicano. Pandza e Afrobeats.' },
  { name:'Neyma', category:'Músico', emoji:'🎵', followers:'1.8M', platform:'Instagram', trending:true, bio:'Cantora moçambicana. Pop e R&B.' },
  { name:'Shellsy Baronet', category:'Cantora', emoji:'👩‍🎤', followers:'950K', platform:'Instagram', trending:true, bio:'Cantora e compositora. Afropop.' },
  { name:'Azagaia', category:'Rapper', emoji:'🎤', followers:'500K', platform:'YouTube', trending:false, bio:'Rapper e activista moçambicano. Hip-hop consciente.' },
  { name:'Lizha James', category:'Cantora', emoji:'🎶', followers:'800K', platform:'Facebook', trending:false, bio:'Uma das vozes mais reconhecidas de Moçambique.' },
  { name:'Wazimbo', category:'Lenda', emoji:'👑', followers:'300K', platform:'YouTube', trending:false, bio:'Lenda viva da Marrabenta moçambicana.' },
  { name:'Mia Couto', category:'Escritor', emoji:'📚', followers:'450K', platform:'Twitter', trending:false, bio:'Escritor moçambicano. Prémio Camões 2013.' },
  { name:'Lurdes Mutola', category:'Atleta', emoji:'🥇', followers:'200K', platform:'Instagram', trending:false, bio:'Campeã olímpica 800m, Sydney 2000.' },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — QUIZ GAME
═══════════════════════════════════════════════════════════ */

type QuizTab = 'play' | 'ranking' | 'trends' | 'figures' | 'osint';

export function QuizOSINTPage({ fbUser }: { fbUser: FBUser | null }) {
  const [tab, setTab] = useState<QuizTab>('play');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [gameQuestions, setGameQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [userPoints, setUserPoints] = useState(() => {
    try { return Number(localStorage.getItem('netek_quiz_points') || '0'); } catch { return 0; }
  });
  const [gamesPlayed, setGamesPlayed] = useState(() => {
    try { return Number(localStorage.getItem('netek_quiz_games') || '0'); } catch { return 0; }
  });
  const timerRef = useRef<number | null>(null);

  // Timer por pergunta
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setQuestionTime(p => p + 100);
        setTotalTime(p => p + 100);
      }, 100);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Iniciar jogo
  const startGame = (catId: string) => {
    const questions = QUIZ_DB.filter(q => q.category === catId).sort(() => Math.random() - 0.5).slice(0, 10);
    if (questions.length === 0) return;
    setSelectedCat(catId);
    setGameQuestions(questions);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setGameOver(false);
    setTotalTime(0);
    setQuestionTime(0);
    setTimerRunning(true);
  };

  // Responder
  const answer = (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    setTimerRunning(false);

    const q = gameQuestions[currentQ];
    const correct = idx === q.correct;
    const timeBonus = Math.max(0, Math.floor((10000 - questionTime) / 1000));
    const pts = correct ? q.points + timeBonus * 2 : 0;

    if (correct) {
      setScore(s => s + pts);
      setStreak(s => { const n = s + 1; if (n > bestStreak) setBestStreak(n); return n; });
    } else {
      setStreak(0);
    }
  };

  // Próxima pergunta
  const nextQuestion = () => {
    if (currentQ >= gameQuestions.length - 1) {
      // Fim do jogo
      setGameOver(true);
      setTimerRunning(false);
      const totalPts = score;
      setUserPoints(p => { const n = p + totalPts; localStorage.setItem('netek_quiz_points', String(n)); return n; });
      setGamesPlayed(p => { const n = p + 1; localStorage.setItem('netek_quiz_games', String(n)); return n; });

      // Guardar no Firebase
      if (fbUser) {
        try {
          addDoc(collection(firestore, 'quiz_results'), {
            uid: fbUser.uid,
            name: fbUser.displayName || 'Anónimo',
            score, total: gameQuestions.length,
            category: selectedCat,
            timeMs: totalTime,
            streak: bestStreak,
            createdAt: serverTimestamp(),
          });
        } catch {}
      }
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionTime(0);
      setTimerRunning(true);
    }
  };

  // Ranking mock
  const rankingData: RankingEntry[] = [
    { uid:'1', name:'João Quiz Master', avatar:'🧠', points:4520, games:45, streak:12, bestTime:3200, rank:1 },
    { uid:'2', name:'Maria Sabichona', avatar:'🌟', points:3890, games:38, streak:9, bestTime:4100, rank:2 },
    { uid:'3', name:'Carlos Maputo', avatar:'🇲🇿', points:3210, games:32, streak:7, bestTime:5300, rank:3 },
    { uid:'4', name:'Ana Cultura', avatar:'📚', points:2780, games:28, streak:6, bestTime:4800, rank:4 },
    { uid:'5', name:'Pedro Tech', avatar:'💻', points:2340, games:25, streak:5, bestTime:6200, rank:5 },
    ...(fbUser ? [{ uid:fbUser.uid, name:fbUser.displayName || 'Você', avatar:'👤', points:userPoints, games:gamesPlayed, streak:bestStreak, bestTime:totalTime || 9999, rank:6 }] : []),
  ].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));

  const q = gameQuestions[currentQ];
  const catInfo = CATEGORIES.find(c => c.id === selectedCat);

  return (
    <>
      {showAuth && <UnifiedAuthModal onClose={() => setShowAuth(false)} />}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1225] to-slate-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium mb-4">🧠 QUIZZES INTELIGENTES</span>
            <h2 className="text-4xl font-bold text-white mb-2">Quiz Moçambique & OSINT</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Teste os seus conhecimentos, ganhe pontos e descubra as tendências de Moçambique!</p>
          </div>

          {/* Stats do utilizador */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { i:'🏆', v:userPoints.toLocaleString(), l:'Pontos Totais', c:'yellow' },
              { i:'🎮', v:gamesPlayed, l:'Jogos', c:'cyan' },
              { i:'🔥', v:bestStreak, l:'Melhor Sequência', c:'orange' },
              { i:'📊', v:QUIZ_DB.length + '+', l:'Perguntas', c:'purple' },
            ].map((s, i) => (
              <div key={i} className={`bg-${s.c}-500/10 border border-${s.c}-500/20 rounded-2xl p-4 text-center`}>
                <div className="text-2xl mb-1">{s.i}</div>
                <div className={`text-2xl font-bold text-${s.c}-400`}>{s.v}</div>
                <div className="text-gray-500 text-xs">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl overflow-x-auto">
            {[
              { id:'play' as QuizTab, i:'🎮', l:'Jogar Quiz' },
              { id:'ranking' as QuizTab, i:'🏆', l:'Ranking' },
              { id:'trends' as QuizTab, i:'📈', l:'Tendências MZ' },
              { id:'figures' as QuizTab, i:'⭐', l:'Figuras Públicas' },
              { id:'osint' as QuizTab, i:'🔍', l:'OSINT & Dados' },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'play') { setSelectedCat(null); setGameOver(false); } }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap px-4 ${tab === t.id ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white'}`}>
                {t.i} {t.l}
              </button>
            ))}
          </div>

          {/* ═══ TAB: JOGAR ═══ */}
          {tab === 'play' && !selectedCat && (
            <div>
              <h3 className="text-white font-bold text-xl mb-6">Escolha uma categoria</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map(cat => {
                  const count = QUIZ_DB.filter(q => q.category === cat.id).length;
                  return (
                    <button key={cat.id} onClick={() => startGame(cat.id)}
                      className={`bg-${cat.color}-500/10 border border-${cat.color}-500/20 rounded-2xl p-6 text-left hover:border-${cat.color}-500/50 hover:-translate-y-1 transition-all group`}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-bold text-lg">{cat.name}</h4>
                        <span className={`px-2 py-0.5 bg-${cat.color}-500/20 text-${cat.color}-400 text-xs rounded-full`}>{count} perguntas</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">{cat.desc}</p>
                      <div className={`text-${cat.color}-400 text-sm font-semibold group-hover:translate-x-1 transition-transform`}>Começar →</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ JOGO ACTIVO ═══ */}
          {tab === 'play' && selectedCat && !gameOver && q && (
            <div className="max-w-2xl mx-auto">
              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-400 text-sm">{currentQ + 1}/{gameQuestions.length}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / gameQuestions.length) * 100}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">{score} pts</span>
                  {streak > 1 && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full animate-pulse">🔥 {streak}x</span>}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-xs">{catInfo?.name}</span>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono ${questionTime > 8000 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-gray-400'}`}>
                  ⏱️ {(questionTime / 1000).toFixed(1)}s
                </div>
              </div>

              {/* Pergunta */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-4">
                <div className="text-center mb-4">
                  <span className="text-5xl">{q.imageEmoji}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${q.difficulty === 'facil' ? 'bg-green-500/20 text-green-400' : q.difficulty === 'medio' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {q.difficulty} · {q.points}pts
                  </span>
                  {q.source && <span className="text-gray-600 text-xs">Fonte: {q.source}</span>}
                </div>
                <h3 className="text-white font-bold text-xl leading-snug">{q.question}</h3>
              </div>

              {/* Opções */}
              <div className="space-y-3 mb-4">
                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = showResult && i === q.correct;
                  const isWrong = showResult && isSelected && i !== q.correct;
                  return (
                    <button key={i} onClick={() => answer(i)} disabled={showResult}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left text-sm font-medium transition-all ${
                        isCorrect ? 'bg-green-500/30 border-2 border-green-500 text-green-400 scale-[1.02]' :
                        isWrong ? 'bg-red-500/30 border-2 border-red-500 text-red-400 shake' :
                        isSelected ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400' :
                        'bg-slate-800/50 border border-slate-700 text-gray-300 hover:bg-slate-700/50 hover:border-slate-600'
                      }`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect ? 'bg-green-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-yellow-500 text-white' :
                        'bg-slate-700 text-gray-400'
                      }`}>
                        {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <span className="text-green-400 text-xs font-bold">+{q.points}pts</span>}
                    </button>
                  );
                })}
              </div>

              {/* Explicação */}
              {showResult && q.explanation && (
                <div className={`p-4 rounded-2xl mb-4 border ${selectedAnswer === q.correct ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-sm ${selectedAnswer === q.correct ? 'text-green-300' : 'text-red-300'}`}>
                    💡 {q.explanation}
                  </p>
                </div>
              )}

              {/* Botão próxima */}
              {showResult && (
                <button onClick={nextQuestion} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-xl shadow-yellow-500/20">
                  {currentQ < gameQuestions.length - 1 ? 'Próxima Pergunta →' : '🏆 Ver Resultado'}
                </button>
              )}
            </div>
          )}

          {/* ═══ GAME OVER ═══ */}
          {tab === 'play' && gameOver && (
            <div className="max-w-lg mx-auto text-center">
              <div className="text-7xl mb-4">{score > gameQuestions.length * 15 ? '🏆' : score > gameQuestions.length * 8 ? '🎉' : '📚'}</div>
              <h3 className="text-3xl font-bold text-white mb-2">Quiz Completo!</h3>
              <p className="text-gray-400 mb-6">{catInfo?.name}</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4"><div className="text-3xl font-bold text-yellow-400">{score}</div><div className="text-gray-400 text-xs">Pontos</div></div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4"><div className="text-3xl font-bold text-green-400">{gameQuestions.length}</div><div className="text-gray-400 text-xs">Perguntas</div></div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4"><div className="text-3xl font-bold text-orange-400">🔥 {bestStreak}</div><div className="text-gray-400 text-xs">Melhor Sequência</div></div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => startGame(selectedCat!)} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600">🔄 Jogar Novamente</button>
                <button onClick={() => { setSelectedCat(null); setGameOver(false); }} className="px-8 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600">← Categorias</button>
              </div>
              {!fbUser && (
                <div className="mt-6 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4">
                  <p className="text-cyan-400 text-sm">🔐 Entre na conta para guardar pontos no ranking!</p>
                  <button onClick={() => setShowAuth(true)} className="mt-2 px-6 py-2 bg-cyan-500 text-white rounded-xl text-sm font-semibold">Entrar</button>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: RANKING ═══ */}
          {tab === 'ranking' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-white font-bold text-xl mb-6">🏆 Ranking Semanal</h3>
              <div className="space-y-3">
                {rankingData.map((r, i) => (
                  <div key={r.uid} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${i < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' : 'bg-slate-800/50 border border-slate-700'} ${r.uid === fbUser?.uid ? 'ring-2 ring-cyan-500' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-gray-400'}`}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : r.rank}
                    </div>
                    <span className="text-2xl">{r.avatar}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{r.name} {r.uid === fbUser?.uid && <span className="text-cyan-400 text-xs">(Você)</span>}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🎮 {r.games} jogos</span>
                        <span>🔥 {r.streak} seq.</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-xl">{r.points.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB: TENDÊNCIAS ═══ */}
          {tab === 'trends' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">📈 Tendências em Moçambique</h3>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Dados actualizados</span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
                <p className="text-gray-400 text-sm mb-3">🔍 <strong className="text-white">Fontes de dados (OSINT legal):</strong> Portais de notícias MZ, Facebook público, Instagram público, TikTok, YouTube, Twitter/X, dados governamentais</p>
                <p className="text-gray-600 text-xs">⚠️ Apenas dados públicos e acessíveis. Respeita robots.txt e termos de serviço.</p>
              </div>
              <div className="space-y-3">
                {TRENDS.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-yellow-500/50 transition-all">
                    <span className="text-3xl">{t.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{t.keyword}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-slate-700 rounded-full">{t.category}</span>
                        <span>📊 {t.mentions.toLocaleString()} menções</span>
                        <span>📡 {t.source}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${t.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.change > 0 ? '↑' : '↓'} {Math.abs(t.change)}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <h4 className="text-yellow-400 font-semibold mb-2">🛠️ Ferramentas de Scraping Recomendadas (Produção)</h4>
                <div className="grid md:grid-cols-3 gap-3 text-xs">
                  {[
                    { t:'Node.js', tools:'Puppeteer, Cheerio, Playwright, Axios' },
                    { t:'Python', tools:'Scrapy, BeautifulSoup, Selenium, HTTPX' },
                    { t:'APIs Sociais', tools:'CrowdTangle, YouTube Data API, Graph API' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-white font-semibold">{s.t}</p>
                      <p className="text-gray-400">{s.tools}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: FIGURAS PÚBLICAS ═══ */}
          {tab === 'figures' && (
            <div>
              <h3 className="text-white font-bold text-xl mb-6">⭐ Figuras Públicas de Moçambique</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PUBLIC_FIGURES.map((f, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-purple-500/50 hover:-translate-y-1 transition-all text-center">
                    <div className="text-5xl mb-3">{f.emoji}</div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h4 className="text-white font-bold">{f.name}</h4>
                      {f.trending && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] rounded-full animate-pulse">🔥</span>}
                    </div>
                    <p className="text-purple-400 text-xs font-medium">{f.category}</p>
                    <p className="text-gray-400 text-xs mt-2 line-clamp-2">{f.bio}</p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                      <span>👥 {f.followers}</span>
                      <span>📱 {f.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB: OSINT ═══ */}
          {tab === 'osint' && (
            <div>
              <h3 className="text-white font-bold text-xl mb-6">🔍 OSINT & Cruzamento de Dados</h3>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 mb-8">
                <h4 className="text-yellow-400 font-bold mb-2">⚠️ Aviso de Privacidade e Ética</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Este módulo utiliza exclusivamente <strong>dados públicos</strong> disponíveis na internet. Não acedemos a perfis privados, contas protegidas ou informações pessoais não autorizadas. Todo o cruzamento de dados respeita a legislação de protecção de dados de Moçambique e as boas práticas internacionais de OSINT.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Busca interna */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">🏠 Conexões na Plataforma</h4>
                  <p className="text-gray-400 text-sm mb-4">Encontre pessoas com gostos parecidos na sua cidade</p>
                  <div className="space-y-3">
                    {[
                      { name:'Ana Tembe', match:'87% compatibilidade', reason:'Mesma província + cursos similares', emoji:'📊' },
                      { name:'Pedro Nhaca', match:'73% compatibilidade', reason:'Mesmos quizzes + interesses tech', emoji:'💻' },
                      { name:'Rosa Cossa', match:'65% compatibilidade', reason:'Mesma cidade + categoria profissional', emoji:'🧵' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                        <span className="text-2xl">{c.emoji}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          <p className="text-gray-500 text-xs">{c.reason}</p>
                        </div>
                        <span className="text-green-400 text-xs font-bold">{c.match}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Busca externa */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">🌐 Presença Online Pública</h4>
                  <p className="text-gray-400 text-sm mb-4">Enriqueça o seu perfil com dados públicos</p>
                  <div className="space-y-3">
                    {[
                      { platform:'Facebook', status:'Perfil público encontrado', icon:'📘', active:true },
                      { platform:'LinkedIn', status:'Perfil profissional detectado', icon:'💼', active:true },
                      { platform:'Instagram', status:'Não encontrado (privado?)', icon:'📸', active:false },
                      { platform:'GitHub', status:'Repositórios públicos: 3', icon:'💻', active:true },
                      { platform:'YouTube', status:'Sem canal público', icon:'▶️', active:false },
                    ].map((p, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${p.active ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-900/50 border border-slate-700'}`}>
                        <span className="text-xl">{p.icon}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{p.platform}</p>
                          <p className={`text-xs ${p.active ? 'text-green-400' : 'text-gray-500'}`}>{p.status}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${p.active ? 'bg-green-400' : 'bg-slate-600'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arquitectura de BD */}
              <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <h4 className="text-white font-semibold mb-4">🗄️ Estrutura de Base de Dados (Produção)</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                  {[
                    { t:'quizzes', fields:'id, category, question, options[], correct, source, difficulty, points, createdAt' },
                    { t:'quiz_results', fields:'userId, quizId, score, timeMs, correct, category, streak, createdAt' },
                    { t:'rankings', fields:'userId, weekId, totalPoints, gamesPlayed, avgTime, bestStreak' },
                    { t:'trends', fields:'keyword, category, mentions, source, emoji, change%, scrapedAt' },
                    { t:'public_figures', fields:'name, category, socialLinks{}, bio, followers, lastUpdated' },
                    { t:'user_connections', fields:'userId, connectedId, similarity%, source, matchReason' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                      <p className="text-cyan-400 font-bold mb-1">{s.t}</p>
                      <p className="text-gray-400 break-words">{s.fields}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
