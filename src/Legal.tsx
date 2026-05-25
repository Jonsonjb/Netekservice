/**
 * NETEK SERVICES — MÓDULO LEGAL, COOKIES, PARTILHA & BIOGRAFIA DEV
 * ─────────────────────────────────────────────────────────────────
 * • Banner de Cookies RGPD-compliant
 * • Termos de Uso completos
 * • Política de Privacidade completa
 * • Sistema de partilha por redes sociais
 * • Biografia do desenvolvedor @jonsonjb7
 */

import { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   1. BANNER DE COOKIES
═══════════════════════════════════════════════════════════ */

const COOKIE_KEY = 'netek_cookie_consent';
type CookieChoice = 'accepted' | 'rejected' | 'custom' | null;

interface CookiePrefs {
  essential: boolean;    // sempre true
  analytics: boolean;
  advertising: boolean;  // PayPal ads
  social: boolean;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ essential: true, analytics: true, advertising: true, social: true });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) { setTimeout(() => setVisible(true), 1500); }
  }, []);

  const accept = (choice: CookieChoice, customPrefs?: CookiePrefs) => {
    const finalPrefs = customPrefs || (choice === 'accepted' ? { essential:true, analytics:true, advertising:true, social:true } : { essential:true, analytics:false, advertising:false, social:false });
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ choice, prefs: finalPrefs, date: new Date().toISOString() }));
    setVisible(false);
    // Em produção: activar/desactivar scripts de tracking aqui
    if (finalPrefs.advertising) {
      console.log('[Netek] Cookies de publicidade aceites — PayPal Ads pixel activado');
    }
    if (finalPrefs.analytics) {
      console.log('[Netek] Cookies de analytics aceites');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-end justify-center pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => {}} />

      <div className="relative w-full max-w-3xl mx-4 mb-4 pointer-events-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Main banner */}
          {!showSettings ? (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0 mt-1">🍪</span>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">Este site utiliza cookies</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Ao aceitar os cookies, usaremos eles para <strong className="text-white">melhorar sua experiência</strong> e permitir que nossos parceiros exibam <strong className="text-cyan-400">anúncios personalizados do PayPal</strong> quando você visitar outros sites.
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Pode alterar as suas preferências a qualquer momento na página de Política de Privacidade.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button onClick={() => accept('accepted')}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-sm hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/20">
                  ✅ Aceitar Todos
                </button>
                <button onClick={() => accept('rejected')}
                  className="flex-1 py-3 bg-slate-800 text-gray-300 rounded-2xl font-semibold text-sm hover:bg-slate-700 transition-all border border-slate-700">
                  ❌ Rejeitar
                </button>
                <button onClick={() => setShowSettings(true)}
                  className="flex-1 py-3 bg-slate-800 text-gray-300 rounded-2xl font-semibold text-sm hover:bg-slate-700 transition-all border border-slate-700">
                  ⚙️ Configurar
                </button>
              </div>
            </div>
          ) : (
            /* Settings panel */
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">⚙️ Configurar Cookies</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { key:'essential' as const, name:'🔒 Essenciais', desc:'Necessários para o funcionamento do site. Não podem ser desactivados.', locked:true },
                  { key:'analytics' as const, name:'📊 Analytics', desc:'Ajudam-nos a entender como usa o site para melhorar a experiência.', locked:false },
                  { key:'advertising' as const, name:'💳 Publicidade (PayPal)', desc:'Permitem que parceiros como PayPal exibam anúncios personalizados noutros sites.', locked:false },
                  { key:'social' as const, name:'📱 Redes Sociais', desc:'Permitem funcionalidades de partilha e integração com redes sociais.', locked:false },
                ].map(c => (
                  <div key={c.key} className={`flex items-center gap-4 p-4 rounded-2xl border ${prefs[c.key] ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{c.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{c.desc}</p>
                    </div>
                    <button
                      onClick={() => !c.locked && setPrefs(p => ({ ...p, [c.key]: !p[c.key] }))}
                      disabled={c.locked}
                      className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${prefs[c.key] ? 'bg-cyan-500' : 'bg-slate-600'} ${c.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${prefs[c.key] ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => accept('custom', prefs)}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-sm hover:from-cyan-600 hover:to-blue-700 transition-all">
                  💾 Guardar Preferências
                </button>
                <button onClick={() => accept('accepted')}
                  className="px-6 py-3 bg-green-500/20 text-green-400 rounded-2xl text-sm font-semibold hover:bg-green-500/30 transition-all">
                  Aceitar Todos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. TERMOS DE USO
═══════════════════════════════════════════════════════════ */

export function TermosPage() {
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-4">📜 LEGAL</span>
          <h1 className="text-4xl font-bold text-white">Termos de Uso</h1>
          <p className="text-gray-400 text-sm mt-2">Última actualização: Janeiro 2025</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 md:p-8 space-y-8 text-sm text-gray-300 leading-relaxed">

          <div>
            <h2 className="text-white font-bold text-xl mb-3 flex items-center gap-2">1. Aceitação dos Termos</h2>
            <p>Ao aceder e utilizar a plataforma <strong className="text-cyan-400">Netek Services</strong> (incluindo todos os serviços, ferramentas e conteúdos disponibilizados), o utilizador concorda integralmente com estes Termos de Uso. Se não concordar com qualquer secção, não deve utilizar a plataforma.</p>
            <p className="mt-2">A plataforma destina-se ao público de <strong className="text-white">Moçambique</strong> e opera sob a legislação moçambicana aplicável.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">2. Gratuidade e Donativos Voluntários</h2>
            <p>Todas as ferramentas e serviços da plataforma são <strong className="text-green-400">100% gratuitos</strong>, incluindo mas não limitados a:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Quizzes inteligentes e sistema de ranking</li>
              <li>Ferramenta de plantas de casas 2D e 3D</li>
              <li>Biblioteca digital com livros de domínio público</li>
              <li>Guias locais, pré-agendamentos e directórios</li>
              <li>Cursos online com certificado (265 horas)</li>
              <li>Gerador de CV, cartas e contratos</li>
              <li>Marketplace e KayaMoz</li>
            </ul>
            <p className="mt-3">A plataforma opera num modelo de <strong className="text-pink-400">Pay-What-You-Want</strong> (pague o que quiser). Os donativos são <strong className="text-white">estritamente voluntários</strong> e servem para custear servidores, desenvolvimento e manutenção. Nenhum serviço é condicionado a pagamento.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">3. Uso Aceitável</h2>
            <p>O utilizador compromete-se a:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Não utilizar bots, scrapers maliciosos ou ferramentas automatizadas que sobrecarreguem o sistema</li>
              <li>Não criar perfis falsos ou impersonar terceiros</li>
              <li>Não abusar do sistema de denúncias, avaliações ou comentários</li>
              <li>Não publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros</li>
              <li>Não tentar aceder a áreas administrativas sem autorização</li>
              <li>Não utilizar a plataforma para actividades fraudulentas ou de spam</li>
            </ul>
            <p className="mt-2 text-yellow-400">⚠️ A violação destas regras pode resultar em suspensão ou banimento permanente da conta.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">4. Isenção de Responsabilidade</h2>
            <p>A plataforma compila e apresenta dados de fontes externas de forma automatizada (incluindo preços de hotéis, restaurantes, serviços de aluguer, notícias e informações de sites governamentais de Moçambique).</p>
            <p className="mt-2"><strong className="text-red-400">A Netek Services não se responsabiliza por:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Alterações de preços, horários ou disponibilidade nos sites de origem</li>
              <li>Informações incorrectas ou desactualizadas provenientes de fontes externas</li>
              <li>Decisões tomadas com base nos dados apresentados na plataforma</li>
              <li>Transacções comerciais realizadas entre utilizadores (incluindo no Marketplace e KayaMoz)</li>
              <li>Indisponibilidade temporária de serviços externos ou APIs</li>
            </ul>
            <p className="mt-2">Recomendamos sempre confirmar informações directamente com os prestadores de serviços antes de tomar decisões.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">5. Propriedade Intelectual</h2>
            <p>O design, código-fonte, logótipos e conteúdo original da Netek Services são propriedade dos seus criadores. Os livros da biblioteca digital são de domínio público ou licenças abertas. Os dados compilados de fontes externas pertencem aos seus respectivos proprietários.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">6. Alterações aos Termos</h2>
            <p>A Netek Services reserva-se o direito de alterar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.</p>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700">
            <p className="text-gray-400 text-xs">📬 Questões sobre estes termos? Contacte-nos pelo WhatsApp +258 84 016 6592 ou email johsondagloria@gmail.com</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. POLÍTICA DE PRIVACIDADE
═══════════════════════════════════════════════════════════ */

export function PrivacidadePage() {
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">🔒 PRIVACIDADE</span>
          <h1 className="text-4xl font-bold text-white">Política de Privacidade</h1>
          <p className="text-gray-400 text-sm mt-2">Última actualização: Janeiro 2025</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 md:p-8 space-y-8 text-sm text-gray-300 leading-relaxed">

          <div>
            <h2 className="text-white font-bold text-xl mb-3">1. Recolha de Dados</h2>
            <p>A Netek Services recolhe e armazena os seguintes dados:</p>
            <div className="mt-3 space-y-2">
              {[
                { d:'Email e nome', p:'Registo de conta (Firebase Auth)', o:'Obrigatório' },
                { d:'Telefone e localização', p:'Perfil do utilizador', o:'Opcional' },
                { d:'Progresso nos cursos e quizzes', p:'Sistema de certificação e ranking', o:'Automático' },
                { d:'Plantas de casas guardadas', p:'Ferramenta de plantas 2D/3D', o:'Voluntário' },
                { d:'Downloads de livros', p:'Biblioteca digital', o:'Automático' },
                { d:'Preferências de cookies', p:'Banner de consentimento', o:'Voluntário' },
                { d:'Mensagens de chat', p:'Chat em tempo real (Firebase RTDB)', o:'Voluntário' },
                { d:'Histórico de donativos', p:'Sistema de donativos', o:'Voluntário' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl">
                  <span className="text-green-400 shrink-0">✓</span>
                  <div className="flex-1"><span className="text-white">{item.d}</span> — {item.p}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.o === 'Obrigatório' ? 'bg-red-500/20 text-red-400' : item.o === 'Automático' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{item.o}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">2. Cruzamento de Dados e OSINT</h2>
            <p>O sistema utiliza técnicas de <strong className="text-cyan-400">Open Source Intelligence (OSINT)</strong> para:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Cruzar dados <strong>públicos</strong> da internet para enriquecer perfis de figuras públicas moçambicanas</li>
              <li>Mapear redes sociais públicas de artistas, músicos e personalidades para gerar quizzes actualizados</li>
              <li>Recomendar conexões entre utilizadores da mesma região com interesses similares</li>
              <li>Compilar notícias de portais moçambicanos para actualizar o conteúdo automaticamente</li>
            </ul>
            <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
              <p className="text-yellow-400 font-semibold">⚠️ Garantia de Privacidade</p>
              <p className="text-gray-300 mt-1">O sistema <strong className="text-white">nunca</strong> acede a perfis privados, mensagens privadas, contas protegidas ou quaisquer dados não públicos. Todo o cruzamento de dados baseia-se exclusivamente em informações voluntariamente tornadas públicas pelos próprios utilizadores nas suas redes sociais.</p>
            </div>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">3. Partilha com Parceiros (Publicidade PayPal)</h2>
            <p>Mediante o <strong className="text-white">consentimento explícito</strong> do utilizador (via banner de cookies), a plataforma pode partilhar:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Dados de navegação anónimos</strong> (páginas visitadas, tempo no site) com parceiros de publicidade</li>
              <li>O parceiro principal é o <strong className="text-blue-400">PayPal</strong>, que pode exibir anúncios personalizados quando o utilizador visitar outros sites</li>
              <li>Nenhum dado pessoal identificável (nome, email, telefone) é partilhado com parceiros publicitários</li>
            </ul>
            <p className="mt-2">O utilizador pode <strong className="text-cyan-400">revogar este consentimento</strong> a qualquer momento nas definições de cookies.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">4. Armazenamento e Segurança</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>Dados de autenticação: <strong>Firebase Auth</strong> (encriptação AES-256, servidores Google)</li>
              <li>Dados de perfil e conteúdo: <strong>Firebase Firestore</strong> (replicação multi-região)</li>
              <li>Chat em tempo real: <strong>Firebase Realtime Database</strong></li>
              <li>Ficheiros de livros em cache: Servidor local (<code>/uploads/livros</code>)</li>
              <li>Tokens JWT: Sessão local do navegador (SessionStorage/LocalStorage)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-3">5. Direitos do Utilizador</h2>
            <p>O utilizador tem direito a:</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { r:'Acesso', d:'Solicitar cópia de todos os dados pessoais armazenados' },
                { r:'Rectificação', d:'Corrigir dados pessoais incorrectos ou desactualizados' },
                { r:'Eliminação', d:'Solicitar a eliminação completa da conta e todos os dados associados' },
                { r:'Portabilidade', d:'Exportar os seus dados num formato legível (JSON/CSV)' },
                { r:'Restrição', d:'Limitar o processamento dos seus dados' },
                { r:'Oposição', d:'Opor-se ao processamento para fins de marketing' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                  <p className="text-green-400 font-semibold text-sm">{item.r}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">Para exercer qualquer destes direitos, contacte: <strong className="text-white">johsondagloria@gmail.com</strong> ou WhatsApp <strong className="text-white">+258 87 478 6943</strong></p>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700">
            <p className="text-gray-400 text-xs">🇲🇿 Esta política é regida pela legislação da República de Moçambique. Para questões: johsondagloria@gmail.com</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. SISTEMA DE PARTILHA POR REDES SOCIAIS
═══════════════════════════════════════════════════════════ */

export function ShareButtons({ url, title }: { url?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Netek Services — Plataforma Digital de Moçambique';
  const shareText = `${shareTitle} — Serviços digitais, cursos grátis, talentos e mais!`;

  const platforms = [
    { name:'Facebook',  icon:'📘', color:'from-blue-600 to-blue-700',  url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name:'WhatsApp',  icon:'💬', color:'from-green-500 to-green-600', url:`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
    { name:'Twitter',   icon:'🐦', color:'from-sky-500 to-sky-600',    url:`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
    { name:'LinkedIn',  icon:'💼', color:'from-blue-700 to-blue-800',  url:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { name:'Telegram',  icon:'✈️', color:'from-blue-400 to-blue-500',  url:`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { name:'Email',     icon:'📧', color:'from-gray-600 to-gray-700',  url:`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}` },
  ];

  const copy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {platforms.map(p => (
        <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" title={`Partilhar no ${p.name}`}
          className={`w-10 h-10 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center text-lg hover:scale-110 transition-all shadow-lg`}>
          {p.icon}
        </a>
      ))}
      <button onClick={copy} title="Copiar link" className={`h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
        {copied ? '✅' : '🔗'} {copied ? 'Copiado!' : 'Copiar'}
      </button>
      {typeof navigator.share === 'function' && (
        <button onClick={nativeShare} className="h-10 px-3 bg-slate-700 text-gray-300 rounded-xl text-xs font-medium hover:bg-slate-600 transition-all flex items-center gap-1.5">
          📤 Partilhar
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. BIOGRAFIA DO DESENVOLVEDOR — @jonsonjb7
═══════════════════════════════════════════════════════════ */

export function DevBioPage() {
  const dev = {
    name: 'Jonson JB',
    username: '@jonsonjb7',
    fullName: 'Jonson da Glória',
    role: 'Full-Stack Developer & Fundador',
    avatar: '👨‍💻',
    location: 'Moçambique 🇲🇿',
    email: 'johsondagloria@gmail.com',
    whatsapp: '+258 87 478 6943',
    bio: 'Desenvolvedor full-stack apaixonado por tecnologia e inovação digital em Moçambique. Criador do KayaMoz e da Netek Services — plataformas que democratizam o acesso à tecnologia, educação e oportunidades para todos os moçambicanos.',
    mission: 'Usar tecnologia para resolver problemas reais do dia-a-dia em Moçambique, tornando serviços digitais acessíveis a todos, independentemente da sua localização ou condição económica.',
    skills: ['React', 'TypeScript', 'Node.js', 'Firebase', 'Python', 'Tailwind CSS', 'UI/UX Design', 'IA & Machine Learning', 'Web Scraping', 'Mobile Development'],
    projects: [
      { name:'Netek Services', desc:'Plataforma digital completa para Moçambique', emoji:'🌐', url:'#', status:'Activo' },
      { name:'KayaMoz', desc:'Marketplace de talentos e trabalho local', emoji:'🔍', url:'https://jonsonjb.github.io/kayamoz', status:'Activo' },
      { name:'SonhaMZ', desc:'IA moçambicana que interpreta sonhos por voz', emoji:'🌙', url:'#', status:'Concluído' },
      { name:'ManoMZ', desc:'Chatbot conversacional com tom moçambicano', emoji:'🎤', url:'#', status:'Concluído' },
    ],
    socials: [
      { platform:'Facebook', icon:'📘', url:'https://facebook.com/jonsonjb7', username:'@jonsonjb7', color:'blue', followers:'—' },
      { platform:'Instagram', icon:'📸', url:'https://instagram.com/jonsonjb7', username:'@jonsonjb7', color:'pink', followers:'—' },
      { platform:'WhatsApp', icon:'💬', url:'https://wa.me/258874786943', username:'+258 87 478 6943', color:'green', followers:'—' },
      { platform:'Email', icon:'📧', url:'mailto:johsondagloria@gmail.com', username:'johsondagloria@gmail.com', color:'gray', followers:'—' },
      { platform:'Blog', icon:'📝', url:'https://jonsonjb.blogspot.com', username:'jonsonjb.blogspot.com', color:'orange', followers:'—' },
      { platform:'GitHub', icon:'💻', url:'https://github.com/jonsonjb', username:'@jonsonjb', color:'slate', followers:'—' },
      { platform:'KayaMoz', icon:'🔍', url:'https://jonsonjb.github.io/kayamoz', username:'KayaMoz.co.mz', color:'purple', followers:'—' },
    ],
    stats: [
      { label:'Projectos', value:'4+', icon:'🚀' },
      { label:'Cursos criados', value:'12', icon:'📚' },
      { label:'Linhas de código', value:'50K+', icon:'💻' },
      { label:'Utilizadores', value:'1K+', icon:'👥' },
    ],
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 rounded-3xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-28 h-28 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-6xl shadow-2xl shadow-cyan-500/30">
              {dev.avatar}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-white">{dev.name}</h1>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-semibold">✅ Verificado</span>
              </div>
              <p className="text-cyan-400 font-medium">{dev.username}</p>
              <p className="text-purple-300 text-sm mt-1">{dev.role}</p>
              <p className="text-gray-400 text-sm mt-1">📍 {dev.location}</p>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed max-w-xl">{dev.bio}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {dev.stats.map((s, i) => (
              <div key={i} className="bg-slate-900/50 rounded-2xl p-3 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-white font-bold text-xl">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Missão */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8">
          <h2 className="text-white font-bold text-xl mb-3 flex items-center gap-2">🎯 Missão</h2>
          <p className="text-gray-300 leading-relaxed">{dev.mission}</p>
        </div>

        {/* Redes Sociais */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8">
          <h2 className="text-white font-bold text-xl mb-5 flex items-center gap-2">🌐 Redes Sociais & Contacto</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {dev.socials.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg bg-${s.color}-500/10 border-${s.color}-500/20 hover:border-${s.color}-500/50`}>
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{s.platform}</p>
                  <p className="text-gray-400 text-sm truncate">{s.username}</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8">
          <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">🛠️ Competências</h2>
          <div className="flex flex-wrap gap-2">
            {dev.skills.map((skill, i) => (
              <span key={i} className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Projectos */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8">
          <h2 className="text-white font-bold text-xl mb-5 flex items-center gap-2">🚀 Projectos</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {dev.projects.map((p, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <h3 className="text-white font-bold">{p.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${p.status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{p.status}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partilhar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6">
          <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">📤 Partilhar este site</h2>
          <p className="text-gray-400 text-sm mb-4">Ajude a divulgar a Netek Services partilhando com amigos e familiares!</p>
          <ShareButtons title="Netek Services — Plataforma Digital de Moçambique por @jonsonjb7" />
        </div>
      </div>
    </section>
  );
}
