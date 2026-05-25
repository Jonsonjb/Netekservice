import { useState, useEffect, useRef } from 'react';
import { WA, KAYAMOZ, ADMIN_EMAIL, ADMIN_PASS, CERT_HOURS, freeCourses, blogPostsData, talentsData } from './data';
import type { User } from './data';
import { OrcamentoPage, ConversoresPage, ChatIAPage, PomodoroPage, QRCodePage, GlossarioPage, SenhasPage, ShowcasePage, EmpregoPage, SimuladoresPage } from './features';
import { useFirebaseAuth, RealTimeChatPage, FirebaseProfilePage, ForumPage, FirebaseAdminPanel } from './FirebaseFeatures';
import { useUnifiedAuth, UnifiedAuthModal, UserAvatarButton } from './UnifiedAuth';
import { MarketplacePage } from './Marketplace';
import { BackofficeApp } from './Backoffice';
import { KayaMozApp } from './KayaMoz';
import { AuthSystemApp } from './AuthSystem';
import { LibraryPage } from './Library';
import { DonationsPage, DonationBanner } from './Donations';
import { FloorPlanPage } from './FloorPlan';
import { QuizOSINTPage } from './QuizOSINT';
import { CookieBanner, TermosPage, PrivacidadePage, ShareButtons, DevBioPage } from './Legal';

type Page = 'home' | 'servicos' | 'cursos' | 'blog' | 'agendamento' | 'directorio'
  | 'trabalhadores' | 'documentos' | 'minicurso' | 'talentos' | 'publicar'
  | 'perfil' | 'vercurso' | 'login' | 'admin' | 'sobre' | 'contato'
  | 'precos' | 'ia' | 'noticias' | 'simuladores'
  | 'orcamento' | 'conversores' | 'chatia' | 'pomodoro' | 'qrcode'
  | 'glossario' | 'senhas' | 'showcase' | 'emprego'
  | 'chat' | 'forum' | 'fbperfil' | 'marketplace' | 'backoffice' | 'kayamoz' | 'authsystem'
  | 'biblioteca' | 'donativos' | 'plantas' | 'quizzes'
  | 'termos' | 'privacidade' | 'desenvolvedor';

const WA_SVG = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function wa(msg: string) { return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; }

// ═══════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════
function Header({ page, setPage, sideOpen, setSideOpen, user, onLogout, onOpenAuth, fbUser, unifiedProfile }:
  { page: Page; setPage: (p: Page) => void; sideOpen: boolean; setSideOpen: (v: boolean) => void; user: User | null; onLogout: () => void; onOpenAuth: (tab: 'login'|'register') => void; fbUser: import('firebase/auth').User|null; unifiedProfile: import('./UnifiedAuth').UnifiedUser|null }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-2xl' : 'bg-transparent'}`}>
      <div className="flex items-center justify-between h-16 px-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setSideOpen(!sideOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white">
            {sideOpen ? '✕' : '☰'}
          </button>
          <button onClick={() => { setPage('home'); setSideOpen(false); window.scrollTo(0,0); }} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-sm">N</div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-none">Netek Services</p>
              <p className="text-cyan-400 text-[9px] tracking-widest">MOÇAMBIQUE</p>
            </div>
          </button>
        </div>
        <nav className="hidden xl:flex items-center gap-1 text-sm text-white/70">
          {[['home','Início'],['servicos','Serviços'],['talentos','Talentos'],['cursos','Cursos'],['documentos','Documentos'],['blog','Blog']].map(([p,l]) => (
            <button key={p} onClick={() => { setPage(p as Page); window.scrollTo(0,0); }} className={`px-3 py-2 rounded-lg transition-all ${page===p ? 'text-cyan-400 bg-cyan-500/10' : 'hover:text-white hover:bg-white/5'}`}>{l}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <UserAvatarButton
            profile={unifiedProfile}
            fbUser={fbUser}
            onOpenProfile={() => { setPage(user?.isAdmin ? 'admin' : 'fbperfil'); setSideOpen(false); window.scrollTo(0,0); }}
            onLogin={() => onOpenAuth('login')}
            onLogout={onLogout}
          />
          <a href={wa('Olá! Vim pelo site Netek Services.')} target="_blank" rel="noreferrer"
            className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-green-500/25">
            <WA_SVG />
          </a>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════
function Sidebar({ open, page, setPage, setOpen, user, onLogout }:
  { open: boolean; page: Page; setPage: (p: Page) => void; setOpen: (v: boolean) => void; user: User | null; onLogout: () => void }) {

  const nav = (p: Page) => { setPage(p); setOpen(false); window.scrollTo(0,0); };

  const sections = [
    { label: '🏠 PRINCIPAL', items: [
      { id:'home' as Page, icon:'🏠', label:'Início' },
      { id:'sobre' as Page, icon:'ℹ️', label:'Sobre a Netek' },
      { id:'contato' as Page, icon:'📬', label:'Contacto' },
    ]},
    { label: '🌐 SERVIÇOS', items: [
      { id:'servicos' as Page, icon:'🌐', label:'Internet & Soluções' },
      { id:'precos' as Page, icon:'💰', label:'Preços e Planos' },
      { id:'agendamento' as Page, icon:'📅', label:'Pré-Agendamento Oficial' },
    ]},
    { label: '👷 TALENTOS (KayaMoz)', items: [
      { id:'talentos' as Page, icon:'🔍', label:'Encontrar Talentos' },
      { id:'publicar' as Page, icon:'📢', label:'Publicar Serviço' },
      { id:'trabalhadores' as Page, icon:'📋', label:'Directório' },
    ]},
    { label: '🎓 APRENDER', items: [
      { id:'quizzes' as Page, icon:'🧠', label:'Quizzes & OSINT MZ' },
      { id:'cursos' as Page, icon:'📚', label:'Cursos com Certificado' },
      { id:'simuladores' as Page, icon:'🖥️', label:'Simuladores PC & Phone' },
      { id:'pomodoro' as Page, icon:'🍅', label:'Timer de Estudo' },
      { id:'ia' as Page, icon:'🤖', label:'Ferramentas de IA' },
      { id:'chatia' as Page, icon:'💬', label:'Chat com NeIA' },
      { id:'glossario' as Page, icon:'📖', label:'Glossário Tech' },
      { id:'blog' as Page, icon:'📰', label:'Blog & Tutoriais' },
      { id:'noticias' as Page, icon:'📡', label:'Novidades' },
    ]},
    { label: '🛠️ FERRAMENTAS', items: [
      { id:'plantas' as Page, icon:'🏠', label:'Plantas 2D & 3D' },
      { id:'biblioteca' as Page, icon:'📚', label:'Biblioteca Digital' },
      { id:'orcamento' as Page, icon:'💰', label:'Gerador de Orçamento' },
      { id:'conversores' as Page, icon:'💱', label:'Calculadoras Financeiras' },
      { id:'qrcode' as Page, icon:'📱', label:'Gerador QR Code' },
      { id:'senhas' as Page, icon:'🔐', label:'Gerador de Senhas' },
      { id:'donativos' as Page, icon:'❤️', label:'Donativos (Voluntário)' },
    ]},
    { label: '💼 OPORTUNIDADES', items: [
      { id:'emprego' as Page, icon:'💼', label:'Vagas de Emprego' },
      { id:'showcase' as Page, icon:'🚀', label:'Showcase MZ' },
    ]},
    { label: '🔍 KAYAMOZ (integrado)', items: [
      { id:'kayamoz' as Page, icon:'🔍', label:'KayaMoz – Talentos' },
    ]},
    { label: '🔥 FIREBASE (TEMPO REAL)', items: [
      { id:'marketplace' as Page, icon:'🛍️', label:'Marketplace de Vendas' },
      { id:'backoffice' as Page, icon:'👑', label:'Backoffice Admin' },
      { id:'authsystem' as Page, icon:'🔑', label:'Sistema Auth Admin/Mod' },
      { id:'chat' as Page, icon:'💬', label:'Chat ao Vivo' },
      { id:'forum' as Page, icon:'📌', label:'Fórum Comunidade' },
      { id:'fbperfil' as Page, icon:'🔐', label:'Perfil Firebase' },
    ]},
    { label: '📝 DOCUMENTOS', items: [
      { id:'documentos' as Page, icon:'📄', label:'CV, Cartas e Contratos' },
      { id:'directorio' as Page, icon:'🏛️', label:'Sites Oficiais MZ' },
    ]},
    { label: '👨‍💻 SOBRE', items: [
      { id:'desenvolvedor' as Page, icon:'👨‍💻', label:'Desenvolvedor @jonsonjb7' },
      { id:'termos' as Page, icon:'📜', label:'Termos de Uso' },
      { id:'privacidade' as Page, icon:'🔒', label:'Política de Privacidade' },
    ]},
  ];

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-16 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 overflow-y-auto transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 pb-20">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-cyan-400 text-xs font-semibold tracking-wide">🇲🇿 NETEK SERVICES v4.0</p>
            </div>
            <p className="text-gray-400 text-xs mt-1">Plataforma digital de Moçambique</p>
          </div>

          {sections.map((section, si) => (
            <div key={si} className="mb-5">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest mb-2 px-2 uppercase">{section.label}</p>
              {section.items.map((item) => (
                <button key={item.id} onClick={() => nav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${
                    page === item.id ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {page === item.id && <span className="w-1.5 h-5 bg-cyan-400 rounded-full" />}
                </button>
              ))}
            </div>
          ))}

          <div className="space-y-2 border-t border-slate-800 pt-4 mt-4">
            {user ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={() => nav('perfil')} className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all mb-1">👤 Ver Perfil</button>
                {user.isAdmin && <button onClick={() => nav('admin')} className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all mb-1">👑 Painel Admin</button>}
                <button onClick={() => { onLogout(); setOpen(false); }} className="w-full py-2 bg-slate-700 text-gray-400 rounded-lg text-xs font-medium hover:bg-slate-600 transition-all">🚪 Sair</button>
              </div>
            ) : (
              <button onClick={() => nav('login')} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">🚀 Entrar / Registar</button>
            )}
            <button onClick={() => { nav('kayamoz'); }} className="w-full flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-all">
              🔍 KayaMoz – Talentos & Chat
            </button>
            <a href={wa('Olá! Preciso de ajuda com a Netek Services.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm hover:bg-green-500/20 transition-all">
              <WA_SVG /> WhatsApp – Suporte
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// FLOATING WHATSAPP
// ═══════════════════════════════════════════════════════════
function WAFloat() {
  return (
    <a href={wa('Olá! Vim pelo site Netek Services.')} target="_blank" rel="noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/40 hover:bg-green-600 hover:scale-110 transition-all z-50">
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════
function Hero({ setPage }: { setPage: (p: Page) => void }) {
  const cards = [
    { icon:'🛍️', t:'Marketplace', d:'Compra e venda pelo WhatsApp', p:'marketplace' as Page },
    { icon:'🔍', t:'KayaMoz – Talentos', d:'Profissionais no seu bairro', p:'kayamoz' as Page },
    { icon:'📚', t:'Cursos + Certificado', d:'265h para certificar', p:'cursos' as Page },
    { icon:'📄', t:'Criar Documentos', d:'CV, Carta e Contrato', p:'documentos' as Page },
    { icon:'📚', t:'Biblioteca Digital', d:'Livros grátis + E-Reader', p:'biblioteca' as Page },
    { icon:'🏠', t:'Plantas 2D & 3D', d:'Desenhe a sua casa grátis', p:'plantas' as Page },
  ];
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay:'1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay:'2s' }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 text-sm font-medium">🇲🇿 A Plataforma Digital de Moçambique</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Tudo que precisa<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">num só lugar.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg">Internet, talentos, cursos, documentos, pré-agendamentos e IA. <span className="text-cyan-400 font-medium">Feito para Moçambique.</span></p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setPage('cursos')} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25">
                📚 Ver Cursos Grátis
              </button>
              <button onClick={() => { setPage('kayamoz'); window.scrollTo(0,0); }} className="px-8 py-4 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl font-semibold hover:bg-purple-500/30 transition-all">
                🔍 Abrir KayaMoz
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
              {[['5K+','Utilizadores'],['12','Cursos'],['265h','p/ Certificado'],['99.9%','Uptime']].map(([v,l]) => (
                <div key={l}><div className="text-2xl font-bold text-white">{v}</div><div className="text-xs text-gray-400">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <button key={i} onClick={() => { setPage(card.p); window.scrollTo(0,0); }}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-left hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{card.icon}</div>
                <h3 className="text-white font-semibold mb-1 text-sm">{card.t}</h3>
                <p className="text-gray-400 text-xs">{card.d}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin, setPage }: { onLogin: (u: User) => void; setPage: (p: Page) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', location:'Moçambique' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = () => {
    setError('');
    if (!form.email || !form.password) { setError('Preencha email e senha!'); return; }
    if (form.email === ADMIN_EMAIL && form.password === ADMIN_PASS) {
      onLogin({ id:'admin', name:'Admin JonsonJB', email:ADMIN_EMAIL, phone:'+258 83 510 9190', location:'Maputo, MZ', avatar:'👑', isAdmin:true });
      setPage('admin'); return;
    }
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('netek_users') || '[]');
    const u = users.find(u => u.email === form.email && u.password === form.password);
    if (u) { const { password: _, ...ud } = u; onLogin(ud); setPage('perfil'); }
    else setError('Email ou senha incorrectos!');
  };

  const handleRegister = () => {
    setError('');
    if (!form.name || !form.email || !form.password || !form.phone) { setError('Preencha todos os campos!'); return; }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres!'); return; }
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('netek_users') || '[]');
    if (users.find(u => u.email === form.email)) { setError('Email já está registado!'); return; }
    const newUser = { id: Date.now().toString(), name:form.name, email:form.email, phone:form.phone, location:form.location, avatar:'👤', isAdmin:false, bio:'', joined: new Date().toLocaleDateString('pt-MZ'), points:0, password:form.password };
    users.push(newUser);
    localStorage.setItem('netek_users', JSON.stringify(users));
    const { password: _, ...ud } = newUser;
    onLogin(ud); setPage('perfil');
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">N</div>
          <h1 className="text-2xl font-bold text-white">{isRegister ? '📝 Criar Conta' : '🚀 Entrar'}</h1>
          <p className="text-gray-400 text-sm">{isRegister ? 'Registe-se na Netek Services' : 'Acesse a sua conta'}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">❌ {error}</div>}
          <div className="space-y-3">
            {isRegister && <>
              <div><label className="block text-xs text-gray-400 mb-1">Nome Completo *</label><input value={form.name} onChange={e => set('name',e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="Seu nome" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Telefone *</label><input value={form.phone} onChange={e => set('phone',e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="+258 84 000 0000" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Localização</label><input value={form.location} onChange={e => set('location',e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="Maputo, Moçambique" /></div>
            </>}
            <div><label className="block text-xs text-gray-400 mb-1">Email *</label><input type="email" value={form.email} onChange={e => set('email',e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="seu@email.com" /></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Senha *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password',e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm pr-12" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <button onClick={isRegister ? handleRegister : handleLogin} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">
              {isRegister ? '📝 Criar Conta' : '🚀 Entrar'}
            </button>
            {!isRegister && (
              <button onClick={() => { set('email', ADMIN_EMAIL); }} className="w-full py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-sm hover:bg-yellow-500/20 transition-all">
                👑 Pré-preencher Admin
              </button>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-cyan-400 text-sm hover:text-cyan-300">
              {isRegister ? '← Já tenho conta' : 'Criar conta →'}
            </button>
            <button onClick={() => setPage('home')} className="text-gray-400 text-sm hover:text-white">Continuar sem conta</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════
function ServicesPage() {
  const services = [
    { icon:'🌐', title:'Internet Fibra Óptica', desc:'Alta velocidade para empresas e residências em Moçambique.', feat:['Até 1Gbps','Suporte 24/7','Sem limite de dados','IP fixo disponível'] },
    { icon:'📡', title:'Internet por Rádio', desc:'Solução ideal para zonas sem fibra óptica disponível.', feat:['Cobertura ampla','Instalação rápida','Planos flexíveis','Suporte local'] },
    { icon:'☁️', title:'Hospedagem de Sites', desc:'Servidores rápidos para os seus sites e aplicações.', feat:['SSL grátis','Backup diário','99.9% uptime','cPanel incluído'] },
    { icon:'📧', title:'Email Corporativo', desc:'Email com o seu domínio para imagem profissional.', feat:['nome@empresa.co.mz','100GB de espaço','Anti-spam','Colaboração'] },
    { icon:'🛡️', title:'Segurança Digital', desc:'Proteja o seu negócio contra ameaças digitais.', feat:['Antivírus','Firewall','Monitorização','Auditoria'] },
    { icon:'💼', title:'Consultoria Digital', desc:'Transformação digital completa para o seu negócio.', feat:['Diagnóstico','Plano de acção','Implementação','Acompanhamento'] },
    { icon:'📱', title:'Desenvolvimento de Apps', desc:'Apps mobile para Android e iOS.', feat:['Design personalizado','React Native','Integração APIs','Publicação nas stores'] },
    { icon:'🔧', title:'Suporte Técnico', desc:'Resolução rápida de problemas técnicos.', feat:['Remoto e presencial','Resposta em 2h','Contrato mensal','Equipa certificada'] },
  ];
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium mb-4">🌐 SERVIÇOS</span>
          <h2 className="text-4xl font-bold text-white mb-4">Soluções Digitais Completas</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Da internet ao desenvolvimento, temos tudo o que o seu negócio precisa para crescer digitalmente em Moçambique.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {services.map((s, i) => (
            <div key={i} className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-cyan-500/50 hover:bg-slate-800 transition-all">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{s.icon}</div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-xs mb-3">{s.desc}</p>
              <ul className="space-y-1 mb-4">{s.feat.map((f,j) => <li key={j} className="flex items-center gap-2 text-xs text-gray-300"><span className="text-cyan-400">✓</span>{f}</li>)}</ul>
              <a href={wa(`Olá! Tenho interesse no serviço: ${s.title}`)} target="_blank" rel="noreferrer" className="block w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-xl text-xs font-medium text-center hover:bg-cyan-500/30 transition-all">
                Pedir orçamento
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PRECOS
// ═══════════════════════════════════════════════════════════
function PrecosPage() {
  const plans = [
    { name:'Casa', speed:'50 Mbps', price:1500, feat:['Uso doméstico','Streaming HD','5 dispositivos','Suporte WhatsApp'], color:'from-gray-500 to-gray-600', pop:false },
    { name:'Pro', speed:'200 Mbps', price:3500, feat:['Pequenas empresas','Streaming 4K','15 dispositivos','Suporte prioritário','IP Fixo'], color:'from-cyan-500 to-blue-600', pop:true },
    { name:'Negócio', speed:'500 Mbps', price:8000, feat:['Empresas médias','Alta velocidade','30 dispositivos','SLA garantido','Failover'], color:'from-purple-500 to-indigo-600', pop:false },
    { name:'Enterprise', speed:'1 Gbps', price:20000, feat:['Grandes empresas','Velocidade máxima','Ilimitado','SLA premium','24/7 dedicado','IP bloco'], color:'from-yellow-500 to-orange-500', pop:false },
  ];
  const extras = [
    { name:'IP Fixo adicional', price:500, per:'mês' },
    { name:'Domínio .co.mz', price:1200, per:'ano' },
    { name:'Email corporativo', price:800, per:'mês' },
    { name:'SSL wildcard', price:2000, per:'ano' },
    { name:'Backup cloud 100GB', price:600, per:'mês' },
    { name:'Suporte 24/7', price:1500, per:'mês' },
  ];
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium mb-4">💰 PREÇOS</span>
          <h2 className="text-4xl font-bold text-white mb-4">Planos Transparentes em Meticais</h2>
          <p className="text-gray-400">Todos incluem instalação gratuita. Sem taxas escondidas.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {plans.map((p, i) => (
            <div key={i} className={`relative bg-slate-800/50 border rounded-2xl p-6 ${p.pop ? 'border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-105' : 'border-slate-700'}`}>
              {p.pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full">⭐ MAIS POPULAR</div>}
              <div className={`w-12 h-12 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center text-white text-xl mb-4`}>📶</div>
              <h4 className="text-white font-bold text-lg mb-1">{p.name}</h4>
              <p className="text-4xl font-bold text-white mb-1">{p.speed}</p>
              <div className="border-b border-slate-700 pb-4 mb-4">
                <span className="text-3xl font-bold text-cyan-400">{p.price.toLocaleString()}</span>
                <span className="text-gray-400 text-sm"> MT/mês</span>
              </div>
              <ul className="space-y-2 mb-6">{p.feat.map((f,j) => <li key={j} className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span>{f}</li>)}</ul>
              <a href={wa(`Olá! Quero contratar o plano ${p.name} de ${p.speed}.`)} target="_blank" rel="noreferrer"
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${p.pop ? `bg-gradient-to-r ${p.color} text-white shadow-lg` : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>
                Contratar Agora
              </a>
            </div>
          ))}
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">➕ Serviços Adicionais</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {extras.map((e, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-white text-sm font-medium">{e.name}</p>
                <p className="text-cyan-400 font-bold">{e.price.toLocaleString()} MT</p>
                <p className="text-gray-500 text-xs">/{e.per}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">Métodos de pagamento aceites:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['💚 M-Pesa','🔵 e-Mola','🏦 Transferência Bancária','💳 Visa/Mastercard'].map((m,i) => (
              <span key={i} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// TALENTOS
// ═══════════════════════════════════════════════════════════
function TalentosPage({ setPage }: { setPage?: (p: Page) => void } = {}) {
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = talentsData.filter(t => {
    if (filterVerified && !t.v) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return t.n.toLowerCase().includes(s) || t.p.toLowerCase().includes(s) || t.loc.toLowerCase().includes(s);
  });
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium mb-4">🔍 MURAL DE TALENTOS</span>
          <h2 className="text-4xl font-bold text-white mb-2">Encontre Profissionais no Seu Bairro</h2>
          <p className="text-gray-400">Powered by <span className="text-purple-400 font-semibold">KayaMoz</span> – integrado nesta plataforma.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[{i:'🔍',t:'Encontrar talentos'},{i:'📢',t:'Publicar serviços'},{i:'💬',t:'Chat KayaMoz'},{i:'✅',t:'Verificação (50MT)'},{i:'💰',t:'Ganhar pontos'},{i:'⭐',t:'Avaliações'}].map((f,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{f.i}</div><p className="text-xs text-gray-400">{f.t}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar por nome, profissão ou localização..." className="flex-1 px-5 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none" />
          <button onClick={() => setFilterVerified(!filterVerified)} className={`px-5 py-3 rounded-xl font-medium transition-all ${filterVerified ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}>✅ Verificados</button>
          <button onClick={() => { setPage?.('kayamoz'); window.scrollTo(0,0); }} className="px-5 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-all">📢 Publicar</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => (
            <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)} className={`bg-slate-800/50 border rounded-2xl overflow-hidden transition-all cursor-pointer ${selected === t.id ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700 hover:border-purple-500/50'}`}>
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 p-4 flex items-center gap-3">
                <div className="text-4xl">{t.img}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h4 className="text-white font-semibold text-sm">{t.n}</h4>
                    {t.v && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">✅</span>}
                  </div>
                  <p className="text-purple-400 text-xs font-medium">{t.p}</p>
                  <p className="text-gray-500 text-[10px] truncate">📍 {t.loc}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-400 text-xs mb-3">{t.d}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400 text-sm">★ {t.r}</span>
                  <span className="text-gray-500 text-xs">({t.rv} av.)</span>
                </div>
                {selected === t.id && <p className="text-xs text-gray-400 mb-2">📞 +258 {t.ph}</p>}
                <div className="flex gap-2">
                  <button onClick={e => { e.stopPropagation(); setPage?.('kayamoz'); window.scrollTo(0,0); }} className="flex-1 py-2 bg-purple-500 text-white rounded-xl text-xs font-medium text-center hover:bg-purple-600 transition-all">💬 Chat</button>
                  <a href={wa(`Olá! Precisode um ${t.p}. Contacto de ${t.n} do Netek Services.`)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all">📱</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <button onClick={() => { setPage?.('kayamoz'); window.scrollTo(0,0); }} className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all">📢 Registar como Profissional</button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PUBLICAR
// ═══════════════════════════════════════════════════════════
function PublicarPage({ setPage }: { setPage?: (p: Page) => void } = {}) {
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium mb-4">📢 PUBLICAR NO KAYAMOZ</span>
          <h2 className="text-3xl font-bold text-white mb-2">Publique o Seu Trabalho</h2>
          <p className="text-gray-400">Divulgue os seus serviços e seja encontrado por clientes na sua zona.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[{i:'👷',t:'Trabalhador',d:'Publique os seus serviços'},{i:'🤝',t:'Contratante',d:'Encontre profissionais'}].map((o,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-4xl mb-2">{o.i}</div>
              <h4 className="text-white font-semibold mb-1">{o.t}</h4>
              <p className="text-gray-400 text-xs">{o.d}</p>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-2xl font-bold text-white mb-2">Publique no KayaMoz</h3>
          <p className="text-gray-400 mb-6">O KayaMoz é a plataforma moçambicana de talentos e trabalho.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { setPage?.('kayamoz'); window.scrollTo(0,0); }} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all">🚀 Publicar Agora (KayaMoz)</button>
            <button onClick={() => { setPage?.('kayamoz'); window.scrollTo(0,0); }} className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/10">🔍 Ver Talentos</button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[{i:'💬',t:'Chat Directo'},{i:'✅',t:'Verificação 50MT'},{i:'💰',t:'Ganhe Pontos'}].map((b,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{b.i}</div><p className="text-white text-xs font-medium">{b.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// DIRECTÓRIO
// ═══════════════════════════════════════════════════════════
function DirectorioPage() {
  const sites = [
    { n:'Portal do Governo',u:'https://portaldogoverno.gov.mz',i:'🏛️',c:'Governo',desc:'Portal oficial do Governo de Moçambique com serviços e informações.' },
    { n:'SIGAV SENAMI',u:'https://sigav.senami.gov.mz',i:'✈️',c:'Migração',desc:'Agendamento de passaporte, DIRE e serviços de migração.' },
    { n:'DNIC ePBI',u:'https://www.dnic.gov.mz',i:'🆔',c:'Documentos',desc:'Bilhete de Identidade – marcação e informações.' },
    { n:'INATRO Balcão',u:'https://www.balcaovirtual.inatro.gov.mz',i:'🚗',c:'Transportes',desc:'Carta de condução, multas e serviços de condutores.' },
    { n:'eVisa Moçambique',u:'https://evisa.gov.mz',i:'🛂',c:'Migração',desc:'Pedido de visto electrónico para entrar em Moçambique.' },
    { n:'Portal SRN',u:'https://utente.srn.gov.mz',i:'📋',c:'Registos',desc:'Registos e notariado – certidões, empresas, civil.' },
    { n:'BAU, IP',u:'https://www.bau.gov.mz',i:'🏢',c:'Serviços',desc:'Balcão de Atendimento Único – licenças e serviços integrados.' },
    { n:'Autoridade Tributária',u:'https://www.at.gov.mz',i:'💰',c:'Impostos',desc:'NUIT, declarações fiscais, impostos e taxas.' },
    { n:'Portal INEP Emprego',u:'https://emprego.inep.gov.mz/public/home',i:'💼',c:'Emprego',desc:'Vagas de emprego, candidatos e orientação profissional.' },
    { n:'BIM',u:'https://www.bim.co.mz',i:'🏦',c:'Bancos',desc:'Banco Internacional de Moçambique – serviços financeiros.' },
    { n:'Millennium BIM',u:'https://www.millenniumbim.co.mz',i:'🏦',c:'Bancos',desc:'Serviços bancários, cartões e internet banking.' },
    { n:'Standard Bank MZ',u:'https://www.standardbank.co.mz',i:'🏦',c:'Bancos',desc:'Banca pessoal, empresarial e crédito.' },
    { n:'EDM',u:'https://www.edm.co.mz',i:'⚡',c:'Utilidades',desc:'Electricidade de Moçambique – ligações e serviços.' },
    { n:'Vodacom Moçambique',u:'https://www.vodacom.co.mz',i:'📱',c:'Telecom',desc:'Telecomunicações, M-Pesa e dados móveis.' },
    { n:'Movitel',u:'https://www.movitel.co.mz',i:'📱',c:'Telecom',desc:'Cobertura nacional de telecomunicações.' },
    { n:'Ministério da Saúde',u:'https://www.misau.gov.mz',i:'🏥',c:'Saúde',desc:'Informações sobre saúde pública e serviços de saúde.' },
  ];
  const [cat, setCat] = useState('Todos');
  const cats = ['Todos',...new Set(sites.map(s => s.c))];
  const filtered = cat === 'Todos' ? sites : sites.filter(s => s.c === cat);
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-4">🌐 SITES OFICIAIS</span>
          <h2 className="text-4xl font-bold text-white mb-4">Directório de Moçambique</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Acesse directamente os sites oficiais. A Netek ajuda se tiver dificuldades.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${cat === c ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-slate-700'}`}>{c}</button>)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((s,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{s.i}</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">{s.n}</h4>
                  <span className="text-blue-400 text-xs">{s.c}</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-4">{s.desc}</p>
              <div className="flex gap-2">
                <a href={s.u} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium text-center hover:bg-blue-500/30 transition-all">Abrir Site</a>
                <a href={wa(`Olá! Preciso de ajuda com o site: ${s.n}`)} target="_blank" rel="noreferrer" className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-all">📱</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// AGENDAMENTO
// ═══════════════════════════════════════════════════════════
function AgendamentoPage() {
  const bookings = [
    { id:1, t:'Renovar BI', l:'DNIC', i:'🆔', p:500, r:['BI antigo ou expirado','Certidão de nascimento','Foto tipo passe','Taxa de emolumentos'], url:'https://www.dnic.gov.mz' },
    { id:2, t:'Passaporte Normal', l:'SENAMI', i:'✈️', p:2400, r:['BI válido','Certidão nascimento','Foto','Comprovativo pagamento'], url:'https://sigav.senami.gov.mz' },
    { id:3, t:'Passaporte Urgente', l:'SENAMI', i:'🚀', p:2775, r:['BI válido','Certidão nascimento','Motivo urgência'], url:'https://sigav.senami.gov.mz' },
    { id:4, t:'Renovar Carta Condução', l:'INATRO', i:'🚗', p:2500, r:['Carta antiga','BI','Exame médico','Pagamento antecipado'], url:'https://www.balcaovirtual.inatro.gov.mz' },
    { id:5, t:'Registar Nascimento', l:'Conservatória', i:'👶', p:300, r:['Certidão hospital','BI dos pais','Declaração testemunhas'], url:'https://utente.srn.gov.mz' },
    { id:6, t:'Abrir Empresa', l:'BAU', i:'🏢', p:2000, r:['BI sócios','NUIT','Estatutos','Capital inicial'], url:'https://www.bau.gov.mz' },
    { id:7, t:'Obter NUIT', l:'Autoridade Tributária', i:'📋', p:200, r:['BI válido','Comprovativo residência','Formulário M/01S'], url:'https://www.at.gov.mz' },
    { id:8, t:'Visto eVisa', l:'SENAMI', i:'🛂', p:3000, r:['Passaporte válido','Carta convite','Comprovativo financeiro','Seguro viagem'], url:'https://evisa.gov.mz' },
    { id:9, t:'Registo Automóvel', l:'SRN', i:'🚘', p:1500, r:['BI','Escritura compra/venda','Livrete','Seguro válido'], url:'https://utente.srn.gov.mz' },
    { id:10, t:'Registo Criminal', l:'Conservatória', i:'📜', p:400, r:['BI válido','Formulário','Taxa'], url:'https://utente.srn.gov.mz' },
    { id:11, t:'Casamento Civil', l:'Conservatória', i:'💍', p:1000, r:['BI dos noivos','Certidão nascimento','Testemunhas','Processo'], url:'https://utente.srn.gov.mz' },
    { id:12, t:'Licença de Actividade', l:'BAU', i:'📃', p:3000, r:['NUIT','BI','Locação ou título','Planta'], url:'https://www.bau.gov.mz' },
  ];
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium mb-4">📅 AGENDAMENTO OFICIAL</span>
          <h2 className="text-4xl font-bold text-white mb-4">Serviços Públicos Oficiais</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">A Netek ajuda quando o processo digital é difícil. Os serviços continuam nas instituições oficiais.</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8 text-center">
          <p className="text-green-400 font-medium">✅ Não consegue fazer sozinho? <a href={wa('Olá! Não estou a conseguir fazer pré-marcação online. Preciso de ajuda.')} target="_blank" rel="noreferrer" className="underline hover:text-green-300">A Netek ajuda pelo WhatsApp</a></p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{b.i}</span>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">{b.t}</h4>
                  <p className="text-gray-400 text-xs">{b.l}</p>
                </div>
                <span className="text-purple-400 text-sm font-semibold">{b.p} MT</span>
              </div>
              {expanded === b.id && (
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Documentos necessários:</p>
                  <ul className="space-y-1">{b.r.map((r,i) => <li key={i} className="flex items-center gap-1 text-xs text-gray-300"><span className="text-green-400">✓</span>{r}</li>)}</ul>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <a href={b.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium text-center hover:bg-blue-500/30 transition-all">Site Oficial</a>
                <a href={wa(`Olá! Preciso de ajuda para agendar: ${b.t}`)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium text-center hover:bg-green-500/30 transition-all">📱 Ajuda</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// DOCUMENTOS
// ═══════════════════════════════════════════════════════════
function DocumentosPage() {
  const [tab, setTab] = useState<'cv'|'carta'|'contrato'>('cv');
  const [f, setF] = useState<Record<string,string>>({});
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const send = () => {
    let msg = '';
    if (tab === 'cv') {
      msg = `📄 CRIAR CV\n👤 Nome: ${f.nome||'—'}\n📧 Email: ${f.email||'—'}\n📞 Tel: ${f.tel||'—'}\n📍 Local: ${f.local||'—'}\n🎯 Objetivo: ${f.obj||'—'}\n💼 Experiência: ${f.exp||'—'}\n🎓 Formação: ${f.form||'—'}\n🛠️ Competências: ${f.comp||'—'}\n📝 Idiomas: ${f.idi||'—'}`;
    } else if (tab === 'carta') {
      msg = `✉️ CRIAR CARTA\n📋 Tipo: ${f.tipo||'—'}\n👤 Destinatário: ${f.dest||'—'}\n🏢 Empresa: ${f.emp||'—'}\n📝 Conteúdo: ${f.cont||'—'}\n👤 Remetente: ${f.nome||'—'}\n📞 Contacto: ${f.tel||'—'}`;
    } else {
      msg = `📋 CRIAR CONTRATO\n📄 Tipo: ${f.tipo||'—'}\n👤 Parte A: ${f.c1||'—'} | ${f.t1||'—'}\n👤 Parte B: ${f.c2||'—'} | ${f.t2||'—'}\n📝 Detalhes: ${f.det||'—'}\n💰 Valor: ${f.val||'—'} MT\n📅 Prazo: ${f.prazo||'—'}`;
    }
    window.open(wa(msg), '_blank');
  };
  const inp = (k: string, ph: string, full?: boolean) => (
    <input value={f[k]||''} onChange={e => set(k,e.target.value)} placeholder={ph} className={`${full ? 'col-span-2' : ''} w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm`} />
  );
  const ta = (k: string, ph: string, rows?: number) => (
    <textarea value={f[k]||''} onChange={e => set(k,e.target.value)} placeholder={ph} rows={rows||3} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none resize-none text-sm" />
  );
  const sel = (k: string, opts: string[]) => (
    <select value={f[k]||''} onChange={e => set(k,e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm">
      <option value="">Seleccione...</option>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-4">📝 DOCUMENTOS</span>
          <h2 className="text-3xl font-bold text-white mb-2">Criar CV, Cartas e Contratos</h2>
          <p className="text-gray-400">Preencha o formulário → dados enviados para o WhatsApp da Netek</p>
        </div>
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-2 rounded-2xl">
          {[{id:'cv' as const,l:'📄 Criar CV'},{id:'carta' as const,l:'✉️ Carta'},{id:'contrato' as const,l:'📋 Contrato'}].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setF({}); }} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${tab===t.id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{t.l}</button>
          ))}
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {inp('nome','Nome completo *')}
            {inp('tel','Telefone / WhatsApp *')}
            {inp('email','Email')}
            {inp('local','Localização')}
          </div>
          {tab === 'cv' && <div className="space-y-4">
            {ta('obj','Objetivo profissional...',2)}
            {ta('exp','Experiência (empresa, função, datas)',4)}
            <div className="grid md:grid-cols-2 gap-4">{ta('form','Formação académica',3)}{ta('comp','Competências e habilidades',3)}</div>
            {inp('idi','Idiomas (ex: Português, Inglês, Changana)')}
          </div>}
          {tab === 'carta' && <div className="space-y-4">
            {sel('tipo',['Apresentação','Motivação','Reclamação','Solicitação','Demissão','Referência','Pedido de Emprego'])}
            <div className="grid md:grid-cols-2 gap-4">{inp('dest','Destinatário')}{inp('emp','Empresa / Instituição')}</div>
            {ta('cont','Descreva o objectivo da carta...',5)}
          </div>}
          {tab === 'contrato' && <div className="space-y-4">
            {sel('tipo',['Trabalho','Prestação de Serviços','Arrendamento','Compra e Venda','Parceria','Confidencialidade (NDA)','Empreitada'])}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700">
              <p className="col-span-2 text-white font-medium text-sm">👤 Parte A (Contratante)</p>
              {inp('c1','Nome / Empresa')}{inp('t1','Contacto')}
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700">
              <p className="col-span-2 text-white font-medium text-sm">👤 Parte B (Contratado)</p>
              {inp('c2','Nome / Empresa')}{inp('t2','Contacto')}
            </div>
            {ta('det','Serviço, obrigações e condições...',4)}
            <div className="grid md:grid-cols-2 gap-4">{inp('val','Valor (MT)')}{inp('prazo','Prazo / Duração')}</div>
          </div>}
          <button onClick={send} className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2">
            <WA_SVG /> Enviar Dados para WhatsApp
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">💰 A partir de 500 MT por documento | Entrega em 24h</p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CURSOS
// ═══════════════════════════════════════════════════════════
function CursosPage({ setPage, setSelectedCourse }: { setPage: (p: Page) => void; setSelectedCourse: (id: number) => void }) {
  const [cat, setCat] = useState('todos');
  const cats = ['todos',...new Set(freeCourses.map(c => c.cat))];
  const filtered = cat === 'todos' ? freeCourses : freeCourses.filter(c => c.cat === cat);
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">🎓 CURSOS COM CERTIFICADO</span>
          <h2 className="text-4xl font-bold text-white mb-4">12 Cursos Gratuitos</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Estude 265 horas, passe os quizzes e receba o certificado da Netek Academy.</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-yellow-400 font-semibold">Sistema de Certificação</p>
              <p className="text-gray-400 text-sm">Complete os módulos + quizzes + acumule 265 horas de estudo = Certificado oficial da Netek Academy</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cat===c ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}`}>{c === 'todos' ? '🎯 Todos (12)' : c}</button>)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-green-500/50 hover:-translate-y-1 transition-all group">
              <div className="h-28 bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">{c.img}</div>
              <div className="p-4">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full font-medium">GRÁTIS</span>
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-[10px] rounded-full">{c.platform}</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-full">{c.cat}</span>
                </div>
                <h3 className="text-white font-semibold mb-1 text-sm leading-snug">{c.title}</h3>
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{c.desc}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>⏱ {c.hours}h</span>
                  <span>📚 {c.modules.length} módulos</span>
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">{c.level}</span>
                </div>
                <button onClick={() => { setSelectedCourse(c.id); setPage('vercurso'); window.scrollTo(0,0); }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all">
                  📚 Começar Curso
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// COURSE VIEWER
// ═══════════════════════════════════════════════════════════
function CourseViewer({ courseId, setPage }: { courseId: number; setPage: (p: Page) => void }) {
  const course = freeCourses.find(c => c.id === courseId);
  const [mod, setMod] = useState(0);
  const [answers, setAnswers] = useState<(number|null)[]>([]);
  const [results, setResults] = useState<(boolean|null)[]>([]);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [showCert, setShowCert] = useState(false);
  const [studName, setStudName] = useState('');
  const [studyMins, setStudyMins] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const timerRef = useRef<number|null>(null);

  useEffect(() => {
    if (course) { setAnswers(new Array(course.modules[mod].quiz.length).fill(null)); setResults(new Array(course.modules[mod].quiz.length).fill(null)); }
  }, [mod, course]);

  useEffect(() => {
    if (timerOn) { timerRef.current = window.setInterval(() => setStudyMins(p => p+1), 60000); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOn]);

  if (!course) return null;
  const m = course.modules[mod];
  const completedCount = completed.filter(Boolean).length;
  const progress = Math.round((completedCount / course.modules.length) * 100);
  const studyHrs = (studyMins/60).toFixed(1);
  const canCert = studyMins >= CERT_HOURS * 60 && completedCount === course.modules.length;

  const submit = () => {
    const res = m.quiz.map((q,i) => answers[i] === q.correct);
    setResults(res);
    if (res.every(Boolean)) { const c = [...completed]; c[mod] = true; setCompleted(c); }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => setPage('cursos')} className="text-gray-400 hover:text-white mb-6 text-sm">← Voltar aos Cursos</button>
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{course.img}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              <p className="text-gray-400 text-sm">{course.desc}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[course.cat, course.level, `${course.hours}h`, `${course.modules.length} módulos`].map((t,i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded-full text-xs">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{studyHrs}h</div>
            <div className="text-xs text-gray-400 mb-2">Estudo</div>
            <button onClick={() => setTimerOn(!timerOn)} className={`px-3 py-1 rounded-lg text-xs font-medium ${timerOn ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{timerOn ? '⏸' : '▶️'} Timer</button>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{completedCount}/{course.modules.length}</div>
            <div className="text-xs text-gray-400">Módulos</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{progress}%</div>
            <div className="text-xs text-gray-400">Progresso</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{CERT_HOURS}h</div>
            <div className="text-xs text-gray-400">p/ Certificado</div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2"><span>Progresso</span><span>{progress}%</span></div>
          <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width:`${progress}%` }} /></div>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sticky top-24">
              <h3 className="text-white font-semibold mb-3">📚 Módulos</h3>
              <div className="space-y-1">
                {course.modules.map((ml,i) => (
                  <button key={i} onClick={() => { setMod(i); setAnswers([]); setResults([]); }} className={`w-full flex items-center gap-2 p-2 rounded-xl text-left text-sm transition-all ${mod===i ? 'bg-indigo-500/20 text-indigo-400' : completed[i] ? 'bg-green-500/10 text-green-400' : 'text-gray-400 hover:bg-white/5'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${completed[i] ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-300'}`}>{completed[i] ? '✓' : i+1}</span>
                    <span className="line-clamp-2 text-xs">{ml.title}</span>
                  </button>
                ))}
              </div>
              {completedCount === course.modules.length && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  {canCert ? (
                    <button onClick={() => setShowCert(true)} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-sm">🏆 Certificado</button>
                  ) : (
                    <div className="text-center">
                      <p className="text-yellow-400 text-xs font-medium">{studyHrs}h / {CERT_HOURS}h</p>
                      <p className="text-gray-500 text-[10px] mt-1">Continue estudando!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-sm">{mod+1}</div>
                <h2 className="text-xl font-bold text-white flex-1">{m.title}</h2>
                {completed[mod] && <span className="text-green-400 text-sm">✅ Concluído</span>}
              </div>
              <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{m.content}</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">🧠 Quiz</h3>
              <div className="space-y-5">
                {m.quiz.map((q,qi) => (
                  <div key={qi} className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-white font-medium mb-3 text-sm">{qi+1}. {q.q}</p>
                    <div className="space-y-2">
                      {q.opts.map((opt,oi) => {
                        const isSel = answers[qi] === oi;
                        const isRight = results[qi] !== null && oi === q.correct;
                        const isWrong = results[qi] !== null && isSel && oi !== q.correct;
                        return (
                          <button key={oi} onClick={() => { if (results[qi] === null) { const a = [...answers]; a[qi] = oi; setAnswers(a); } }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all ${isRight ? 'bg-green-500/30 text-green-400 border border-green-500' : isWrong ? 'bg-red-500/30 text-red-400 border border-red-500' : isSel ? 'bg-indigo-500/30 text-indigo-400 border border-indigo-500' : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-700'}`}>
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-600 text-white shrink-0">{String.fromCharCode(65+oi)}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {results[qi] !== null && <p className={`mt-2 text-xs font-medium ${results[qi] ? 'text-green-400' : 'text-red-400'}`}>{results[qi] ? '✅ Correcto!' : `❌ Resposta correcta: ${String.fromCharCode(65+q.correct)}`}</p>}
                  </div>
                ))}
              </div>
              {results.every(r => r === null) ? (
                <button onClick={submit} disabled={answers.some(a => a === null)} className={`mt-4 px-6 py-3 rounded-xl font-medium transition-all ${answers.every(a => a !== null) ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-700 text-gray-500 cursor-not-allowed'}`}>Verificar Respostas</button>
              ) : (
                <div className={`mt-4 p-4 rounded-xl ${results.every(Boolean) ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className={`font-semibold ${results.every(Boolean) ? 'text-green-400' : 'text-red-400'}`}>{results.every(Boolean) ? '🎉 Módulo concluído!' : '❌ Algumas respostas incorrectas. Reveja e tente de novo.'}</p>
                  {!results.every(Boolean) && <button onClick={() => setResults(new Array(m.quiz.length).fill(null))} className="mt-2 px-4 py-1 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">Tentar de novo</button>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => { setMod(mod-1); setAnswers([]); setResults([]); }} disabled={mod===0} className={`px-6 py-3 rounded-xl font-medium transition-all ${mod>0 ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800/50 text-gray-600 cursor-not-allowed'}`}>← Anterior</button>
              <span className="text-gray-500 text-sm">{mod+1}/{course.modules.length}</span>
              <button onClick={() => { setMod(mod+1); setAnswers([]); setResults([]); }} disabled={mod===course.modules.length-1} className={`px-6 py-3 rounded-xl font-medium transition-all ${mod<course.modules.length-1 ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600' : 'bg-slate-800/50 text-gray-600 cursor-not-allowed'}`}>Próximo →</button>
            </div>
          </div>
        </div>
        {showCert && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCert(false)}>
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-8 max-w-lg w-full text-center" onClick={e => e.stopPropagation()}>
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">CERTIFICADO DE CONCLUSÃO</h3>
              <p className="text-gray-400 mb-1">{course.title}</p>
              <p className="text-green-400 text-sm mb-5">⏱ {studyHrs}h | ✅ {completedCount}/{course.modules.length} módulos</p>
              <div className="bg-slate-800/50 rounded-xl p-5 mb-5">
                <p className="text-gray-400 text-sm mb-2">Certificamos que</p>
                <input type="text" value={studName} onChange={e => setStudName(e.target.value)} placeholder="Escreva o seu nome completo..." className="w-full text-center text-xl font-bold text-white bg-transparent border-b-2 border-yellow-500/50 focus:border-yellow-500 focus:outline-none py-2 mb-3" />
                <p className="text-gray-400 text-sm">concluiu com sucesso</p>
                <p className="text-white font-bold text-lg">{course.title}</p>
                <p className="text-gray-500 text-xs mt-1">Netek Services Academy · {new Date().toLocaleDateString('pt-MZ')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCert(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">Fechar</button>
                <a href={wa(`🎓 Concluí o curso "${course.title}" na Netek Academy!\nNome: ${studName}\nHoras: ${studyHrs}h\nMódulos: ${completedCount}/${course.modules.length}\nQuero receber o certificado!`)} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-center hover:from-green-600 hover:to-green-700">
                  📱 Receber
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// TRABALHADORES
// ═══════════════════════════════════════════════════════════
function TrabalhadoresPage({ setPage }: { setPage?: (p: Page) => void } = {}) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">👷 DIRECTÓRIO</span>
          <h2 className="text-4xl font-bold text-white mb-4">Profissionais Verificados</h2>
          <p className="text-gray-400">Directório completo de profissionais em Moçambique.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {talentsData.map(t => (
            <div key={t.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-green-500/50 hover:-translate-y-1 transition-all">
              <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-5 text-center">
                <div className="text-5xl mb-2">{t.img}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${t.v ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-gray-400'}`}>{t.v ? '✅ Verificado' : 'Não verificado'}</span>
              </div>
              <div className="p-4">
                <h4 className="text-white font-semibold">{t.n}</h4>
                <p className="text-cyan-400 text-sm">{t.p}</p>
                <p className="text-gray-500 text-xs">📍 {t.loc}</p>
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <span className="text-yellow-400 text-sm">★ {t.r}</span>
                  <span className="text-gray-500 text-xs">({t.rv})</span>
                </div>
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{t.d}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setPage?.('kayamoz'); window.scrollTo(0,0); }} className="flex-1 py-2 bg-purple-500 text-white rounded-xl text-xs font-medium text-center hover:bg-purple-600 transition-all">💬 Chat</button>
                  <a href={wa(`Olá! Preciso de um ${t.p}. Contacto: ${t.n}.`)} target="_blank" rel="noreferrer" className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all">📱</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// BLOG
// ═══════════════════════════════════════════════════════════
function BlogPage() {
  const [cat, setCat] = useState('Todos');
  const cats = ['Todos',...new Set(blogPostsData.map(p => p.cat))];
  const filtered = cat === 'Todos' ? blogPostsData : blogPostsData.filter(p => p.cat === cat);
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-sm font-medium mb-4">📰 BLOG</span>
          <h2 className="text-4xl font-bold text-white mb-4">Dicas de IA & Tutoriais</h2>
          <p className="text-gray-400">Conteúdo prático para evoluir com tecnologia em Moçambique.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cat===c ? 'bg-orange-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}`}>{c}</button>)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <article key={p.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="h-36 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">{p.img}</div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">{p.cat}</span>
                  <span className="text-gray-500 text-xs">⏱ {p.time}</span>
                </div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-orange-400 transition-colors text-sm">{p.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{p.excerpt}</p>
                <a href={wa(`Olá! Quero saber mais sobre: ${p.title}`)} target="_blank" rel="noreferrer" className="mt-3 block w-full py-2 bg-orange-500/20 text-orange-400 rounded-xl text-xs font-medium text-center hover:bg-orange-500/30 transition-all">Pedir Tutorial</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// IA TOOLS
// ═══════════════════════════════════════════════════════════
function IAPage() {
  const tools = [
    { n:'ChatGPT', d:'Assistente de texto, análise e código.', u:'https://chat.openai.com', i:'🤖', tag:'Popular', free:true },
    { n:'Claude AI', d:'Textos longos e análise de documentos.', u:'https://claude.ai', i:'🧠', tag:'Recomendado', free:true },
    { n:'Google Gemini', d:'Integrado com Google Drive e Gmail.', u:'https://gemini.google.com', i:'💎', tag:'Google', free:true },
    { n:'Canva AI', d:'Imagens, designs e apresentações com IA.', u:'https://canva.com', i:'🎨', tag:'Design', free:true },
    { n:'Microsoft Copilot', d:'IA integrada no Word, Excel e PowerPoint.', u:'https://copilot.microsoft.com', i:'🪟', tag:'Office', free:true },
    { n:'DALL-E (via ChatGPT)', d:'Geração de imagens com texto.', u:'https://chat.openai.com', i:'🖼️', tag:'Imagens', free:false },
    { n:'ElevenLabs', d:'Texto para voz profissional em várias línguas.', u:'https://elevenlabs.io', i:'🎙️', tag:'Áudio', free:true },
    { n:'Perplexity AI', d:'Motor de pesquisa inteligente com fontes.', u:'https://perplexity.ai', i:'🔍', tag:'Pesquisa', free:true },
    { n:'Remove.bg', d:'Remover fundo de imagens automaticamente.', u:'https://remove.bg', i:'✂️', tag:'Imagem', free:true },
    { n:'DeepL', d:'Tradutor com IA muito superior ao Google.', u:'https://deepl.com', i:'🌐', tag:'Tradução', free:true },
    { n:'Notion AI', d:'Notas inteligentes e organização com IA.', u:'https://notion.so', i:'📝', tag:'Produtividade', free:false },
    { n:'GitHub Copilot', d:'Assistente de programação por IA.', u:'https://github.com/features/copilot', i:'💻', tag:'Código', free:false },
  ];
  const prompts = [
    { t:'Email profissional', p:'Escreve um email profissional em português para [pessoa] sobre [assunto]. Tom formal, máximo 150 palavras.' },
    { t:'Plano de negócio', p:'Cria um plano de negócio resumido para [ideia] no mercado moçambicano. Inclui: proposta de valor, público-alvo, canais e receita.' },
    { t:'Post para Instagram', p:'Cria 3 legendas para Instagram sobre [produto/serviço]. Tom informal, com emojis e hashtags moçambicanas.' },
    { t:'Resumo de documento', p:'Resume este texto em 5 pontos principais em português: [coloca o texto aqui]' },
    { t:'Currículo', p:'Com estes dados, cria um currículo profissional formatado: Nome: [nome], Função: [função], Experiência: [experiência], Formação: [formação]' },
    { t:'Resposta a cliente', p:'Escreve uma resposta profissional e simpática para este cliente insatisfeito: [descreve a situação]' },
  ];
  const [copied, setCopied] = useState<number|null>(null);
  const copy = (text: string, i: number) => { navigator.clipboard?.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 2000); };
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4">🤖 FERRAMENTAS DE IA</span>
          <h2 className="text-4xl font-bold text-white mb-4">IA Gratuita para Usar Agora</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">As melhores ferramentas de IA disponíveis em Moçambique. Todas funcionam com boa internet.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
          {tools.map((t,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-violet-500/50 hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl group-hover:scale-110 transition-transform">{t.i}</span>
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] rounded-full">{t.tag}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${t.free ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.free ? 'Grátis' : 'Pago'}</span>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">{t.n}</h3>
              <p className="text-gray-400 text-xs mb-4">{t.d}</p>
              <a href={t.u} target="_blank" rel="noreferrer" className="block w-full py-2 bg-violet-500/20 text-violet-400 rounded-xl text-xs font-medium text-center hover:bg-violet-500/30 transition-all">Abrir Ferramenta →</a>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">📋 Prompts Prontos para Copiar</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((p,i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-violet-500/50 transition-all">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><span className="w-6 h-6 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400 text-xs">{i+1}</span>{p.t}</h4>
                <p className="text-gray-400 text-xs mb-4 font-mono bg-slate-900/50 p-3 rounded-xl leading-relaxed">{p.p}</p>
                <button onClick={() => copy(p.p, i)} className={`w-full py-2 rounded-xl text-xs font-medium transition-all ${copied===i ? 'bg-green-500/20 text-green-400' : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'}`}>
                  {copied===i ? '✅ Copiado!' : '📋 Copiar Prompt'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SOBRE
// ═══════════════════════════════════════════════════════════
function SobrePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-4xl font-bold">N</div>
          <h1 className="text-4xl font-bold text-white mb-4">Sobre a Netek Services</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">A plataforma digital que conecta Moçambique ao futuro tecnológico.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-bold text-xl mb-4">🎯 Missão</h3>
            <p className="text-gray-400 leading-relaxed">Democratizar o acesso à tecnologia e educação digital em Moçambique, oferecendo serviços de qualidade a preços acessíveis e conteúdo educativo gratuito para todos os moçambicanos.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-bold text-xl mb-4">🌟 Visão</h3>
            <p className="text-gray-400 leading-relaxed">Ser a referência em soluções digitais em Moçambique, formando profissionais qualificados, conectando talentos e ajudando negócios a crescer no mundo digital.</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
          <h3 className="text-white font-bold text-xl mb-4">🚀 O que fazemos</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { i:'🌐', t:'Serviços de Internet', d:'Fibra óptica, rádio, hospedagem e soluções digitais completas.' },
              { i:'🎓', t:'Educação Digital', d:'12 cursos gratuitos com certificado de 265 horas.' },
              { i:'👷', t:'Mercado de Talentos', d:'Integração com o KayaMoz para conectar profissionais e clientes.' },
              { i:'📄', t:'Criação de Documentos', d:'CV, cartas e contratos profissionais via WhatsApp.' },
              { i:'📅', t:'Pré-Agendamento', d:'Apoio em serviços públicos digitais difíceis de navegar.' },
              { i:'🤖', t:'Ferramentas de IA', d:'Guia das melhores ferramentas de IA gratuitas.' },
            ].map((s,i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                <span className="text-3xl mb-2 block">{s.i}</span>
                <h4 className="text-white font-semibold text-sm mb-1">{s.t}</h4>
                <p className="text-gray-400 text-xs">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <button onClick={() => setPage('contato')} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">📬 Contactar a Netek</button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTACTO
// ═══════════════════════════════════════════════════════════
function ContatoPage() {
  const [form, setForm] = useState({ nome:'', email:'', assunto:'', msg:'' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const send = () => {
    const msg = `📬 CONTACTO NETEK SERVICES\n\n👤 Nome: ${form.nome}\n📧 Email: ${form.email}\n📋 Assunto: ${form.assunto}\n💬 Mensagem: ${form.msg}`;
    window.open(wa(msg), '_blank');
  };
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium mb-4">📬 CONTACTO</span>
          <h2 className="text-4xl font-bold text-white mb-4">Fale Connosco</h2>
          <p className="text-gray-400">Estamos aqui para ajudar. WhatsApp é o canal mais rápido!</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { i:'📱', t:'WhatsApp', v:'+258 83 510 9190', href:wa('Olá Netek!'), color:'green' },
            { i:'💬', t:'KayaMoz Chat', v:'Chat & Talentos', href:'#kayamoz', color:'purple' },
            { i:'🇲🇿', t:'Localização', v:'Maputo, Moçambique', href:'#', color:'blue' },
          ].map((c,i) => (
            <a key={i} href={c.href} target="_blank" rel="noreferrer" className={`bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center hover:border-${c.color}-500/50 transition-all`}>
              <div className="text-4xl mb-3">{c.i}</div>
              <h4 className="text-white font-semibold mb-1">{c.t}</h4>
              <p className="text-gray-400 text-sm">{c.v}</p>
            </a>
          ))}
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Enviar Mensagem</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input value={form.nome} onChange={e => set('nome',e.target.value)} placeholder="Seu nome" className="px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
            <input value={form.email} onChange={e => set('email',e.target.value)} placeholder="Seu email" className="px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
          </div>
          <input value={form.assunto} onChange={e => set('assunto',e.target.value)} placeholder="Assunto" className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm mb-4" />
          <textarea value={form.msg} onChange={e => set('msg',e.target.value)} placeholder="A sua mensagem..." rows={4} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm resize-none mb-4" />
          <button onClick={send} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2">
            <WA_SVG /> Enviar via WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// NOVIDADES
// ═══════════════════════════════════════════════════════════
function NoticiasPage() {
  const news = [
    { t:'Netek lança 12 cursos gratuitos com certificado', d:'A Netek Academy lança 12 cursos sobre IA, Python, Marketing e mais, com sistema de 265 horas para certificação.', date:'Jan 2025', cat:'Cursos', i:'📚' },
    { t:'Integração com KayaMoz para talentos locais', d:'Parceria com KayaMoz para conectar profissionais de Moçambique com clientes na sua zona.', date:'Jan 2025', cat:'Parceria', i:'🤝' },
    { t:'Novo painel de admin com estatísticas', d:'Administradores agora têm acesso a dashboard completo com métricas de utilizadores, cursos e serviços.', date:'Dez 2024', cat:'Plataforma', i:'📊' },
    { t:'Documentos profissionais por WhatsApp', d:'CV, cartas e contratos criados pela Netek em 24 horas após o formulário preenchido no site.', date:'Dez 2024', cat:'Serviços', i:'📄' },
    { t:'Ferramentas de IA gratuitas mapeadas', d:'Directório das melhores ferramentas de IA disponíveis em Moçambique com guias de uso.', date:'Nov 2024', cat:'IA', i:'🤖' },
    { t:'Simuladores de computador e telemóvel', d:'Mini curso interactivo com simuladores de Windows e Android para aprender informática do zero.', date:'Nov 2024', cat:'Educação', i:'🖥️' },
  ];
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-4">📡 NOVIDADES</span>
          <h2 className="text-4xl font-bold text-white mb-4">Últimas Novidades</h2>
        </div>
        <div className="space-y-4">
          {news.map((n,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-red-500/50 transition-all flex items-start gap-4">
              <div className="text-4xl shrink-0">{n.i}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">{n.cat}</span>
                  <span className="text-gray-500 text-xs">{n.date}</span>
                </div>
                <h3 className="text-white font-semibold mb-1">{n.t}</h3>
                <p className="text-gray-400 text-sm">{n.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════════════════════════
function PerfilPage({ user, setPage, setSelectedCourse, onLogout }:
  { user: User; setPage: (p: Page) => void; setSelectedCourse: (id: number) => void; onLogout: () => void }) {
  const [tab, setTab] = useState<'cursos'|'historico'|'servicos'|'avaliacoes'>('cursos');
  const myCourses = [
    { id:1, title:'Inteligência Artificial', progress:75, hours:22.5, totalHours:30, modules:3, totalModules:4, status:'em_progresso', img:'🤖' },
    { id:3, title:'Programação Python', progress:40, hours:16, totalHours:40, modules:2, totalModules:5, status:'em_progresso', img:'🐍' },
    { id:2, title:'Marketing Digital', progress:100, hours:25, totalHours:25, modules:4, totalModules:4, status:'concluido', img:'📱' },
    { id:4, title:'Excel Profissional', progress:15, hours:5.25, totalHours:35, modules:0, totalModules:3, status:'em_progresso', img:'📊' },
  ];
  const history = [
    { date:'Hoje', action:'Acedeu à plataforma', icon:'🟢', type:'sistema' },
    { date:'20 Jan', action:'Completou módulo 3 de IA', icon:'✅', type:'curso' },
    { date:'19 Jan', action:'Solicitou criação de CV', icon:'📄', type:'documento' },
    { date:'18 Jan', action:'Estudou Python por 2h', icon:'🐍', type:'curso' },
    { date:'17 Jan', action:'Agendou renovação de BI', icon:'📅', type:'agendamento' },
    { date:'16 Jan', action:'Completou Marketing Digital', icon:'🏆', type:'certificado' },
    { date:'15 Jan', action:'Criou conta na Netek', icon:'🎉', type:'conta' },
  ];
  const myServices = [
    { name:'Internet Fibra Pro', status:'Activo', date:'01 Jan 2025', price:'3.500 MT/mês', icon:'🌐' },
    { name:'CV Profissional', status:'Concluído', date:'19 Jan 2025', price:'500 MT', icon:'📄' },
    { name:'Agendamento BI', status:'Pendente', date:'17 Jan 2025', price:'500 MT', icon:'📅' },
  ];
  const reviews = [
    { target:'Carlos Machava - Electricista', r:5, comment:'Excelente profissional! Trabalho impecável.', date:'18 Jan 2025', icon:'⚡' },
    { target:'Curso Marketing Digital', r:4, comment:'Muito bom conteúdo, aprendi bastante!', date:'16 Jan 2025', icon:'📱' },
    { target:'Netek Services - Internet', r:5, comment:'Internet rápida e suporte excelente!', date:'10 Jan 2025', icon:'🌐' },
  ];
  const totalHours = myCourses.reduce((s,c) => s+c.hours, 0);
  const completed = myCourses.filter(c => c.status === 'concluido').length;
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-5xl">{user.avatar}</div>
              {user.isAdmin && <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm border-4 border-slate-900">👑</div>}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-cyan-400 text-sm">{user.isAdmin ? 'Administrador' : 'Estudante Avançado'}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center md:justify-start text-gray-400 text-xs">
                <span>📧 {user.email}</span>
                <span>📞 {user.phone}</span>
                <span>📍 {user.location}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-4 py-2 bg-yellow-500/20 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-400">1250</div>
                <div className="text-xs text-gray-400">Pontos</div>
              </div>
              <button onClick={onLogout} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30">🚪 Sair</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{v:myCourses.length,l:'Cursos',c:'cyan'},{v:completed,l:'Concluídos',c:'green'},{v:`${totalHours.toFixed(1)}h`,l:'Horas',c:'purple'},{v:reviews.length,l:'Avaliações',c:'yellow'}].map((s,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold text-${s.c}-400`}>{s.v}</div>
              <div className="text-xs text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl overflow-x-auto">
          {[{id:'cursos' as const,i:'📚',l:'Cursos'},{id:'historico' as const,i:'📜',l:'Histórico'},{id:'servicos' as const,i:'🌐',l:'Serviços'},{id:'avaliacoes' as const,i:'⭐',l:'Avaliações'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap px-4 ${tab===t.id ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-slate-700'}`}>{t.i} {t.l}</button>
          ))}
        </div>
        {tab === 'cursos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">📚 Meus Cursos</h3>
              <button onClick={() => setPage('cursos')} className="text-cyan-400 text-sm hover:text-cyan-300">Ver todos →</button>
            </div>
            {myCourses.map(c => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{c.img}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-white font-semibold">{c.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${c.status==='concluido' ? 'bg-green-500/20 text-green-400' : c.status==='em_progresso' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {c.status==='concluido' ? '✅ Concluído' : c.status==='em_progresso' ? '📖 Em progresso' : '⏸ Não iniciado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>⏱ {c.hours}h / {c.totalHours}h</span>
                      <span>📚 {c.modules}/{c.totalModules} módulos</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full ${c.progress===100 ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`} style={{ width:`${c.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{c.progress}%</span>
                      <button onClick={() => { setSelectedCourse(c.id); setPage('vercurso'); window.scrollTo(0,0); }} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${c.status==='concluido' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'}`}>
                        {c.status==='concluido' ? '🏆 Ver Certificado' : '📖 Continuar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'historico' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">📜 Histórico de Atividades</h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
              {history.map((item,i) => (
                <div key={i} className="relative flex items-start gap-4 mb-5 pl-14">
                  <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-xs z-10 ${item.type==='certificado' ? 'bg-yellow-500' : item.type==='curso' ? 'bg-cyan-500' : item.type==='documento' ? 'bg-blue-500' : item.type==='agendamento' ? 'bg-purple-500' : 'bg-gray-500'}`}>{i===0 && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}</div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex-1 hover:border-slate-600 transition-all flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{item.action}</p>
                      <p className="text-gray-500 text-xs">{item.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${item.type==='certificado' ? 'bg-yellow-500/20 text-yellow-400' : item.type==='curso' ? 'bg-cyan-500/20 text-cyan-400' : item.type==='documento' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'servicos' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">🌐 Meus Serviços</h3>
            {myServices.map((s,i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{s.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">{s.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${s.status==='Activo' ? 'bg-green-500/20 text-green-400' : s.status==='Concluído' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{s.status==='Activo' ? '🟢' : s.status==='Concluído' ? '✅' : '⏳'} {s.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400"><span>📅 {s.date}</span><span>💰 {s.price}</span></div>
                  </div>
                  <a href={wa(`Olá! Suporte para: ${s.name}`)} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all">📱</a>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'avaliacoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">⭐ Avaliações</h3>
              <span className="text-gray-400 text-sm">{reviews.length} avaliações</span>
            </div>
            {reviews.map((r,i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-yellow-500/50 transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{r.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold text-sm">{r.target}</h4>
                      <span className="text-gray-500 text-xs">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => <span key={s} className={s<=r.r ? 'text-yellow-400' : 'text-gray-600'}>★</span>)}
                      <span className="text-gray-400 text-sm ml-1">{r.r}/5</span>
                    </div>
                    <p className="text-gray-300 text-sm">{r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════
function AdminPage({ user, setPage }: { user: User; setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<'dash'|'users'|'courses'|'services'|'settings'>('dash');
  const stats = { users:1247, courses:12, services:89, revenue:450000, newToday:23, certs:456 };
  const recentUsers = [
    { name:'Maria Santos', email:'maria@email.com', date:'20 Jan', status:'Activo' },
    { name:'Pedro Nhaca', email:'pedro@email.com', date:'19 Jan', status:'Activo' },
    { name:'Ana Tembe', email:'ana@email.com', date:'18 Jan', status:'Pendente' },
    { name:'Carlos Machava', email:'carlos@email.com', date:'17 Jan', status:'Activo' },
    { name:'Rosa Cossa', email:'rosa@email.com', date:'16 Jan', status:'Bloqueado' },
  ];
  const allServices = [
    { client:'Maria Santos', service:'Criação de CV', status:'Concluído', date:'19 Jan', price:500 },
    { client:'Pedro Nhaca', service:'Internet Fibra Pro', status:'Activo', date:'18 Jan', price:3500 },
    { client:'Ana Tembe', service:'Agendamento BI', status:'Pendente', date:'17 Jan', price:500 },
    { client:'Carlos Machava', service:'Contrato', status:'Em análise', date:'16 Jan', price:1000 },
  ];
  const getUsers = () => {
    const us: (User & { password?: string })[] = JSON.parse(localStorage.getItem('netek_users') || '[]');
    return us;
  };
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-3xl">👑</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
                <p className="text-gray-400 text-sm">{user.name} · {user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setPage('kayamoz'); window.scrollTo(0,0); }} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm hover:bg-purple-500/30">🔍 KayaMoz</button>
              <button onClick={() => setPage('home')} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm hover:bg-slate-600">🏠 Ver Site</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[{i:'👥',l:'Utilizadores',v:stats.users.toLocaleString(),c:'cyan'},{i:'📚',l:'Cursos',v:stats.courses,c:'purple'},{i:'🌐',l:'Serviços',v:stats.services,c:'green'},{i:'💰',l:'Receita MT',v:stats.revenue.toLocaleString(),c:'yellow'},{i:'📈',l:'Hoje',v:stats.newToday,c:'blue'},{i:'🏆',l:'Certs',v:stats.certs,c:'orange'}].map((s,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{s.i}</div>
              <div className={`text-xl font-bold text-${s.c}-400`}>{s.v}</div>
              <div className="text-xs text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl overflow-x-auto">
          {[{id:'dash' as const,i:'📊',l:'Dashboard'},{id:'users' as const,i:'👥',l:'Utilizadores'},{id:'courses' as const,i:'📚',l:'Cursos'},{id:'services' as const,i:'🌐',l:'Serviços'},{id:'settings' as const,i:'⚙️',l:'Definições'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap px-4 ${tab===t.id ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>{t.i} {t.l}</button>
          ))}
        </div>
        {tab === 'dash' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">👥 Utilizadores Recentes</h3>
              <div className="space-y-3">
                {recentUsers.map((u,i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                    <div className="w-9 h-9 bg-cyan-500/20 rounded-full flex items-center justify-center text-sm">👤</div>
                    <div className="flex-1"><p className="text-white text-sm font-medium">{u.name}</p><p className="text-gray-500 text-xs">{u.email} · {u.date}</p></div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${u.status==='Activo' ? 'bg-green-500/20 text-green-400' : u.status==='Pendente' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">📋 Serviços Recentes</h3>
              <div className="space-y-3">
                {allServices.map((s,i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-full flex items-center justify-center text-sm">📋</div>
                    <div className="flex-1"><p className="text-white text-sm font-medium">{s.service}</p><p className="text-gray-500 text-xs">{s.client} · {s.date}</p></div>
                    <span className="text-cyan-400 text-sm font-semibold">{s.price}MT</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'users' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">👥 Utilizadores Registados</h3>
              <span className="text-gray-400 text-sm">{getUsers().length} contas criadas</span>
            </div>
            {getUsers().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-700">{['Nome','Email','Telefone','Local','Acções'].map(h => <th key={h} className="text-left p-4 text-gray-400 text-xs font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {getUsers().map((u,i) => (
                      <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="p-4 text-white text-sm">{u.name}</td>
                        <td className="p-4 text-gray-400 text-sm">{u.email}</td>
                        <td className="p-4 text-gray-400 text-sm">{u.phone}</td>
                        <td className="p-4 text-gray-500 text-sm">{u.location}</td>
                        <td className="p-4"><span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Activo</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="p-8 text-center text-gray-500">Nenhum utilizador registado ainda.</p>}
            <div className="p-4 border-t border-slate-700">
              <h4 className="text-white font-semibold mb-3">Utilizadores Simulados ({stats.users.toLocaleString()} total)</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-700">{['Nome','Email','Data','Status','Acções'].map(h => <th key={h} className="text-left p-4 text-gray-400 text-xs font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {recentUsers.map((u,i) => (
                      <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="p-4 text-white text-sm">{u.name}</td>
                        <td className="p-4 text-gray-400 text-sm">{u.email}</td>
                        <td className="p-4 text-gray-500 text-sm">{u.date}</td>
                        <td className="p-4"><span className={`px-2 py-0.5 text-xs rounded-full ${u.status==='Activo' ? 'bg-green-500/20 text-green-400' : u.status==='Pendente' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{u.status}</span></td>
                        <td className="p-4"><div className="flex gap-2"><button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30">✏️</button><button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">🗑️</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {tab === 'courses' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeCourses.map(c => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{c.img}</span>
                  <div className="flex-1"><h4 className="text-white font-semibold text-sm">{c.title}</h4><p className="text-gray-500 text-xs">{c.cat} · {c.hours}h · {c.modules.length} módulos</p></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span>👥 {Math.floor(Math.random()*200+50)} alunos</span>
                  <span>⭐ {(Math.random()*0.5+4.5).toFixed(1)}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30">✏️ Editar</button>
                  <button className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30">📊 Stats</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'services' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">🌐 Serviços</h3>
              <span className="text-gray-400 text-sm">{allServices.length} activos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-700">{['Cliente','Serviço','Data','Preço','Status'].map(h => <th key={h} className="text-left p-4 text-gray-400 text-xs font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {allServices.map((s,i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="p-4 text-white text-sm">{s.client}</td>
                      <td className="p-4 text-gray-300 text-sm">{s.service}</td>
                      <td className="p-4 text-gray-500 text-sm">{s.date}</td>
                      <td className="p-4 text-cyan-400 text-sm font-medium">{s.price} MT</td>
                      <td className="p-4"><span className={`px-2 py-0.5 text-xs rounded-full ${s.status==='Concluído' ? 'bg-green-500/20 text-green-400' : s.status==='Activo' ? 'bg-blue-500/20 text-blue-400' : s.status==='Pendente' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold">⚙️ Definições do Sistema</h3>
            {[['Nome do Site','Netek Services'],['WhatsApp','+258 83 510 9190'],['KayaMoz URL',KAYAMOZ],['Horas p/ Certificado','265'],['Versão','v4.0']].map(([l,v]) => (
              <div key={l}><label className="block text-sm text-gray-400 mb-1">{l}</label><input defaultValue={v} className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none" /></div>
            ))}
            <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700">💾 Guardar</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// MINI CURSO + SIMULADORES (placeholder acessível)
// ═══════════════════════════════════════════════════════════
function MarketplaceBanner({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-12 bg-gradient-to-r from-green-900/30 via-slate-900 to-green-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-green-500/10 to-green-700/10 border border-green-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl">🛍️</div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold mb-2">🔥 NOVO</div>
            <h2 className="text-2xl font-bold text-white">Netek Marketplace</h2>
            <p className="text-gray-400 text-sm mt-1">Compre e venda produtos reais. Pagamento por M-Pesa/e-Mola. Suporte pelo <strong className="text-green-400">WhatsApp Business +258 840 166 592</strong> e Grupo de Vendas.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { setPage('marketplace'); window.scrollTo(0,0); }} className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25">🛍️ Explorar Marketplace</button>
            <a href="https://chat.whatsapp.com/invite/netkservices-vendas" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-all text-center">👥 Entrar no Grupo</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniCursoPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <span className="inline-block px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4">🖥️ MINI CURSO</span>
        <h2 className="text-4xl font-bold text-white mb-4">Informática Básica + Simuladores</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Aprenda a usar computador e telemóvel do zero com simuladores interactivos!</p>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[{i:'🖥️',t:'Simulador Windows',d:'Computador completo com Chrome, Bloco de Notas, Calculadora, Paint e mais.'},{i:'📱',t:'Simulador Android',d:'Telemóvel com WhatsApp funcional, Calculadora, Notas e vários apps.'},{i:'📚',t:'8 Aulas Completas',d:'Do que é um computador até usar WhatsApp e criar email.'}].map((c,i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 transition-all">
              <div className="text-5xl mb-4">{c.i}</div>
              <h3 className="text-white font-semibold mb-2">{c.t}</h3>
              <p className="text-gray-400 text-sm">{c.d}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setPage('cursos')} className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all">
          🚀 Começar Agora nos Cursos
        </button>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════
function Footer({ setPage }: { setPage: (p: Page) => void }) {
  const nav = (p: Page) => { setPage(p); window.scrollTo(0,0); };
  return (
    <footer className="bg-[#050b14] border-t border-slate-800 px-6 py-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
            <p className="text-white font-bold">Netek Services</p>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">A plataforma digital de Moçambique. Internet, talentos, cursos e mais.</p>
        </div>
        <div>
          <p className="text-white font-semibold mb-3 text-sm">Serviços</p>
          <div className="space-y-2">{[['servicos','Internet'],['precos','Preços'],['documentos','Documentos'],['agendamento','Agendamento']].map(([p,l]) => <button key={p} onClick={() => nav(p as Page)} className="block text-gray-500 text-sm hover:text-white transition-colors">{l}</button>)}</div>
        </div>
        <div>
          <p className="text-white font-semibold mb-3 text-sm">Aprender</p>
          <div className="space-y-2">{[['cursos','Cursos Grátis'],['ia','Ferramentas IA'],['blog','Blog'],['minicurso','Mini Curso']].map(([p,l]) => <button key={p} onClick={() => nav(p as Page)} className="block text-gray-500 text-sm hover:text-white transition-colors">{l}</button>)}</div>
        </div>
        <div>
          <p className="text-white font-semibold mb-3 text-sm">Contacto</p>
          <div className="space-y-2">
            <a href={wa('Olá! Vim pelo site.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-green-400 text-sm hover:text-green-300"><WA_SVG />+258 83 510 9190</a>
            <button onClick={() => nav('kayamoz')} className="block text-purple-400 text-sm hover:text-purple-300">🔍 KayaMoz (integrado)</button>
            <div className="flex flex-wrap gap-2 mt-2">
              {['💚 M-Pesa','🔵 e-Mola','🏦 Banco'].map(m => <span key={m} className="px-2 py-1 bg-slate-800 text-gray-400 rounded-lg text-xs">{m}</span>)}
            </div>
          </div>
        </div>
      </div>
      {/* Partilhar */}
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-800">
        <p className="text-gray-500 text-xs mb-3 text-center">📤 Partilhar este site</p>
        <div className="flex justify-center"><ShareButtons /></div>
      </div>
      <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-600 text-xs">© 2025 Netek Services · Moçambique · Desenvolvido por <button onClick={() => nav('desenvolvedor')} className="text-cyan-400 hover:text-cyan-300">@jonsonjb7</button></p>
        <div className="flex gap-4">
          {[['termos','Termos'],['privacidade','Privacidade'],['desenvolvedor','Desenvolvedor'],['sobre','Sobre'],['contato','Contacto']].map(([p,l]) => <button key={p} onClick={() => nav(p as Page)} className="text-gray-600 text-xs hover:text-white">{l}</button>)}
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [sideOpen, setSideOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login'|'register'>('login');

  // Firebase Auth unificado (Netek + KayaMoz)
  const { fbUser, profile: unifiedProfile, loading: fbLoading, logout: fbLogout } = useUnifiedAuth();
  const { fbUser: _fbUser2, loading: _l2 } = useFirebaseAuth(); // mantém FirebaseFeatures a funcionar

  useEffect(() => {
    const saved = localStorage.getItem('netek_current_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Sync Firebase user → local user state
  useEffect(() => {
    if (fbUser && !fbLoading) {
      const fbAsUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilizador',
        email: fbUser.email || '',
        phone: '',
        location: 'Moçambique',
        avatar: '🔥',
        isAdmin: fbUser.email === ADMIN_EMAIL,
      };
      setUser(fbAsUser);
      localStorage.setItem('netek_current_user', JSON.stringify(fbAsUser));
    }
  }, [fbUser, fbLoading]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('netek_current_user', JSON.stringify(u));
  };

  const handleLogout = async () => {
    if (fbUser) await fbLogout();
    setUser(null);
    localStorage.removeItem('netek_current_user');
    setPage('home');
  };

  const render = () => {
    switch (page) {
      case 'home': return <><Hero setPage={setPage} /><MarketplaceBanner setPage={setPage} /><ServicesPage /><TalentosPage setPage={setPage} /><CursosPage setPage={setPage} setSelectedCourse={setSelectedCourse} /><BlogPage /><DonationBanner setPage={(p) => setPage(p as Page)} /><Footer setPage={setPage} /></>;
      case 'servicos': return <><ServicesPage /><Footer setPage={setPage} /></>;
      case 'precos': return <><PrecosPage /><Footer setPage={setPage} /></>;
      case 'talentos': return <><TalentosPage setPage={setPage} /><Footer setPage={setPage} /></>;
      case 'publicar': return <><PublicarPage setPage={setPage} /><Footer setPage={setPage} /></>;
      case 'trabalhadores': return <><TrabalhadoresPage setPage={setPage} /><Footer setPage={setPage} /></>;
      case 'documentos': return <><DocumentosPage /><Footer setPage={setPage} /></>;
      case 'agendamento': return <><AgendamentoPage /><Footer setPage={setPage} /></>;
      case 'directorio': return <><DirectorioPage /><Footer setPage={setPage} /></>;
      case 'cursos': return <><CursosPage setPage={setPage} setSelectedCourse={setSelectedCourse} /><Footer setPage={setPage} /></>;
      case 'vercurso': return selectedCourse ? <CourseViewer courseId={selectedCourse} setPage={setPage} /> : <><CursosPage setPage={setPage} setSelectedCourse={setSelectedCourse} /><Footer setPage={setPage} /></>;
      case 'blog': return <><BlogPage /><Footer setPage={setPage} /></>;
      case 'ia': return <><IAPage /><Footer setPage={setPage} /></>;
      case 'minicurso': return <><MiniCursoPage setPage={setPage} /><Footer setPage={setPage} /></>;
      case 'noticias': return <><NoticiasPage /><Footer setPage={setPage} /></>;
      case 'sobre': return <><SobrePage setPage={setPage} /><Footer setPage={setPage} /></>;
      case 'contato': return <><ContatoPage /><Footer setPage={setPage} /></>;
      case 'login': return <><UnifiedAuthModal onClose={() => setPage('home')} /><Footer setPage={setPage} /></>;
      case 'perfil': return user ? <PerfilPage user={user} setPage={setPage} setSelectedCourse={setSelectedCourse} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'admin': return user?.isAdmin ? <><AdminPage user={user} setPage={setPage} />{user.email === ADMIN_EMAIL && <div className="lg:ml-72"><FirebaseAdminPanel adminEmail={user.email} /></div>}</> : <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'orcamento': return <><OrcamentoPage /><Footer setPage={setPage} /></>;
      case 'conversores': return <><ConversoresPage /><Footer setPage={setPage} /></>;
      case 'chatia': return <><ChatIAPage /><Footer setPage={setPage} /></>;
      case 'pomodoro': return <><PomodoroPage /><Footer setPage={setPage} /></>;
      case 'qrcode': return <><QRCodePage /><Footer setPage={setPage} /></>;
      case 'glossario': return <><GlossarioPage /><Footer setPage={setPage} /></>;
      case 'senhas': return <><SenhasPage /><Footer setPage={setPage} /></>;
      case 'showcase': return <><ShowcasePage setPage={(p: string) => setPage(p as Page)} /><Footer setPage={setPage} /></>;
      case 'emprego': return <><EmpregoPage /><Footer setPage={setPage} /></>;
      case 'simuladores': return <><SimuladoresPage /><Footer setPage={setPage} /></>;
      case 'marketplace': return <><MarketplacePage fbUser={fbUser || null} /><Footer setPage={setPage} /></>;
      case 'backoffice': return <BackofficeApp />;
      case 'authsystem': return <AuthSystemApp />;
      case 'biblioteca': return <><LibraryPage /><DonationBanner setPage={(p) => setPage(p as Page)} /><Footer setPage={setPage} /></>;
      case 'donativos': return <><DonationsPage /><Footer setPage={setPage} /></>;
      case 'plantas': return <><FloorPlanPage /><DonationBanner setPage={(p) => setPage(p as Page)} /><Footer setPage={setPage} /></>;
      case 'quizzes': return <><QuizOSINTPage fbUser={fbUser || null} /><DonationBanner setPage={(p) => setPage(p as Page)} /><Footer setPage={setPage} /></>;
      case 'termos': return <><TermosPage /><Footer setPage={setPage} /></>;
      case 'privacidade': return <><PrivacidadePage /><Footer setPage={setPage} /></>;
      case 'desenvolvedor': return <><DevBioPage /><Footer setPage={setPage} /></>;
      case 'kayamoz': return <KayaMozApp fbUser={fbUser || null} profile={unifiedProfile} onLogout={handleLogout} />;
      case 'chat': return <><RealTimeChatPage fbUser={fbUser || null} /><Footer setPage={setPage} /></>;
      case 'forum': return <><ForumPage fbUser={fbUser || null} /><Footer setPage={setPage} /></>;
      case 'fbperfil': return fbUser ? <><FirebaseProfilePage fbUser={fbUser} onLogout={handleLogout} /><Footer setPage={setPage} /></> : <><LoginPage onLogin={handleLogin} setPage={setPage} /></>;
      default: return <><Hero setPage={setPage} /><Footer setPage={setPage} /></>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header page={page} setPage={setPage} sideOpen={sideOpen} setSideOpen={setSideOpen} user={user} onLogout={handleLogout} onOpenAuth={(tab) => { setAuthTab(tab); setShowAuthModal(true); }} fbUser={fbUser || null} unifiedProfile={unifiedProfile} />
      <Sidebar open={sideOpen} page={page} setPage={setPage} setOpen={setSideOpen} user={user} onLogout={handleLogout} />
      <main className="lg:ml-72 transition-all">{render()}</main>
      <WAFloat />
      <CookieBanner />
      {/* Auth Modal unificado Netek + KayaMoz */}
      {showAuthModal && <UnifiedAuthModal onClose={() => setShowAuthModal(false)} initialTab={authTab} />}
    </div>
  );
}
