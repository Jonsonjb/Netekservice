import { useEffect, useState } from 'react';

type CookiePrefs = {
  necessary: true;
  analytics: boolean;
  ads: boolean;
  paypalAds: boolean;
};

const CONSENT_KEY = 'netek_cookie_consent_v1';

const defaultPrefs: CookiePrefs = {
  necessary: true,
  analytics: false,
  ads: false,
  paypalAds: false,
};

function injectPartnerScripts(prefs: CookiePrefs) {
  window.dispatchEvent(new CustomEvent('netek-cookie-consent', { detail: prefs }));
  (window as unknown as { netekConsent?: CookiePrefs }).netekConsent = prefs;

  if (prefs.paypalAds && !document.getElementById('paypal-ads-pixel-mock')) {
    const script = document.createElement('script');
    script.id = 'paypal-ads-pixel-mock';
    script.type = 'text/plain';
    script.dataset.partner = 'paypal-ads';
    script.textContent = '/* PayPal Ads Pixel placeholder: inserir script oficial apenas após consentimento. */';
    document.head.appendChild(script);
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(defaultPrefs);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setVisible(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as CookiePrefs;
      setPrefs(parsed);
      injectPartnerScripts(parsed);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (next: CookiePrefs) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setPrefs(next);
    injectPartnerScripts(next);
    setVisible(false);
    setSettings(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-950/95 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-3 flex-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl">🍪</div>
            <div>
              <h3 className="font-bold text-white">Preferências de cookies</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-300">
                Ao aceitar os cookies, usaremos eles para melhorar sua experiência e permitir que nossos parceiros exibam anúncios personalizados do PayPal quando você visitar outros sites.
              </p>
              <p className="mt-2 text-xs text-gray-500">Pode alterar a sua escolha a qualquer momento na página de Política de Privacidade.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button onClick={() => save({ necessary: true, analytics: true, ads: true, paypalAds: true })} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:from-cyan-600 hover:to-blue-700">Aceitar Todos</button>
            <button onClick={() => save(defaultPrefs)} className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-gray-300 transition-all hover:bg-slate-800">Rejeitar</button>
            <button onClick={() => setSettings(!settings)} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20">Definições/Configurar</button>
          </div>
        </div>

        {settings && (
          <div className="mt-5 grid gap-3 border-t border-slate-800 pt-5 md:grid-cols-2">
            {[
              { key: 'necessary', label: 'Cookies necessários', desc: 'Essenciais para login, segurança e funcionamento do site.', locked: true },
              { key: 'analytics', label: 'Medição e melhorias', desc: 'Ajuda-nos a perceber o que funciona melhor na plataforma.' },
              { key: 'ads', label: 'Publicidade personalizada', desc: 'Permite anúncios mais relevantes com base em navegação anónima.' },
              { key: 'paypalAds', label: 'Parceiros PayPal Ads', desc: 'Permite que parceiros exibam anúncios personalizados do PayPal em outros sites.' },
            ].map(item => (
              <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <input
                  type="checkbox"
                  checked={(prefs as unknown as Record<string, boolean>)[item.key]}
                  disabled={item.locked}
                  onChange={e => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">{item.desc}</span>
                </span>
              </label>
            ))}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={() => save(prefs)} className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-600">Guardar Preferências</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Termos de Uso" badge="📜 TERMOS" updated="Atualizado em Janeiro de 2025">
      <Section title="1. Aceitação dos Termos">
        Ao usar a Netek Services, KayaMoz integrado, biblioteca digital, ferramentas, quizzes, plantas 2D/3D e demais módulos, o cidadão concorda com estes Termos de Uso e compromete-se a utilizar a plataforma de forma lícita, responsável e respeitosa.
      </Section>
      <Section title="2. Gratuidade e Donativos Voluntários">
        Todas as ferramentas da plataforma são disponibilizadas gratuitamente. Isto inclui pré-marcações, agendamentos, downloads de livros, biblioteca digital, quizzes, guias, ferramentas de IA, criação de plantas 2D/3D e utilidades públicas. A Netek Services funciona com uma política Pay-What-You-Want: se a plataforma ajudou o utilizador, ele pode escolher livremente se deseja contribuir com um donativo para manutenção dos servidores, custos técnicos e evolução do projecto. Nenhum donativo é obrigatório.
      </Section>
      <Section title="3. Uso Aceitável">
        É proibido usar bots maliciosos, automatizações abusivas, perfis falsos, spam, tentativas de fraude, exploração de vulnerabilidades, scraping não autorizado, publicação de conteúdo ilegal ou abuso do sistema de denúncias. A plataforma pode suspender ou bloquear contas que violem estas regras.
      </Section>
      <Section title="4. Dados Externos e Isenção de Responsabilidade">
        A plataforma compila e organiza dados externos de fontes públicas, como sites oficiais, portais de notícias, diretórios, hotéis, restaurantes, mercados, anúncios de aluguer, serviços locais e outras fontes abertas. A Netek Services não controla alterações de preços, disponibilidade, horários, contactos ou informações exibidas nos sites de origem, e por isso não se responsabiliza por informações incorretas ou desatualizadas fornecidas por terceiros.
      </Section>
      <Section title="5. Conteúdo da Biblioteca Digital">
        A biblioteca digital deve conter apenas livros de domínio público, recursos educacionais abertos, conteúdos autorizados ou referências a fontes oficiais. Caso algum conteúdo apresente problema de direitos autorais, corrupção de ficheiro ou formatação, poderá ser removido pela moderação.
      </Section>
      <Section title="6. Marketplace, Talentos e KayaMoz">
        O KayaMoz integrado facilita a ligação entre cidadãos, profissionais e contratantes. A Netek Services não é parte direta dos acordos feitos entre utilizadores, salvo quando presta suporte explícito. O cidadão deve verificar identidade, preço, condições e reputação antes de concluir qualquer negócio.
      </Section>
      <Section title="7. Alterações dos Termos">
        Estes Termos podem ser atualizados para refletir novas funcionalidades, leis, requisitos técnicos ou políticas de segurança. O uso continuado da plataforma após a atualização significa aceitação dos novos termos.
      </Section>
    </LegalShell>
  );
}

export function PrivacyPage() {
  const resetCookies = () => {
    localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  };

  return (
    <LegalShell title="Política de Privacidade" badge="🔐 PRIVACIDADE" updated="Atualizado em Janeiro de 2025">
      <Section title="1. Recolha de Dados">
        A plataforma pode armazenar dados fornecidos diretamente pelo utilizador, como e-mail de cadastro, nome, telefone, província, bairro, progresso nos quizzes, pontuação, histórico de cursos, plantas guardadas no navegador, livros baixados e preferências de cookies. Alguns dados podem ser guardados em LocalStorage no dispositivo e outros no Firebase/Firestore quando o utilizador inicia sessão.
      </Section>
      <Section title="2. Biblioteca, Downloads e Localhost">
        Quando o utilizador baixa livros, o histórico local pode ser guardado no navegador para melhorar a experiência. No servidor, livros baixados de fontes públicas podem ser armazenados em cache local, como /uploads/livros, para acelerar downloads futuros sem sobrecarregar APIs externas.
      </Section>
      <Section title="3. Cruzamento de Dados e Inteligência OSINT">
        O sistema pode cruzar dados públicos da internet, fontes oficiais e perfis públicos de redes sociais para enriquecer a experiência, gerar quizzes, mapear tendências, identificar figuras públicas, músicas, notícias e eventos. Dados estritamente privados, mensagens privadas, grupos fechados e conteúdos não autorizados não devem ser consultados. Para enriquecimento de perfil comunitário, o utilizador deve dar consentimento explícito.
      </Section>
      <Section title="4. Compartilhamento com Parceiros e Anúncios PayPal">
        Mediante consentimento de cookies, dados de navegação anónimos podem ser partilhados com parceiros de publicidade para exibir anúncios personalizados do PayPal quando o utilizador visitar outros sites. Caso rejeite cookies de publicidade, estes scripts não são ativados.
      </Section>
      <Section title="5. Cookies e Preferências">
        Usamos cookies e armazenamento local para manter login, preferências, progresso, segurança e melhorias da plataforma. O utilizador pode aceitar todos, rejeitar ou configurar categorias. Cookies necessários são essenciais ao funcionamento básico.
      </Section>
      <Section title="6. Direitos do Utilizador">
        O utilizador pode solicitar a eliminação da conta e de todos os dados associados, incluindo perfil, progresso de cursos, histórico de quizzes, plantas guardadas e dados de suporte. Pode também solicitar correção, exportação ou oposição ao tratamento de dados, quando aplicável.
      </Section>
      <Section title="7. Segurança">
        Aplicamos autenticação, logs, controlo de acesso, moderação e boas práticas de segurança. Contudo, nenhum sistema é 100% imune a riscos; recomendamos senhas fortes, autenticação em duas etapas e cuidado com partilha de dados pessoais.
      </Section>
      <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
        <h3 className="font-bold text-cyan-300">Gerir Cookies</h3>
        <p className="mt-2 text-sm text-gray-400">Clique abaixo para apagar a decisão de cookies e escolher novamente.</p>
        <button onClick={resetCookies} className="mt-4 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-600">Reabrir Banner de Cookies</button>
      </div>
    </LegalShell>
  );
}

function LegalShell({ title, badge, updated, children }: { title: string; badge: string; updated: string; children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400">{badge}</span>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">{updated}</p>
        </div>
        <div className="space-y-5 rounded-3xl border border-slate-700 bg-slate-900/60 p-6 md:p-8">
          {children}
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      <p className="text-sm leading-7 text-gray-400">{children}</p>
    </section>
  );
}

export function SharePage() {
  return (
    <section className="min-h-screen bg-slate-900 py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">📤 PARTILHAR</span>
          <h1 className="text-4xl font-bold text-white">Partilhe a Netek Services</h1>
          <p className="mt-2 text-gray-400">Gere links e partilhe nas redes sociais.</p>
        </div>
        <ShareWidget />
      </div>
    </section>
  );
}

export function ShareWidget({ url, title }: { url?: string; title?: string }) {
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Netek Services - Plataforma digital de Moçambique';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareTitle);
  const [copied, setCopied] = useState(false);
  const links = [
    { name: 'Facebook', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { name: 'X/Twitter', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { name: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { name: 'LinkedIn', icon: '💼', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'Email', icon: '📧', href: `mailto:?subject=${encodedText}&body=${encodedText}%0A${encodedUrl}` },
  ];
  const copy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-5 rounded-2xl bg-slate-950/70 p-4">
        <p className="text-xs text-gray-500">Link gerado</p>
        <p className="mt-1 break-all font-mono text-sm text-cyan-300">{shareUrl}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {links.map(l => <a key={l.name} href={l.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-center text-sm font-semibold text-white transition-all hover:border-cyan-500/60 hover:bg-cyan-500/10"><span className="mb-1 block text-2xl">{l.icon}</span>{l.name}</a>)}
      </div>
      <button onClick={copy} className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-cyan-500 text-white hover:bg-cyan-600'}`}>{copied ? '✅ Link copiado!' : '📋 Copiar link'}</button>
    </div>
  );
}

const developerLinks = [
  { label: 'Facebook @jonsonjb7', href: 'https://www.facebook.com/jonsonjb7', icon: '📘' },
  { label: 'Instagram @jonsonjb7', href: 'https://www.instagram.com/jonsonjb7', icon: '📸' },
  { label: 'WhatsApp +258 87 478 6943', href: 'https://wa.me/258874786943', icon: '💬' },
  { label: 'Email johsondagloria@gmail.com', href: 'mailto:johsondagloria@gmail.com', icon: '📧' },
  { label: 'Blog Jonson JB Tutoriais', href: 'https://jonsonjb.blogspot.com', icon: '📝' },
  { label: 'KayaMoz', href: 'https://jonsonjb.github.io/kayamoz/', icon: '🔍' },
];

export function DeveloperProfilePage() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-5xl">👨‍💻</div>
          <h1 className="text-4xl font-bold text-white">Jonson JB</h1>
          <p className="mt-2 text-cyan-300">Desenvolvedor, criador de tutoriais e soluções digitais para Moçambique</p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-gray-400">Com base em dados públicos mapeados na internet, Jonson JB aparece associado ao ecossistema “Jonson JB Tutoriais”, com conteúdos sobre desbloqueio de rede, ferramentas GSM, modem Vodacom/Mcel/Movitel, firmware, tutoriais digitais e projectos como KayaMoz. Esta biografia foi estruturada dentro do site a partir de fontes públicas indicadas pelo próprio desenvolvedor.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developerLinks.map(l => <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 text-white transition-all hover:border-cyan-500/60 hover:bg-cyan-500/10"><span className="mr-2 text-2xl">{l.icon}</span>{l.label}</a>)}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Tutoriais de desbloqueio de rede', 'Ferramentas GSM e firmware', 'Projectos digitais para Moçambique'].map(t => <div key={t} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 text-center text-gray-300">✅ {t}</div>)}
        </div>
        <div className="mt-8"><ShareWidget url="https://jonsonjb.blogspot.com" title="Jonson JB Tutoriais - Tecnologia e projectos digitais" /></div>
      </div>
    </section>
  );
}
