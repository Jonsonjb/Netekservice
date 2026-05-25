/**
 * KAYAMOZ — INTEGRAÇÃO NATIVA
 * Todas as páginas do KayaMoz renderizadas dentro do Netek,
 * na mesma aba, sem redirecionamentos externos.
 * Auth partilhada via Firebase (kayamoz-debbb).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, updateDoc, doc, increment,
  where, getDocs,
} from 'firebase/firestore';
import {
  ref, push, onValue, off, set, serverTimestamp as rtTs, remove, onDisconnect,
  query as rtQuery, orderByChild, limitToLast,
} from 'firebase/database';
import { type User as FBUser } from 'firebase/auth';
import { firestore, db } from './firebase';
import { WA_BUSINESS } from './data';
import { UnifiedAuthModal } from './UnifiedAuth';
import type { UnifiedUser } from './UnifiedAuth';

/* ─── helpers ─────────────────────────────────────────────── */
const wa = (msg: string) => `https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent(msg)}`;

const PROVINCIAS = ['Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane',
  'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'];

type KMPage = 'mural' | 'publicar' | 'perfil' | 'chat' | 'notificacoes' | 'busca';

/* ─── tipos ────────────────────────────────────────────────── */
interface KMProfissional {
  id: string;
  username: string;
  nome: string;
  bairro: string;
  provincia: string;
  profissao: string;
  descricao: string;
  preco: string;
  verified: boolean;
  rating: number;
  reviews: number;
  emoji: string;
  uid: string;
  phone: string;
  createdAt: unknown;
  likes: number;
}

interface KMMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt: number;
  room: string;
}

/* ─── BARRA DE NAVEGAÇÃO INTERNA DO KAYAMOZ ──────────────── */
function KMNav({
  page, setPage, unreadNotifs,
}: {
  page: KMPage;
  setPage: (p: KMPage) => void;
  fbUser?: FBUser | null;
  unreadNotifs: number;
}) {
  const items: { id: KMPage; icon: string; label: string }[] = [
    { id: 'mural', icon: '🔍', label: 'Mural' },
    { id: 'busca', icon: '🔎', label: 'Buscar' },
    { id: 'publicar', icon: '📢', label: 'Publicar' },
    { id: 'chat', icon: '💬', label: 'Chat' },
    { id: 'notificacoes', icon: '🔔', label: 'Avisos' },
    { id: 'perfil', icon: '👤', label: 'Eu' },
  ];

  return (
    <nav className="sticky bottom-0 z-20 bg-slate-900 border-t border-slate-800 flex sm:hidden">
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => setPage(it.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-all relative ${page === it.id ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="text-xl leading-none">{it.icon}</span>
          <span>{it.label}</span>
          {it.id === 'notificacoes' && unreadNotifs > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadNotifs}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

/* ─── MURAL DE TALENTOS ──────────────────────────────────── */
function KMMural({
  fbUser, setPage,
}: { fbUser: FBUser | null; profile?: UnifiedUser | null; setPage: (p: KMPage) => void }) {
  const [profs, setProfs] = useState<KMProfissional[]>([]);
  const [search, setSearch] = useState('');
  const [filterProv, setFilterProv] = useState('Todos');
  const [filterVerified, setFilterVerified] = useState(false);
  const [selected, setSelected] = useState<KMProfissional | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Dados demo enquanto Firebase não tem entradas
  const demo: KMProfissional[] = [
    { id: 'd1', username: 'carlos_elec', nome: 'Carlos Machava', bairro: 'Sommerschield', provincia: 'Maputo Cidade', profissao: 'Electricista', descricao: 'Instalações residenciais e industriais. 10 anos de experiência.', preco: '500-2.000 MT', verified: true, rating: 4.8, reviews: 127, emoji: '⚡', uid: 'demo1', phone: '841234567', createdAt: null, likes: 45 },
    { id: 'd2', username: 'maria_design', nome: 'Maria Santos', bairro: 'Polana', provincia: 'Maputo Cidade', profissao: 'Designer Gráfica', descricao: 'Logos, flyers, identidade visual e redes sociais.', preco: '800-3.000 MT', verified: true, rating: 4.9, reviews: 89, emoji: '🎨', uid: 'demo2', phone: '852345678', createdAt: null, likes: 62 },
    { id: 'd3', username: 'ze_canaliz', nome: 'José Mabunda', bairro: 'Machava', provincia: 'Maputo Província', profissao: 'Canalizador', descricao: 'Desentupimentos, instalações e reparações urgentes.', preco: '400-1.500 MT', verified: false, rating: 4.7, reviews: 156, emoji: '🔧', uid: 'demo3', phone: '863456789', createdAt: null, likes: 38 },
    { id: 'd4', username: 'ana_conta', nome: 'Ana Tembe', bairro: 'Centro', provincia: 'Maputo Cidade', profissao: 'Contabilista', descricao: 'Contabilidade, impostos, folha de pagamento e NUIT.', preco: '1.500-5.000 MT', verified: true, rating: 4.9, reviews: 203, emoji: '📊', uid: 'demo4', phone: '844567890', createdAt: null, likes: 91 },
    { id: 'd5', username: 'pedro_tech', nome: 'Pedro Nhaca', bairro: 'Maxaquene', provincia: 'Maputo Cidade', profissao: 'Técnico de Informática', descricao: 'Reparação de PCs, redes, formatação e software.', preco: '300-2.000 MT', verified: true, rating: 4.8, reviews: 94, emoji: '💻', uid: 'demo5', phone: '855678901', createdAt: null, likes: 54 },
    { id: 'd6', username: 'rosa_costura', nome: 'Rosa Cossa', bairro: 'Mavalane', provincia: 'Maputo Cidade', profissao: 'Costureira', descricao: 'Roupa sob medida, consertos e capulanas.', preco: '200-1.000 MT', verified: false, rating: 4.6, reviews: 78, emoji: '🧵', uid: 'demo6', phone: '866789012', createdAt: null, likes: 29 },
    { id: 'd7', username: 'manuel_moto', nome: 'Manuel Banze', bairro: 'Costa do Sol', provincia: 'Maputo Cidade', profissao: 'Motorista', descricao: 'Entregas, transporte de pessoas e mudanças.', preco: '300-800 MT/h', verified: true, rating: 4.5, reviews: 312, emoji: '🚗', uid: 'demo7', phone: '847890123', createdAt: null, likes: 108 },
    { id: 'd8', username: 'fatima_cabelo', nome: 'Fátima Namuera', bairro: 'Xipamanine', provincia: 'Maputo Cidade', profissao: 'Cabeleireira', descricao: 'Cabelo, tranças, manicure e pedicure. Domicílio disponível.', preco: '200-600 MT', verified: true, rating: 4.7, reviews: 245, emoji: '💇', uid: 'demo8', phone: '858901234', createdAt: null, likes: 73 },
    { id: 'd9', username: 'antonio_pedra', nome: 'António Guambe', bairro: 'Infulene', provincia: 'Maputo Província', profissao: 'Pedreiro', descricao: 'Construção, reparações, pinturas e betão.', preco: '500-3.000 MT', verified: false, rating: 4.4, reviews: 67, emoji: '🧱', uid: 'demo9', phone: '849012345', createdAt: null, likes: 21 },
    { id: 'd10', username: 'lucia_explica', nome: 'Lúcia Viegas', bairro: 'Malhangalene', provincia: 'Maputo Cidade', profissao: 'Explicadora', descricao: 'Matemática, Física e Química. 1ª ao 12ª classe.', preco: '400-800 MT/h', verified: true, rating: 4.9, reviews: 112, emoji: '📚', uid: 'demo10', phone: '860123456', createdAt: null, likes: 88 },
    { id: 'd11', username: 'helio_foto', nome: 'Hélio Mondlane', bairro: 'Sommerschield', provincia: 'Maputo Cidade', profissao: 'Fotógrafo', descricao: 'Eventos, casamentos, corporativa e retratos.', preco: '2.000-8.000 MT', verified: true, rating: 4.8, reviews: 89, emoji: '📷', uid: 'demo11', phone: '841234568', createdAt: null, likes: 65 },
    { id: 'd12', username: 'sandra_coz', nome: 'Sandra Bila', bairro: 'Alto Maé', provincia: 'Maputo Cidade', profissao: 'Cozinheira', descricao: 'Cozinha moçambicana e internacional. Catering.', preco: '1.000-5.000 MT', verified: false, rating: 4.7, reviews: 134, emoji: '👩‍🍳', uid: 'demo12', phone: '852345679', createdAt: null, likes: 47 },
  ];

  useEffect(() => {
    try {
      const q = query(collection(firestore, 'kayamoz_profissionais'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        const fb = snap.docs.map(d => ({ id: d.id, ...d.data() }) as KMProfissional);
        setProfs([...fb, ...demo]);
      }, () => setProfs(demo));
      return unsub;
    } catch { setProfs(demo); }
  }, []);

  const likeProf = async (p: KMProfissional) => {
    if (!fbUser) { setShowAuth(true); return; }
    if (!p.id.startsWith('d')) {
      await updateDoc(doc(firestore, 'kayamoz_profissionais', p.id), { likes: increment(1) });
    }
  };

  const filtered = profs.filter(p => {
    if (filterVerified && !p.verified) return false;
    if (filterProv !== 'Todos' && p.provincia !== filterProv) return false;
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())
      && !p.profissao.toLowerCase().includes(search.toLowerCase())
      && !p.bairro.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {showAuth && <UnifiedAuthModal onClose={() => setShowAuth(false)} initialTab="login" />}

      {/* Splash do KayaMoz */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-800 to-purple-900/40 border-b border-purple-500/20 px-4 py-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-white">Kaya<span className="text-purple-400">Moz</span></div>
          <p className="text-gray-500 text-xs">Trabalho real. No teu bairro.</p>
        </div>
        <div className="flex gap-2">
          {fbUser ? (
            <button onClick={() => setPage('publicar')} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-all">
              + Publicar
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-all">
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-3 space-y-3 border-b border-slate-800">
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Profissão, nome ou bairro..." className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm" />
          <button onClick={() => setFilterVerified(!filterVerified)} className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${filterVerified ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}>✅</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Todos', ...PROVINCIAS.slice(0, 5)].map(p => (
            <button key={p} onClick={() => setFilterProv(p)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterProv === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className={`bg-slate-800/60 border rounded-2xl overflow-hidden hover:border-purple-500/60 hover:-translate-y-0.5 transition-all cursor-pointer ${selected?.id === p.id ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700'}`}
            onClick={() => setSelected(selected?.id === p.id ? null : p)}
          >
            {/* Header do card */}
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 p-4 flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shrink-0">{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm truncate">{p.nome}</p>
                  {p.verified && <span className="text-blue-400 text-sm shrink-0" title="Verificado">✅</span>}
                </div>
                <p className="text-purple-300 text-xs font-medium">{p.profissao}</p>
                <p className="text-gray-500 text-[11px] truncate">📍 {p.bairro}, {p.provincia}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{p.descricao}</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= Math.round(p.rating) ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>)}
                  <span className="text-gray-500 text-xs ml-1">({p.reviews})</span>
                </div>
                <span className="text-green-400 text-xs font-semibold">{p.preco}</span>
              </div>

              {selected?.id === p.id && (
                <div className="mb-3 space-y-1 pt-3 border-t border-slate-700">
                  <p className="text-gray-400 text-xs">📱 +258 {p.phone}</p>
                  <p className="text-gray-400 text-xs">@{p.username}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <button onClick={e => { e.stopPropagation(); likeProf(p); }} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-all">
                      ❤️ {p.likes}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (!fbUser) { setShowAuth(true); return; }
                    setPage('chat');
                  }}
                  className="flex-1 py-2 bg-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-500/30 transition-all"
                >
                  💬 Chat
                </button>
                <a
                  href={wa(`Olá! Vi o perfil de ${p.nome} (${p.profissao}) no KayaMoz/Netek. Preciso dos seus serviços.`)}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-semibold hover:bg-green-500/30 transition-all"
                >
                  📱
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-2">🔍</p>
          <p>Nenhum profissional encontrado</p>
          <button onClick={() => { setSearch(''); setFilterProv('Todos'); setFilterVerified(false); }} className="mt-3 text-purple-400 text-sm hover:text-purple-300">Limpar filtros</button>
        </div>
      )}
    </>
  );
}

/* ─── PUBLICAR SERVIÇO ───────────────────────────────────── */
function KMPublicar({ fbUser, profile, setPage }: { fbUser: FBUser | null; profile: UnifiedUser | null; setPage: (p: KMPage) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<'trabalhador' | 'contratante' | ''>('');
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [f, setF] = useState({ username: '', nome: '', profissao: '', descricao: '', preco: '', bairro: profile?.bairro || '', provincia: profile?.provincia || 'Maputo Cidade', phone: profile?.phone || '', referral: '' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => { if (!fbUser) setShowAuth(true); }, [fbUser]);

  const submit = async () => {
    if (!fbUser) { setShowAuth(true); return; }
    setLoading(true);
    const data = {
      username: f.username || `user_${fbUser.uid.slice(0,6)}`,
      nome: f.nome || profile?.name || 'Utilizador',
      profissao: f.profissao,
      descricao: f.descricao,
      preco: f.preco,
      bairro: f.bairro,
      provincia: f.provincia,
      phone: f.phone || profile?.phone || '',
      verified: false,
      rating: 0,
      reviews: 0,
      emoji: '🔧',
      uid: fbUser.uid,
      likes: 0,
      tipo,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(firestore, 'kayamoz_profissionais'), data);
    setSuccess(true);
    setLoading(false);
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">Publicado com sucesso!</h2>
      <p className="text-gray-400 mb-6">O teu perfil aparecerá no mural de talentos do KayaMoz.</p>
      <button onClick={() => { setSuccess(false); setStep(1); setTipo(''); setPage('mural'); }} className="px-8 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all">
        Ver Mural
      </button>
    </div>
  );

  return (
    <>
      {showAuth && <UnifiedAuthModal onClose={() => setShowAuth(false)} initialTab="login" />}

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl font-bold text-white">📢 Publicar</div>
          <div className="flex-1 flex gap-1.5">
            {[1, 2].map(s => <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-purple-500' : 'bg-slate-700'}`} />)}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quem és?</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[{ id: 'trabalhador' as const, icon: '👷', label: 'Trabalhador', sub: 'Ofereço serviços' }, { id: 'contratante' as const, icon: '🤝', label: 'Contratante', sub: 'Preciso de serviços' }].map(o => (
                <button
                  key={o.id}
                  onClick={() => setTipo(o.id)}
                  className={`p-6 rounded-2xl border text-center transition-all ${tipo === o.id ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-slate-700 text-gray-400 hover:border-purple-500/50'}`}
                >
                  <div className="text-5xl mb-2">{o.icon}</div>
                  <div className="font-bold text-sm">{o.label}</div>
                  <div className="text-xs opacity-70 mt-1">{o.sub}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => tipo && setStep(2)}
              disabled={!tipo}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold disabled:opacity-40 hover:from-purple-600 hover:to-indigo-600 transition-all"
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors mb-2">← Voltar</button>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Profissão / Serviço *</label>
                <input value={f.profissao} onChange={e => set('profissao', e.target.value)} placeholder="Ex: Electricista, Designer, Motorista" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome de utilizador</label>
                <input value={f.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="joao_123" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Telefone *</label>
                <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+258 84..." className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bairro *</label>
                <input value={f.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Ex: Sommerschield" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Província</label>
                <select value={f.provincia} onChange={e => set('provincia', e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:outline-none text-sm">
                  {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Descrição *</label>
                <textarea value={f.descricao} onChange={e => set('descricao', e.target.value)} rows={3} placeholder="Descreva os seus serviços, experiência e disponibilidade..." className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Preço indicativo</label>
                <input value={f.preco} onChange={e => set('preco', e.target.value)} placeholder="Ex: 500-2.000 MT" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">🎁 Código de indicação</label>
                <input value={f.referral} onChange={e => set('referral', e.target.value.toUpperCase())} placeholder="NK1A2B3C" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm font-mono tracking-widest" />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={loading || !f.profissao || !f.phone || !f.bairro || !f.descricao}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold text-lg disabled:opacity-40 hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/25"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A publicar...</span> : '📢 Publicar no KayaMoz'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── CHAT AO VIVO ───────────────────────────────────────── */
const ROOMS = [
  { id: 'geral', label: '🌍 Geral' },
  { id: 'tecnologia', label: '💻 Tech' },
  { id: 'negocios', label: '💼 Negócios' },
  { id: 'kayamoz', label: '🔍 KayaMoz' },
  { id: 'emprego', label: '💼 Emprego' },
];

function KMChat({ fbUser }: { fbUser: FBUser | null; profile?: UnifiedUser | null }) {
  const [room, setRoom] = useState('geral');
  const [messages, setMessages] = useState<KMMessage[]>([]);
  const [text, setText] = useState('');
  const [online, setOnline] = useState(1);
  const [typing, setTyping] = useState<string[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    const msgRef = rtQuery(ref(db, `chat/${room}/messages`), orderByChild('createdAt'), limitToLast(60));
    const h = onValue(msgRef, snap => {
      const d = snap.val() || {};
      const msgs: KMMessage[] = Object.entries(d)
        .map(([id, v]) => ({ id, ...(v as Omit<KMMessage, 'id'>) }))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMessages(msgs);
    });
    return () => off(msgRef, 'value', h);
  }, [room]);

  useEffect(() => {
    if (!fbUser) return;
    const presRef = ref(db, `chat/${room}/online/${fbUser.uid}`);
    set(presRef, { name: fbUser.displayName || 'User', at: rtTs() });
    onDisconnect(presRef).remove();
    const allRef = ref(db, `chat/${room}/online`);
    const h = onValue(allRef, s => setOnline(s.size || 1));
    return () => { off(allRef, 'value', h); remove(presRef); };
  }, [fbUser, room]);

  useEffect(() => {
    const typRef = ref(db, `chat/${room}/typing`);
    const h = onValue(typRef, s => {
      const d = s.val() || {};
      setTyping(Object.entries(d).filter(([uid]) => uid !== fbUser?.uid).map(([, n]) => n as string));
    });
    return () => off(typRef, 'value', h);
  }, [room, fbUser]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleTyping = () => {
    if (!fbUser) return;
    const r = ref(db, `chat/${room}/typing/${fbUser.uid}`);
    set(r, fbUser.displayName || 'Alguém');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => remove(r), 2500);
  };

  const send = useCallback(async () => {
    if (!text.trim()) return;
    if (!fbUser) { setShowAuth(true); return; }
    const initials = (fbUser.displayName || fbUser.email || 'U')[0].toUpperCase();
    await push(ref(db, `chat/${room}/messages`), {
      text: text.trim(),
      senderId: fbUser.uid,
      senderName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilizador',
      senderAvatar: initials,
      createdAt: Date.now(),
      room,
    });
    setText('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    remove(ref(db, `chat/${room}/typing/${fbUser.uid}`));
  }, [text, fbUser, room]);

  return (
    <>
      {showAuth && <UnifiedAuthModal onClose={() => setShowAuth(false)} initialTab="login" />}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {/* Selector de sala */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-800 overflow-x-auto">
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => setRoom(r.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${room === r.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-slate-700'}`}>
              {r.label}
            </button>
          ))}
          <span className="shrink-0 flex items-center gap-1.5 ml-auto text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />{online} online
          </span>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 py-12">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">Sem mensagens ainda. Seja o primeiro!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = m.senderId === fbUser?.uid;
            return (
              <div key={m.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center text-purple-300 text-sm font-bold shrink-0">
                    {m.senderAvatar || 'U'}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && <p className="text-gray-500 text-[10px] mb-0.5 ml-1">{m.senderName}</p>}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-purple-500 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
                    {m.text}
                  </div>
                  <p className="text-gray-600 text-[9px] mt-0.5 mx-1">
                    {new Date(m.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {typing.length > 0 && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <div className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
              {typing.join(', ')} {typing.length === 1 ? 'está a escrever' : 'estão a escrever'}...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 p-3">
          {fbUser ? (
            <div className="flex gap-2">
              <input
                value={text}
                onChange={e => { setText(e.target.value); handleTyping(); }}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={`Mensagem em #${room}...`}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none text-sm"
              />
              <button onClick={send} className="w-11 h-11 bg-purple-500 text-white rounded-2xl flex items-center justify-center hover:bg-purple-600 transition-all">
                ➤
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="w-full py-3 bg-purple-500/20 text-purple-300 rounded-2xl text-sm font-semibold hover:bg-purple-500/30 transition-all border border-purple-500/30">
              🔐 Entrar para participar no chat
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── BUSCA AVANÇADA ─────────────────────────────────────── */
function KMBusca({ setPage: _sp }: { setPage: (p: KMPage) => void }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<KMProfissional[]>([]);
  const [searched, setSearched] = useState(false);

  const demo: KMProfissional[] = [
    { id: 'd1', username: 'carlos_elec', nome: 'Carlos Machava', bairro: 'Sommerschield', provincia: 'Maputo Cidade', profissao: 'Electricista', descricao: 'Instalações residenciais.', preco: '500-2.000 MT', verified: true, rating: 4.8, reviews: 127, emoji: '⚡', uid: 'd1', phone: '841234567', createdAt: null, likes: 45 },
    { id: 'd5', username: 'pedro_tech', nome: 'Pedro Nhaca', bairro: 'Maxaquene', provincia: 'Maputo Cidade', profissao: 'Técnico de Informática', descricao: 'Reparação de PCs e redes.', preco: '300-2.000 MT', verified: true, rating: 4.8, reviews: 94, emoji: '💻', uid: 'd5', phone: '855678901', createdAt: null, likes: 54 },
    { id: 'd2', username: 'maria_design', nome: 'Maria Santos', bairro: 'Polana', provincia: 'Maputo Cidade', profissao: 'Designer Gráfica', descricao: 'Logos e identidade visual.', preco: '800-3.000 MT', verified: true, rating: 4.9, reviews: 89, emoji: '🎨', uid: 'd2', phone: '852345678', createdAt: null, likes: 62 },
  ];

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearched(true);
    try {
      const q = query(collection(firestore, 'kayamoz_profissionais'));
      const snap = await getDocs(q);
      const fb = snap.docs.map(d => ({ id: d.id, ...d.data() }) as KMProfissional);
      const all = [...fb, ...demo];
      const s = search.toLowerCase();
      setResults(all.filter(p =>
        p.nome.toLowerCase().includes(s) ||
        p.profissao.toLowerCase().includes(s) ||
        p.bairro.toLowerCase().includes(s) ||
        p.descricao.toLowerCase().includes(s)
      ));
    } catch {
      setResults(demo.filter(p => p.profissao.toLowerCase().includes(search.toLowerCase())));
    }
  };

  const suggestions = ['Electricista', 'Design', 'Informática', 'Canalização', 'Motorista', 'Contabilidade', 'Costura', 'Fotografia'];

  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold text-white mb-4">🔎 Busca Avançada</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          placeholder="Profissão, nome, bairro..."
          className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-purple-500 focus:outline-none"
        />
        <button onClick={handleSearch} className="px-5 py-3 bg-purple-500 text-white rounded-2xl font-semibold hover:bg-purple-600 transition-all">Buscar</button>
      </div>
      {!searched && (
        <>
          <p className="text-gray-500 text-xs mb-3">Sugestões populares</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => { setSearch(s); }} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-gray-400 rounded-full text-xs hover:border-purple-500 hover:text-purple-400 transition-all">{s}</button>
            ))}
          </div>
        </>
      )}
      {searched && results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-3xl mb-2">😕</p>
          <p>Nenhum resultado para "{search}"</p>
          <button onClick={() => { setSearch(''); setSearched(false); }} className="mt-2 text-purple-400 text-sm">Limpar</button>
        </div>
      )}
      <div className="space-y-3 mt-4">
        {results.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-700 rounded-2xl hover:border-purple-500/50 transition-all">
            <div className="text-4xl">{p.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold">{p.nome}</p>
                {p.verified && <span className="text-blue-400 text-sm">✅</span>}
              </div>
              <p className="text-purple-300 text-sm">{p.profissao} · {p.bairro}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-yellow-400 text-xs">★ {p.rating}</span>
                <span className="text-green-400 text-xs">{p.preco}</span>
              </div>
            </div>
            <a href={wa(`Olá! Vi o perfil de ${p.nome} no KayaMoz.`)} target="_blank" rel="noreferrer"
              className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all">
              📱
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PERFIL DO UTILIZADOR ───────────────────────────────── */
function KMPerfil({ fbUser, profile, onLogout }: { fbUser: FBUser | null; profile: UnifiedUser | null; onLogout: () => void }) {
  const [showAuth, setShowAuth] = useState(false);
  const [myProfs, setMyProfs] = useState<KMProfissional[]>([]);

  useEffect(() => {
    if (!fbUser) return;
    const q = query(collection(firestore, 'kayamoz_profissionais'), where('uid', '==', fbUser.uid));
    const unsub = onSnapshot(q, snap => setMyProfs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as KMProfissional)));
    return unsub;
  }, [fbUser]);

  if (!fbUser) return (
    <>
      {showAuth && <UnifiedAuthModal onClose={() => setShowAuth(false)} />}
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-7xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-white mb-2">Faça login para ver o perfil</h2>
        <p className="text-gray-400 mb-6">A mesma conta funciona no KayaMoz e no Netek Services</p>
        <button onClick={() => setShowAuth(true)} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/25">
          🚀 Entrar / Criar Conta
        </button>
        <div className="mt-4 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Netek Services</span>
          <span className="text-gray-600 text-xs">+</span>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">KayaMoz</span>
        </div>
      </div>
    </>
  );

  const initials = (profile?.name || fbUser.displayName || fbUser.email || 'U')[0].toUpperCase();

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Card do perfil */}
      <div className="bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {fbUser.photoURL ? (
            <img src={fbUser.photoURL} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg">{profile?.name || fbUser.displayName || 'Utilizador'}</h2>
            <p className="text-gray-400 text-sm">{fbUser.email}</p>
            {profile?.bairro && <p className="text-gray-500 text-xs">📍 {profile.bairro}, {profile.provincia}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center bg-slate-900/50 rounded-xl p-3">
            <div className="text-xl font-bold text-purple-400">{profile?.points || 0}</div>
            <div className="text-xs text-gray-500">Pontos</div>
          </div>
          <div className="text-center bg-slate-900/50 rounded-xl p-3">
            <div className="text-xl font-bold text-green-400">{myProfs.length}</div>
            <div className="text-xs text-gray-500">Perfis</div>
          </div>
          <div className="text-center bg-slate-900/50 rounded-xl p-3">
            <div className="text-xl font-bold text-yellow-400">{profile?.referralCode || '—'}</div>
            <div className="text-[10px] text-gray-500">Código</div>
          </div>
        </div>
        {/* Plataformas */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <span className="text-gray-500 text-xs">Conta activa em:</span>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Netek Services</span>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">KayaMoz</span>
          {fbUser.providerData[0]?.providerId === 'google.com' && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Google</span>
          )}
        </div>
      </div>

      {/* Meus anúncios */}
      {myProfs.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">📢 Os meus anúncios</h3>
          {myProfs.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700 rounded-2xl mb-2">
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{p.profissao}</p>
                <p className="text-gray-500 text-xs">{p.bairro} · {p.preco}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${p.verified ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-gray-500'}`}>{p.verified ? '✅' : 'Pendente'}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onLogout} className="w-full py-3 bg-red-500/20 text-red-400 rounded-2xl text-sm font-semibold hover:bg-red-500/30 transition-all border border-red-500/20">
        🚪 Terminar Sessão
      </button>
    </div>
  );
}

/* ─── NOTIFICAÇÕES ───────────────────────────────────────── */
function KMNotificacoes({ fbUser }: { fbUser: FBUser | null }) {
  const notifs = [
    { i: '❤️', t: 'Carlos Machava curtiu o teu perfil', d: 'Há 5 min', read: false },
    { i: '💬', t: 'Nova mensagem na sala #geral', d: 'Há 12 min', read: false },
    { i: '✅', t: 'O teu perfil foi verificado!', d: 'Há 1h', read: true },
    { i: '🎁', t: 'Ganhou +50 pontos por indicação', d: 'Hoje', read: true },
    { i: '📢', t: 'Novo profissional na sua zona', d: 'Ontem', read: true },
  ];

  if (!fbUser) return (
    <div className="text-center py-16 px-4">
      <p className="text-4xl mb-2">🔔</p>
      <p className="text-gray-500">Entre para ver as notificações</p>
    </div>
  );

  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold text-white mb-4">🔔 Notificações</h2>
      <div className="space-y-2">
        {notifs.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl transition-all ${!n.read ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
            <span className="text-2xl shrink-0">{n.i}</span>
            <div className="flex-1">
              <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-gray-400'}`}>{n.t}</p>
              <p className="text-gray-600 text-xs mt-0.5">{n.d}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-purple-400 rounded-full shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — KAYAMOZ EMBEDDED
════════════════════════════════════════════════════════════ */
export function KayaMozApp({
  fbUser,
  profile,
  onLogout,
}: {
  fbUser: FBUser | null;
  profile: UnifiedUser | null;
  onLogout: () => void;
}) {
  const [page, setPage] = useState<KMPage>('mural');
  const unreadNotifs = fbUser ? 2 : 0;

  const renderPage = () => {
    switch (page) {
      case 'mural':       return <KMMural fbUser={fbUser} profile={profile} setPage={setPage} />;
      case 'publicar':    return <KMPublicar fbUser={fbUser} profile={profile} setPage={setPage} />;
      case 'chat':        return <KMChat fbUser={fbUser} profile={profile} />;
      case 'busca':       return <KMBusca setPage={setPage} />;
      case 'notificacoes':return <KMNotificacoes fbUser={fbUser} />;
      case 'perfil':      return <KMPerfil fbUser={fbUser} profile={profile} onLogout={onLogout} />;
      default:            return <KMMural fbUser={fbUser} profile={profile} setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-16 sm:pb-0">
      {/* Header do KayaMoz */}
      <div className="hidden sm:flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setPage('mural')} className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
            Kaya<span className="text-purple-400">Moz</span>
          </button>
          <span className="text-gray-700 text-xs">v2.0 · integrado</span>
        </div>
        <div className="flex gap-2">
          {[
            { id:'mural', l:'🔍 Mural' },
            { id:'busca', l:'🔎 Buscar' },
            { id:'publicar', l:'📢 Publicar' },
            { id:'chat', l:'💬 Chat' },
            { id:'notificacoes', l:'🔔' },
            { id:'perfil', l:'👤 Perfil' },
          ].map(it => (
            <button
              key={it.id}
              onClick={() => setPage(it.id as KMPage)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${page === it.id ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {it.l}
              {it.id === 'notificacoes' && unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadNotifs}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto">
        {renderPage()}
      </div>

      {/* Nav mobile */}
      <KMNav page={page} setPage={setPage} fbUser={fbUser} unreadNotifs={unreadNotifs} />
    </div>
  );
}
