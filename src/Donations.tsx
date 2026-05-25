/**
 * NETEK — MÓDULO DE DONATIVOS VOLUNTÁRIOS
 * "Nossos serviços são 100% gratuitos."
 *
 * Métodos de pagamento reais:
 *   M-Pesa (vermelho)  → +258 84 016 6592  → USSD *150#
 *   e-Mola (laranja)   → +258 87 478 6943  → USSD *898#
 *   M-Kesh (amarelo)   → USSD *500#
 *   PayPal             → netekservice@gmail.com
 */
import { useState } from 'react';
import { WA_BUSINESS } from './data';

const waLink = (msg: string) => `https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent(msg)}`;

const AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000];

interface PayMethod {
  id: string;
  name: string;
  icon: string;
  color: string;       // tailwind color
  bgGrad: string;      // gradient CSS
  number: string;
  ussd: string;        // código USSD para abrir no telemóvel
  instructions: string;
  actionType: 'ussd' | 'paypal' | 'wa';
  actionUrl: string;   // URL ou tel: link
}

const METHODS: PayMethod[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '🔴',
    color: 'red',
    bgGrad: 'from-red-600 to-red-700',
    number: '+258 84 016 6592',
    ussd: '*150#',
    instructions: 'Marque *150# no seu telemóvel → Transferir → Digite o número 840166592 → Valor → Confirme com o PIN M-Pesa.',
    actionType: 'ussd',
    actionUrl: 'tel:*150%23',
  },
  {
    id: 'emola',
    name: 'e-Mola',
    icon: '🟠',
    color: 'orange',
    bgGrad: 'from-orange-500 to-orange-600',
    number: '+258 87 478 6943',
    ussd: '*898#',
    instructions: 'Marque *898# no seu telemóvel → Enviar dinheiro → Digite o número 874786943 → Valor → Confirme com o PIN e-Mola.',
    actionType: 'ussd',
    actionUrl: 'tel:*898%23',
  },
  {
    id: 'mkesh',
    name: 'M-Kesh',
    icon: '🟡',
    color: 'yellow',
    bgGrad: 'from-yellow-500 to-yellow-600',
    number: 'Via USSD',
    ussd: '*500#',
    instructions: 'Marque *500# no seu telemóvel → Transferir → Siga as instruções para enviar o valor.',
    actionType: 'ussd',
    actionUrl: 'tel:*500%23',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    color: 'blue',
    bgGrad: 'from-blue-600 to-indigo-600',
    number: 'netekservice@gmail.com',
    ussd: '',
    instructions: 'Será redirecionado para o PayPal. Envie para netekservice@gmail.com o valor que desejar.',
    actionType: 'paypal',
    actionUrl: 'https://www.paypal.com/paypalme/netekservice',
  },
];

export function DonationsPage() {
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState('mpesa');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const finalAmount = custom ? Number(custom) : amount;
  const sel = METHODS.find(m => m.id === method)!;

  const handleAction = () => {
    if (sel.actionType === 'paypal') {
      // PayPal → redirecionar para paypal.com
      window.open(sel.actionUrl, '_blank');
    } else {
      // USSD → abre o discador com o código USSD
      window.location.href = sel.actionUrl;
    }

    // Também abre WhatsApp com mensagem de confirmação
    setTimeout(() => {
      const msg =
        `🎁 *DONATIVO VOLUNTÁRIO — NETEK SERVICES*\n\n` +
        `💰 Valor: ${finalAmount.toLocaleString()} MT\n` +
        `💳 Método: ${sel.name} (${sel.ussd || sel.number})\n` +
        `👤 Nome: ${name || 'Anónimo'}\n` +
        `💬 Mensagem: ${message || '—'}\n\n` +
        `📱 Número destino: ${sel.number}\n\n` +
        `Por favor envie o comprovativo de pagamento nesta conversa.\n` +
        `Muito obrigado pelo apoio! ❤️`;
      window.open(waLink(msg), '_blank');
    }, 1500);

    setStep(3);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* ── Header ── */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-pink-500/10 text-pink-400 rounded-full text-sm font-medium mb-4">❤️ DONATIVOS VOLUNTÁRIOS</span>
          <h2 className="text-4xl font-bold text-white mb-3">Apoie a Netek Services</h2>
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5 mt-6 max-w-xl mx-auto">
            <p className="text-green-400 font-bold text-lg mb-2">🆓 100% Gratuito, Sempre</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Nossos serviços são <strong className="text-white">100% gratuitos</strong>. Pré-marcações, livros, ferramentas, cursos — tudo sem custos.
              Se este sistema te ajudou, <strong className="text-green-400">você escolhe se e quanto quer oferecer</strong> como donativo para nos ajudar a manter os servidores e o site em dia.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Stepper */}
          <div className="flex border-b border-slate-700">
            {['💰 Valor', '💳 Pagamento', '🙏 Obrigado'].map((l, i) => (
              <div key={i} className={`flex-1 py-3 text-center text-xs font-semibold transition-all ${step === i + 1 ? 'bg-pink-500/20 text-pink-400' : step > i + 1 ? 'bg-green-500/10 text-green-400' : 'text-gray-600'}`}>
                <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] mr-1 ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-pink-500 text-white' : 'bg-slate-700'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                {l}
              </div>
            ))}
          </div>

          <div className="p-6">
            {/* ═══ PASSO 1 — VALOR ═══ */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-white font-bold text-lg">Quanto quer doar? <span className="text-gray-500 text-sm font-normal">(100% voluntário)</span></h3>
                <div className="grid grid-cols-4 gap-3">
                  {AMOUNTS.map(a => (
                    <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                      className={`py-3 rounded-2xl font-bold transition-all ${amount === a && !custom
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 scale-105'
                        : 'bg-slate-800 text-gray-300 border border-slate-700 hover:border-pink-500/50 hover:text-white'
                      }`}>
                      <span className="text-lg">{a >= 1000 ? `${a / 1000}K` : a}</span>
                      <span className="text-[10px] font-normal block">MT</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Ou digite outro valor (MT)</label>
                  <input
                    type="number" value={custom}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="Valor personalizado"
                    className="w-full px-4 py-3.5 bg-slate-900/60 text-white rounded-2xl border border-slate-700 focus:border-pink-500 focus:outline-none text-2xl font-bold text-center"
                  />
                </div>
                <button
                  onClick={() => finalAmount > 0 && setStep(2)}
                  disabled={finalAmount <= 0}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold text-lg disabled:opacity-40 hover:from-pink-600 hover:to-purple-600 transition-all shadow-xl shadow-pink-500/20"
                >
                  Continuar com {finalAmount.toLocaleString()} MT →
                </button>
              </div>
            )}

            {/* ═══ PASSO 2 — PAGAMENTO ═══ */}
            {step === 2 && (
              <div className="space-y-5">
                <button onClick={() => setStep(1)} className="text-gray-500 text-sm hover:text-white transition-colors">← Alterar valor</button>

                <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-center">
                  <p className="text-gray-400 text-sm">Valor do donativo</p>
                  <p className="text-4xl font-bold text-white mt-1">{finalAmount.toLocaleString()} <span className="text-lg text-gray-400">MT</span></p>
                </div>

                <h3 className="text-white font-bold text-lg">Escolha o método de pagamento</h3>

                {/* Cards de métodos */}
                <div className="grid grid-cols-2 gap-3">
                  {METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`relative p-4 rounded-2xl border text-left transition-all overflow-hidden ${
                        method === m.id
                          ? `border-${m.color}-500 bg-${m.color}-500/15 ring-2 ring-${m.color}-500/30`
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {/* Faixa de cor no topo */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.bgGrad}`} />
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <span className="text-2xl">{m.icon}</span>
                        <span className="text-white font-bold text-sm">{m.name}</span>
                      </div>
                      {m.ussd && (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 bg-${m.color}-500/20 rounded-full mb-1.5`}>
                          <span className="text-white text-xs font-mono font-bold">{m.ussd}</span>
                        </div>
                      )}
                      <p className="text-gray-400 text-xs truncate">{m.number}</p>
                      {method === m.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Instruções detalhadas */}
                <div className={`bg-gradient-to-r ${sel.bgGrad.replace('from-', 'from-').replace(' to-', '/10 to-')}/10 border border-${sel.color}-500/30 rounded-2xl p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{sel.icon}</span>
                    <div>
                      <p className="text-white font-bold">{sel.name}</p>
                      {sel.ussd && <p className="text-white font-mono text-lg font-bold">{sel.ussd}</p>}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-4 mb-3">
                    <p className="text-gray-300 text-sm leading-relaxed">{sel.instructions}</p>
                  </div>
                  {sel.number !== 'Via USSD' && (
                    <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-3">
                      <span className="text-gray-400 text-xs shrink-0">Enviar para:</span>
                      <span className="text-white font-mono font-bold text-sm flex-1">{sel.number}</span>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(sel.number.replace(/\s/g, '')); }}
                        className="px-2 py-1 bg-slate-700 text-gray-300 rounded-lg text-xs hover:bg-slate-600 transition-all shrink-0"
                      >
                        📋 Copiar
                      </button>
                    </div>
                  )}
                </div>

                {/* Nome e mensagem (opcionais) */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome (opcional)</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Anónimo" className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-2xl border border-slate-700 focus:border-pink-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Mensagem (opcional)</label>
                    <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Força Netek!" className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-2xl border border-slate-700 focus:border-pink-500 focus:outline-none text-sm" />
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-gray-500 text-xs">Valor</p><p className="text-white font-bold text-xl">{finalAmount.toLocaleString()} MT</p></div>
                    <div><p className="text-gray-500 text-xs">Método</p><p className="text-white font-bold">{sel.icon} {sel.name}</p></div>
                    <div><p className="text-gray-500 text-xs">USSD</p><p className="text-white font-mono font-bold">{sel.ussd || '—'}</p></div>
                  </div>
                </div>

                {/* Botão de acção principal */}
                <button
                  onClick={handleAction}
                  className={`w-full py-5 bg-gradient-to-r ${sel.bgGrad} text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-3`}
                >
                  {sel.actionType === 'paypal' ? (
                    <>💳 Abrir PayPal e Transferir</>
                  ) : (
                    <>📱 Abrir {sel.ussd} e Enviar pelo WhatsApp</>
                  )}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  {sel.actionType === 'ussd'
                    ? `Ao clicar, o telemóvel abre o código ${sel.ussd}. Após enviar, o WhatsApp abre para confirmar.`
                    : 'Ao clicar, será redirecionado para o PayPal para completar a transferência.'
                  }
                </p>
              </div>
            )}

            {/* ═══ PASSO 3 — AGRADECIMENTO ═══ */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="text-7xl mb-4">🙏</div>
                <h3 className="text-2xl font-bold text-white mb-2">Muito obrigado, {name || 'amigo'}!</h3>
                <p className="text-gray-400 mb-2">
                  O seu donativo voluntário de <strong className="text-pink-400">{finalAmount.toLocaleString()} MT</strong> via <strong className="text-white">{sel.icon} {sel.name}</strong> ajuda a manter esta plataforma gratuita para todos os moçambicanos.
                </p>

                {sel.actionType === 'ussd' && (
                  <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4 mt-4 mb-4 max-w-sm mx-auto">
                    <p className="text-gray-400 text-sm mb-2">Se o USSD não abriu automaticamente, marque:</p>
                    <a href={sel.actionUrl} className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${sel.bgGrad} text-white rounded-xl font-mono font-bold text-xl`}>
                      📞 {sel.ussd}
                    </a>
                    <p className="text-gray-500 text-xs mt-2">Envie para: <strong className="text-white">{sel.number}</strong></p>
                  </div>
                )}

                {sel.actionType === 'paypal' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mt-4 mb-4 max-w-sm mx-auto">
                    <p className="text-gray-400 text-sm mb-2">Se o PayPal não abriu, clique abaixo:</p>
                    <a href={sel.actionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold">
                      💳 Abrir PayPal → netekservice@gmail.com
                    </a>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <button onClick={() => { setStep(1); setCustom(''); setName(''); setMessage(''); }} className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all">
                    Fazer outro donativo
                  </button>
                  <a href={waLink(`Olá! Acabei de fazer um donativo de ${finalAmount.toLocaleString()} MT via ${sel.name} para a Netek Services. Envio o comprovativo aqui.`)} target="_blank" rel="noreferrer"
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                    📱 Enviar Comprovativo WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Transparência ── */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">🔍 Para onde vai o seu donativo?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { i: '🖥️', t: 'Servidores & Hosting', p: '40%' },
              { i: '👨‍💻', t: 'Desenvolvimento', p: '30%' },
              { i: '📚', t: 'Conteúdo & Cursos', p: '20%' },
              { i: '📢', t: 'Divulgação', p: '10%' },
            ].map((d, i) => (
              <div key={i} className="bg-slate-900/50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{d.i}</div>
                <p className="text-white font-bold">{d.p}</p>
                <p className="text-gray-500 text-xs">{d.t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Métodos resumidos no rodapé ── */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {METHODS.map(m => (
            <a
              key={m.id}
              href={m.actionUrl}
              target={m.actionType === 'paypal' ? '_blank' : undefined}
              rel={m.actionType === 'paypal' ? 'noreferrer' : undefined}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:scale-105 border-${m.color}-500/30 bg-${m.color}-500/10`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{m.name}</p>
                <p className="text-gray-400 text-xs font-mono">{m.ussd || m.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Banner de donativo reutilizável — inserir em qualquer página */
export function DonationBanner({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="bg-gradient-to-r from-pink-500/5 via-slate-900 to-purple-500/5 border-y border-pink-500/10 py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <span className="text-4xl">❤️</span>
        <div className="flex-1">
          <p className="text-white font-semibold">Este serviço é 100% gratuito para todos</p>
          <p className="text-gray-400 text-sm">Se te ajudou, considere um donativo voluntário por M-Pesa, e-Mola, M-Kesh ou PayPal.</p>
        </div>
        <div className="flex items-center gap-2">
          {METHODS.slice(0, 3).map(m => <span key={m.id} className="text-xl" title={m.name}>{m.icon}</span>)}
          <button onClick={() => { setPage('donativos'); window.scrollTo(0, 0); }}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg shadow-pink-500/20 whitespace-nowrap">
            ❤️ Apoiar
          </button>
        </div>
      </div>
    </div>
  );
}
