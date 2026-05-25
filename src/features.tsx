import { useState, useEffect, useRef, useCallback } from 'react';
import { WA, KAYAMOZ } from './data';


function wa(msg: string) { return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; }
const WAIco = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

// ═══════════════════════════════════════════════════════════
// 1. CALCULADORA DE PREÇOS / ORÇAMENTO ONLINE
// ═══════════════════════════════════════════════════════════
export function OrcamentoPage() {
  const [items, setItems] = useState([{ desc: '', qty: 1, price: 0 }]);
  const [client, setClient] = useState({ nome: '', empresa: '', email: '', tel: '', data: new Date().toLocaleDateString('pt-MZ') });
  const [showPreview, setShowPreview] = useState(false);

  const addItem = () => setItems(p => [...p, { desc: '', qty: 1, price: 0 }]);
  const updateItem = (i: number, k: keyof typeof items[0], v: string | number) =>
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const iva = subtotal * 0.17;
  const total = subtotal + iva;

  const sendWA = () => {
    const lines = items.map(i => `• ${i.desc}: ${i.qty}x ${i.price.toLocaleString()} MT = ${(i.qty * i.price).toLocaleString()} MT`).join('\n');
    const msg = `📋 ORÇAMENTO NETEK SERVICES\n\n👤 Cliente: ${client.nome}\n🏢 Empresa: ${client.empresa || '—'}\n📧 Email: ${client.email || '—'}\n📞 Tel: ${client.tel}\n📅 Data: ${client.data}\n\n📦 ITENS:\n${lines}\n\n💰 Subtotal: ${subtotal.toLocaleString()} MT\n🧾 IVA (17%): ${iva.toLocaleString()} MT\n✅ TOTAL: ${total.toLocaleString()} MT`;
    window.open(wa(msg), '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium mb-4">💰 GERADOR DE ORÇAMENTO</span>
          <h2 className="text-3xl font-bold text-white mb-2">Crie Orçamentos Profissionais</h2>
          <p className="text-gray-400">Preencha e envie directamente pelo WhatsApp</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">👤 Dados do Cliente</h3>
            <div className="space-y-3">
              {[['nome','Nome *','Seu nome'],['empresa','Empresa','Nome da empresa'],['email','Email','email@exemplo.com'],['tel','Telefone *','+258 84 000 0000'],['data','Data','']].map(([k,l,ph]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-400 mb-1">{l}</label>
                  <input value={(client as Record<string,string>)[k]} onChange={e => setClient(p => ({ ...p, [k]: e.target.value }))} placeholder={ph}
                    className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">📦 Itens do Orçamento</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {items.map((item, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Item {i + 1}</span>
                    {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 text-xs hover:text-red-300">✕</button>}
                  </div>
                  <input value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} placeholder="Descrição do serviço"
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={item.qty} min={1} onChange={e => updateItem(i, 'qty', +e.target.value)} placeholder="Qtd"
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                    <input type="number" value={item.price || ''} onChange={e => updateItem(i, 'price', +e.target.value)} placeholder="Preço (MT)"
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                  </div>
                  <div className="text-right text-cyan-400 text-xs font-semibold">{(item.qty * item.price).toLocaleString()} MT</div>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-3 w-full py-2 border-2 border-dashed border-slate-600 text-gray-400 rounded-xl text-sm hover:border-cyan-500 hover:text-cyan-400 transition-all">+ Adicionar Item</button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-gray-400 text-sm">Subtotal</p><p className="text-white font-bold text-xl">{subtotal.toLocaleString()} MT</p></div>
            <div><p className="text-gray-400 text-sm">IVA 17%</p><p className="text-yellow-400 font-bold text-xl">{iva.toFixed(0)} MT</p></div>
            <div><p className="text-gray-400 text-sm">TOTAL</p><p className="text-cyan-400 font-bold text-2xl">{total.toFixed(0)} MT</p></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all">👁️ {showPreview ? 'Ocultar' : 'Pré-visualizar'}</button>
          <button onClick={sendWA} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"><WAIco /> Enviar pelo WhatsApp</button>
        </div>

        {showPreview && (
          <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h4 className="text-white font-semibold mb-4">📋 Pré-visualização do Orçamento</h4>
            <div className="bg-white text-gray-900 rounded-xl p-6 font-sans">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div><h2 className="text-2xl font-bold text-blue-700">NETEK SERVICES</h2><p className="text-gray-500 text-sm">Soluções Digitais · Moçambique</p></div>
                <div className="text-right"><p className="font-bold text-gray-700">ORÇAMENTO</p><p className="text-gray-500 text-sm">Data: {client.data}</p></div>
              </div>
              <div className="mb-4"><p className="font-semibold text-gray-700">Para: {client.nome}</p>{client.empresa && <p className="text-gray-500 text-sm">{client.empresa}</p>}</div>
              <table className="w-full mb-4 text-sm">
                <thead><tr className="bg-blue-50"><th className="text-left p-2">Descrição</th><th className="text-center p-2">Qty</th><th className="text-right p-2">Preço</th><th className="text-right p-2">Total</th></tr></thead>
                <tbody>{items.map((item, i) => <tr key={i} className="border-b"><td className="p-2">{item.desc || '—'}</td><td className="text-center p-2">{item.qty}</td><td className="text-right p-2">{item.price.toLocaleString()} MT</td><td className="text-right p-2 font-medium">{(item.qty * item.price).toLocaleString()} MT</td></tr>)}</tbody>
              </table>
              <div className="text-right space-y-1 border-t pt-3">
                <p className="text-gray-600 text-sm">Subtotal: {subtotal.toLocaleString()} MT</p>
                <p className="text-gray-600 text-sm">IVA 17%: {iva.toFixed(0)} MT</p>
                <p className="text-xl font-bold text-blue-700">TOTAL: {total.toFixed(0)} MT</p>
              </div>
              <p className="text-center text-gray-400 text-xs mt-4 border-t pt-3">Netek Services · WhatsApp: +258 83 510 9190 · Moçambique</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. CONVERSOR DE MOEDA (MT → USD, ZAR, EUR, etc.)
// ═══════════════════════════════════════════════════════════
export function ConversoresPage() {
  const rates: Record<string, { name: string; rate: number; flag: string }> = {
    USD: { name: 'Dólar Americano', rate: 63.5, flag: '🇺🇸' },
    EUR: { name: 'Euro', rate: 69.2, flag: '🇪🇺' },
    ZAR: { name: 'Rand Sul-Africano', rate: 3.48, flag: '🇿🇦' },
    GBP: { name: 'Libra Esterlina', rate: 80.1, flag: '🇬🇧' },
    CNY: { name: 'Yuan Chinês', rate: 8.75, flag: '🇨🇳' },
    BRL: { name: 'Real Brasileiro', rate: 12.3, flag: '🇧🇷' },
  };
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState('MT');
  const currencies = ['MT', ...Object.keys(rates)];

  const convert = (to: string) => {
    if (from === 'MT') return (amount / rates[to].rate).toFixed(2);
    if (to === 'MT') return (amount * rates[from].rate).toFixed(2);
    return ((amount * rates[from].rate) / rates[to].rate).toFixed(2);
  };

  // Calculadora de salário
  const [salario, setSalario] = useState(25000);
  const inss = salario * 0.03;
  const irps = salario > 20000 ? (salario - 20000) * 0.25 + 300 : salario > 9000 ? (salario - 9000) * 0.1 : 0;
  const liquido = salario - inss - irps;

  // Calculadora de juros
  const [capital, setCapital] = useState(100000);
  const [taxa, setTaxa] = useState(18);
  const [meses, setMeses] = useState(12);
  const jurosMes = (capital * (taxa / 100)) / 12;
  const totalJuros = jurosMes * meses;
  const totalPagar = capital + totalJuros;

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium mb-4">💱 CALCULADORAS</span>
          <h2 className="text-3xl font-bold text-white mb-2">Conversores e Calculadoras Financeiras</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Moeda */}
          <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">💱 Conversor de Moeda</h3>
            <div className="flex items-center gap-3 mb-4">
              <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} className="flex-1 px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-yellow-500 focus:outline-none text-lg font-bold" />
              <select value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:outline-none">
                {currencies.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(rates).filter(([k]) => k !== from).map(([k, v]) => (
                <div key={k} className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{v.flag}</span>
                    <span className="text-white font-semibold text-sm">{k}</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{from === 'MT' || k !== 'MT' ? convert(k) : convert('MT')}</p>
                  <p className="text-gray-500 text-xs">{v.name}</p>
                  <p className="text-gray-600 text-[10px]">1 MT = {(1/v.rate).toFixed(4)} {k}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3 text-center">⚠️ Taxas aproximadas para referência. Consulte o banco.</p>
          </div>

          {/* Salário Líquido */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">💼 Calculadora de Salário</h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Salário Bruto (MT)</label>
              <input type="number" value={salario} onChange={e => setSalario(+e.target.value)} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-lg font-bold" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-900/50 rounded-xl">
                <span className="text-gray-400 text-sm">Salário Bruto</span><span className="text-white font-semibold">{salario.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-red-500/10 rounded-xl">
                <span className="text-red-400 text-sm">INSS (3%)</span><span className="text-red-400 font-semibold">-{inss.toFixed(0)} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-red-500/10 rounded-xl">
                <span className="text-red-400 text-sm">IRPS</span><span className="text-red-400 font-semibold">-{irps.toFixed(0)} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                <span className="text-green-400 font-bold">LÍQUIDO</span><span className="text-green-400 font-bold text-lg">{liquido.toFixed(0)} MT</span>
              </div>
            </div>
          </div>

          {/* Juros */}
          <div className="md:col-span-2 lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">🏦 Calculadora de Empréstimo</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><label className="block text-xs text-gray-400 mb-1">Capital (MT)</label><input type="number" value={capital} onChange={e => setCapital(+e.target.value)} className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Taxa Anual (%)</label><input type="number" value={taxa} onChange={e => setTaxa(+e.target.value)} className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Prazo (meses)</label><input type="number" value={meses} onChange={e => setMeses(+e.target.value)} className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3"><p className="text-blue-400 text-xs mb-1">Prestação/mês</p><p className="text-white font-bold text-lg">{(totalPagar/meses).toFixed(0)} MT</p></div>
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-xs mb-1">Total Juros</p><p className="text-white font-bold text-lg">{totalJuros.toFixed(0)} MT</p></div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3"><p className="text-green-400 text-xs mb-1">Total a Pagar</p><p className="text-white font-bold text-lg">{totalPagar.toFixed(0)} MT</p></div>
            </div>
          </div>

          {/* Tempo Poupança */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">🎯 Meta de Poupança</h3>
            <div className="space-y-3">
              {[['meta','Meta (MT)','500000'],['poupancaMes','Poupança/mês (MT)','5000']].map(([k,l,ph]) => {
                const [vals, setVals] = useState<Record<string,number>>({ meta: 500000, poupancaMes: 5000 });
                const mesesPara = Math.ceil(vals.meta / vals.poupancaMes);
                const anos = Math.floor(mesesPara / 12);
                const mesesR = mesesPara % 12;
                return (
                  <div key={k}>
                    <label className="block text-xs text-gray-400 mb-1">{l}</label>
                    <input type="number" defaultValue={ph} onChange={e => setVals(p => ({ ...p, [k]: +e.target.value }))} className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none" />
                    {k === 'poupancaMes' && (
                      <div className="mt-3 bg-purple-500/20 rounded-xl p-3 text-center">
                        <p className="text-purple-400 text-xs">Para atingir a meta</p>
                        <p className="text-white font-bold text-lg">{anos > 0 ? `${anos} anos e ` : ''}{mesesR} meses</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. CHAT COM IA LOCAL (sem API, respostas simuladas)
// ═══════════════════════════════════════════════════════════
type ChatMsg = { role: 'user' | 'ai'; text: string; time: string };

const aiReplies: Record<string, string> = {
  ola: 'Olá! Sou a NeIA, a inteligência artificial da Netek Services. Como posso ajudá-lo hoje?',
  oi: 'Oi! Estou aqui para ajudar. O que precisa?',
  bom: 'Bom dia/tarde/noite! Em que posso ser útil?',
  curso: 'Temos 12 cursos gratuitos em IA, Python, Marketing, Excel e muito mais! Todos com certificado após 265 horas de estudo. Que área lhe interessa?',
  ia: 'Inteligência Artificial é fascinante! Na Netek temos o curso "Introdução à IA" com 4 módulos. Também temos uma secção de ferramentas de IA gratuitas como ChatGPT, Claude e Gemini.',
  python: 'Python é a linguagem de programação mais popular! Temos um curso completo de 5 módulos cobrindo variáveis, condicionais, loops, funções e um projecto final.',
  internet: 'Oferecemos Internet Fibra Óptica a partir de 1.500 MT/mês, Internet por Rádio e soluções corporativas. Quer conhecer os planos?',
  preco: 'Nossos planos: Casa (50Mbps/1.500MT), Pro (200Mbps/3.500MT), Negócio (500Mbps/8.000MT), Enterprise (1Gbps/20.000MT).',
  whatsapp: 'Pode contactar-nos pelo WhatsApp +258 83 510 9190 para orçamentos, suporte e informações!',
  kayamoz: 'O KayaMoz é a nossa plataforma parceira para talentos! Pode publicar serviços, encontrar profissionais e conversar por chat em tempo real.',
  cv: 'Criamos CVs profissionais a partir de 500 MT! Preencha o formulário na secção "Documentos" e enviamos os dados pelo WhatsApp.',
  agendamento: 'Ajudamos com pré-agendamentos no DNIC (BI), SENAMI (passaporte), INATRO (carta de condução) e muito mais. Difícil de fazer sozinho? Resolvemos!',
  certificado: `Para obter o certificado da Netek Academy precisa de completar 265 horas de estudo, passar nos quizzes de todos os módulos e solicitar via WhatsApp.`,
  obrigado: 'De nada! Estou sempre aqui para ajudar. Há mais alguma coisa?',
  tchau: 'Até logo! Se precisar de algo, estarei aqui. Bom estudo!',
};

function getAIReply(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(aiReplies)) {
    if (lower.includes(key)) return reply;
  }
  const generics = [
    'Boa pergunta! Para mais detalhes, contacte-nos pelo WhatsApp +258 83 510 9190.',
    'Entendi! Posso ajudar com cursos, serviços de internet, documentos e talentos. O que prefere?',
    'Hmm, não tenho resposta específica para isso. Mas posso ajudar com cursos, preços, documentos ou talentos!',
    'Interessante! Para informações detalhadas, experimente perguntar sobre "cursos", "internet", "cv", "agendamento" ou "kayamoz".',
  ];
  return generics[Math.floor(Math.random() * generics.length)];
}

export function ChatIAPage() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'ai', text: 'Olá! 👋 Sou a NeIA, assistente da Netek Services. Posso ajudar com cursos, serviços, preços, documentos e muito mais. O que precisa?', time: new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMsg = { role: 'user', text: input.trim(), time };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const aiText = getAIReply(input);
      setMsgs(p => [...p, { role: 'ai', text: aiText, time }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  }, [input]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const suggestions = ['Que cursos têm?', 'Preço da internet', 'Como criar CV?', 'O que é KayaMoz?', 'Certificado 265h', 'Agendamento BI'];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4">🤖 NEIA – ASSISTENTE IA</span>
          <h2 className="text-3xl font-bold text-white mb-2">Chat com a NeIA</h2>
          <p className="text-gray-400">A inteligência artificial da Netek Services</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-b border-slate-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">N</div>
            <div className="flex-1">
              <p className="text-white font-semibold">NeIA – Netek Inteligência Artificial</p>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-green-400 text-xs">Online</span></div>
            </div>
            <a href={wa('Olá! Prefiro continuar a conversa por WhatsApp.')} target="_blank" rel="noreferrer" className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all flex items-center gap-1"><WAIco /> WhatsApp</a>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 text-sm mr-2 shrink-0">N</div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">{m.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 text-sm mr-2 shrink-0">N</div>
                <div className="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div className="border-t border-slate-700 p-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); }} className="px-3 py-1.5 bg-slate-700 text-gray-300 rounded-full text-xs hover:bg-violet-500/20 hover:text-violet-400 transition-all">{s}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="Escreva a sua mensagem..." className="flex-1 px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-violet-500 focus:outline-none text-sm" />
              <button onClick={send} className="px-5 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-cyan-600 transition-all">Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. CONTADOR POMODORO / TIMER DE ESTUDO
// ═══════════════════════════════════════════════════════════
export function PomodoroPage() {
  const [mins, setMins] = useState(25);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
  const [sessions, setSessions] = useState(0);
  const [totalStudied, setTotalStudied] = useState(0);
  const [tasks, setTasks] = useState<{ text: string; done: boolean }[]>([]);
  const [newTask, setNewTask] = useState('');

  const modes = { work: { mins: 25, label: '🍅 Foco', color: 'from-red-500 to-orange-500' }, short: { mins: 5, label: '☕ Pausa Curta', color: 'from-green-500 to-teal-500' }, long: { mins: 15, label: '🌿 Pausa Longa', color: 'from-blue-500 to-indigo-500' } };

  useEffect(() => {
    let interval: number;
    if (running) {
      interval = window.setInterval(() => {
        setSecs(s => {
          if (s === 0) {
            setMins(m => {
              if (m === 0) {
                setRunning(false);
                if (mode === 'work') { setSessions(ss => ss + 1); setTotalStudied(t => t + modes.work.mins); }
                return modes[mode].mins;
              }
              return m - 1;
            });
            return 59;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, mode]);

  const switchMode = (m: typeof mode) => { setMode(m); setMins(modes[m].mins); setSecs(0); setRunning(false); };
  const reset = () => { setMins(modes[mode].mins); setSecs(0); setRunning(false); };
  const progress = ((modes[mode].mins * 60 - (mins * 60 + secs)) / (modes[mode].mins * 60)) * 100;

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium mb-4">🍅 POMODORO TIMER</span>
          <h2 className="text-3xl font-bold text-white mb-2">Timer de Estudo</h2>
          <p className="text-gray-400">Estude com foco e pausa estratégica</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timer */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex gap-2 mb-6">
              {(Object.entries(modes) as [typeof mode, typeof modes[typeof mode]][]).map(([k, v]) => (
                <button key={k} onClick={() => switchMode(k)} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${mode === k ? `bg-gradient-to-r ${v.color} text-white` : 'bg-slate-700 text-gray-400'}`}>{v.label}</button>
              ))}
            </div>
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#334155" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 54}`} strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`} className="transition-all duration-1000" />
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
              </svg>
              <div className="absolute text-center">
                <p className="text-5xl font-bold text-white tabular-nums">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</p>
                <p className="text-gray-400 text-sm mt-1">{modes[mode].label}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRunning(!running)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${running ? 'bg-slate-600 text-white' : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'}`}>{running ? '⏸ Pausar' : '▶️ Iniciar'}</button>
              <button onClick={reset} className="px-5 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all">↺</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-slate-900/50 rounded-xl p-3"><div className="text-2xl font-bold text-red-400">{sessions}</div><div className="text-xs text-gray-400">Sessões</div></div>
              <div className="bg-slate-900/50 rounded-xl p-3"><div className="text-2xl font-bold text-cyan-400">{totalStudied}m</div><div className="text-xs text-gray-400">Estudado</div></div>
              <div className="bg-slate-900/50 rounded-xl p-3"><div className="text-2xl font-bold text-green-400">{Math.floor(totalStudied/60)}h</div><div className="text-xs text-gray-400">Horas</div></div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">📋 Lista de Tarefas de Estudo</h3>
            <div className="flex gap-2 mb-4">
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyPress={e => e.key === 'Enter' && newTask.trim() && (setTasks(p => [...p, { text: newTask.trim(), done: false }]), setNewTask(''))} placeholder="Adicionar tarefa..." className="flex-1 px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none text-sm" />
              <button onClick={() => { if (newTask.trim()) { setTasks(p => [...p, { text: newTask.trim(), done: false }]); setNewTask(''); } }} className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">+</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm">Adicione tarefas para organizar o estudo</p>
                </div>
              ) : tasks.map((t, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${t.done ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-900/50 border border-slate-700'}`}>
                  <button onClick={() => setTasks(p => p.map((task, idx) => idx === i ? { ...task, done: !task.done } : task))}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${t.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600'}`}>
                    {t.done && <span className="text-xs">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-500' : 'text-white'}`}>{t.text}</span>
                  <button onClick={() => setTasks(p => p.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
                </div>
              ))}
            </div>
            {tasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-gray-400 text-sm">{tasks.filter(t => t.done).length}/{tasks.length} concluídas</span>
                <div className="w-32 bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(tasks.filter(t=>t.done).length/tasks.length)*100}%` }} /></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. GERADOR DE QR CODE
// ═══════════════════════════════════════════════════════════
export function QRCodePage() {
  const [text, setText] = useState(`https://wa.me/${WA}`);
  const [type, setType] = useState('whatsapp');
  const [qrSize, setQrSize] = useState(200);

  const types = [
    { id: 'whatsapp', label: '💬 WhatsApp', value: `https://wa.me/${WA}` },
    { id: 'url', label: '🌐 URL', value: 'https://netek.co.mz' },
    { id: 'text', label: '📝 Texto', value: 'Netek Services Moçambique' },
    { id: 'email', label: '📧 Email', value: 'mailto:netek@email.co.mz' },
    { id: 'tel', label: '📞 Telefone', value: `tel:+${WA}` },
  ];

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(text)}&bgcolor=0a1525&color=67e8f9&margin=10`;

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">📱 GERADOR QR CODE</span>
          <h2 className="text-3xl font-bold text-white mb-2">Gerar QR Code</h2>
          <p className="text-gray-400">Crie QR codes para WhatsApp, links, emails e mais</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Configurar QR Code</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {types.map(t => (
                <button key={t.id} onClick={() => { setType(t.id); setText(t.value); }} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${type === t.id ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}>{t.label}</button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Conteúdo</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm resize-none" />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Tamanho: {qrSize}px</label>
              <input type="range" min={100} max={400} step={50} value={qrSize} onChange={e => setQrSize(+e.target.value)} className="w-full accent-green-500" />
            </div>
            <a href={wa(`Olá! Gerei um QR Code pela Netek Services para: ${text}`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all"><WAIco /> Partilhar via WhatsApp</a>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="bg-[#0a1525] rounded-2xl p-4 mb-4 border border-slate-700">
              <img src={qrUrl} alt="QR Code" className="rounded-xl" style={{ width: Math.min(qrSize, 200), height: Math.min(qrSize, 200) }} onError={e => { (e.target as HTMLImageElement).src = ''; }} />
            </div>
            <p className="text-gray-400 text-sm text-center mb-4">Aponte a câmara para escanear</p>
            <a href={qrUrl} download="qrcode-netek.png" target="_blank" rel="noreferrer" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">⬇️ Descarregar QR Code</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. GLOSSÁRIO TECH EM PORTUGUÊS DE MOÇAMBIQUE
// ═══════════════════════════════════════════════════════════
export function GlossarioPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');
  const terms = [
    { t:'IA', d:'Inteligência Artificial – tecnologia que permite às máquinas aprender e tomar decisões.', c:'IA', ex:'ChatGPT usa IA para responder perguntas.' },
    { t:'Machine Learning', d:'Aprendizado de Máquina – sistemas que aprendem com dados sem serem explicitamente programados.', c:'IA', ex:'O M-Pesa usa ML para detectar fraudes.' },
    { t:'Cloud', d:'Nuvem – servidores remotos para guardar e processar dados pela internet.', c:'Internet', ex:'Google Drive é cloud storage.' },
    { t:'Firewall', d:'Barreira de segurança que controla o tráfego de rede.', c:'Segurança', ex:'Um firewall bloqueia ataques externos.' },
    { t:'API', d:'Interface de Programação – conjunto de regras para aplicações comunicarem entre si.', c:'Dev', ex:'WhatsApp tem uma API para negócios.' },
    { t:'Phishing', d:'Fraude online que imita entidades legítimas para roubar dados.', c:'Segurança', ex:'Um email falso do banco pedindo senha.' },
    { t:'Bandwidth', d:'Largura de banda – quantidade de dados transmitidos por segundo.', c:'Internet', ex:'Internet de 100Mbps tem mais bandwidth.' },
    { t:'Latência', d:'Tempo que um pacote de dados demora a chegar ao destino.', c:'Internet', ex:'Latência alta causa lag nos jogos.' },
    { t:'VPN', d:'Rede Virtual Privada – criptografa a conexão e esconde o endereço IP.', c:'Segurança', ex:'Use VPN em redes Wi-Fi públicas.' },
    { t:'SEO', d:'Otimização para Motores de Busca – técnicas para aparecer no Google.', c:'Marketing', ex:'Bom SEO aumenta visitas gratuitas.' },
    { t:'Algoritmo', d:'Conjunto de instruções para resolver um problema passo a passo.', c:'Dev', ex:'O algoritmo do Facebook decide o que ver.' },
    { t:'Hosting', d:'Hospedagem – servidor que guarda e serve o seu site na internet.', c:'Internet', ex:'A Netek oferece hosting a preços acessíveis.' },
    { t:'SSL', d:'Protocolo de segurança que criptografa dados entre browser e servidor.', c:'Segurança', ex:'Sites com HTTPS têm SSL activo.' },
    { t:'Cache', d:'Dados guardados temporariamente para acesso mais rápido.', c:'Dev', ex:'Limpar cache pode resolver problemas no browser.' },
    { t:'Chatbot', d:'Programa automatizado que simula conversas com humanos.', c:'IA', ex:'A NeIA é um chatbot da Netek.' },
    { t:'ROI', d:'Retorno sobre Investimento – lucro dividido pelo custo do investimento.', c:'Negócios', ex:'Campanha de 500MT gerou 5.000MT = ROI de 900%.' },
    { t:'Pixel', d:'Menor unidade de uma imagem digital.', c:'Design', ex:'Uma foto HD tem milhões de pixels.' },
    { t:'Domínio', d:'Endereço de um site na internet (ex: netek.co.mz).', c:'Internet', ex:'Registar um domínio .co.mz custa cerca de 1.200MT/ano.' },
    { t:'Responsive', d:'Design que se adapta a diferentes tamanhos de ecrã.', c:'Dev', ex:'Sites responsive funcionam bem no telemóvel.' },
    { t:'Git', d:'Sistema de controlo de versões para código.', c:'Dev', ex:'GitHub usa Git para guardar projectos.' },
    { t:'Startup', d:'Empresa jovem com alto potencial de crescimento.', c:'Negócios', ex:'Kayamoz é uma startup moçambicana.' },
    { t:'MVP', d:'Mínimo Produto Viável – versão básica de um produto para testar.', c:'Negócios', ex:'Lance o MVP antes de investir muito.' },
  ];
  const cats = ['Todos', ...new Set(terms.map(t => t.c))];
  const filtered = terms.filter(t => {
    const matchCat = cat === 'Todos' || t.c === cat;
    const matchSearch = !search || t.t.toLowerCase().includes(search.toLowerCase()) || t.d.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4">📖 GLOSSÁRIO TECH</span>
          <h2 className="text-3xl font-bold text-white mb-2">Dicionário de Tecnologia</h2>
          <p className="text-gray-400">Termos técnicos explicados em português simples</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Pesquisar termo..." className="flex-1 px-5 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none" />
          <div className="flex flex-wrap gap-2">
            {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${cat === c ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}>{c}</button>)}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-white font-bold text-lg">{t.t}</h3>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full shrink-0">{t.c}</span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{t.d}</p>
              <p className="text-gray-500 text-xs italic">💡 Ex: {t.ex}</p>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">🔍</p><p>Nenhum termo encontrado para "{search}"</p></div>}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. GERADOR DE SENHA SEGURA
// ═══════════════════════════════════════════════════════════
export function SenhasPage() {
  const [len, setLen] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState(0);

  const generate = useCallback(() => {
    const sets = [
      opts.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
      opts.lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
      opts.numbers ? '0123456789' : '',
      opts.symbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
    ].filter(Boolean).join('');
    if (!sets) { setPassword('Seleccione pelo menos uma opção'); return; }
    let pw = '';
    for (let i = 0; i < len; i++) pw += sets[Math.floor(Math.random() * sets.length)];
    setPassword(pw);
    const s = [opts.upper, opts.lower, opts.numbers, opts.symbols].filter(Boolean).length;
    setStrength(len >= 16 && s === 4 ? 4 : len >= 12 && s >= 3 ? 3 : len >= 8 && s >= 2 ? 2 : 1);
  }, [len, opts]);

  useEffect(() => { generate(); }, [generate]);

  const copy = () => { navigator.clipboard?.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const strengthInfo = [null, { label: 'Muito Fraca', color: 'bg-red-500', w: 'w-1/4' }, { label: 'Fraca', color: 'bg-orange-500', w: 'w-2/4' }, { label: 'Boa', color: 'bg-yellow-500', w: 'w-3/4' }, { label: 'Forte', color: 'bg-green-500', w: 'w-full' }];
  const si = strengthInfo[strength];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">🔐 SEGURANÇA</span>
          <h2 className="text-3xl font-bold text-white mb-2">Gerador de Senhas Seguras</h2>
          <p className="text-gray-400">Crie senhas fortes para proteger as suas contas</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="bg-slate-900 rounded-xl p-4 mb-4 flex items-center gap-3">
            <p className="flex-1 text-white font-mono text-lg break-all">{password}</p>
            <button onClick={copy} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>{copied ? '✅' : '📋'}</button>
          </div>
          {si && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Força</span><span className={`font-semibold ${si.color.replace('bg-','text-')}`}>{si.label}</span></div>
              <div className="w-full bg-slate-700 rounded-full h-2"><div className={`h-2 rounded-full transition-all ${si.color} ${si.w}`} /></div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Comprimento: <span className="text-white font-bold">{len} caracteres</span></label>
            <input type="range" min={8} max={32} value={len} onChange={e => setLen(+e.target.value)} className="w-full accent-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['upper','Maiúsculas (A-Z)'],['lower','Minúsculas (a-z)'],['numbers','Números (0-9)'],['symbols','Símbolos (!@#$)']].map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(opts as Record<string,boolean>)[k]} onChange={e => setOpts(p => ({ ...p, [k]: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                <span className="text-gray-300 text-sm">{l}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={generate} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all">🔄 Gerar Nova</button>
            <button onClick={copy} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>{copied ? '✅ Copiado!' : '📋 Copiar'}</button>
          </div>
        </div>
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">🛡️ Dicas de Segurança</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {['Use senhas diferentes para cada conta','Active autenticação 2 factores (2FA) sempre que possível','Nunca partilhe senhas pelo WhatsApp ou SMS','Use um gestor de senhas como Google Password Manager','Evite usar dados pessoais (nome, data nascimento) nas senhas'].map((d,i) => <li key={i} className="flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span>{d}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. PORTFÓLIO / SHOWCASE MOÇAMBIQUE
// ═══════════════════════════════════════════════════════════
export function ShowcasePage({ setPage: _setPage }: { setPage: (p: string) => void }) {
  const projects = [
    { n:'KayaMoz', d:'Plataforma de talentos e mercado de trabalho local.', t:'Marketplace', i:'🔍', url:KAYAMOZ, stack:['React','Firebase','Tailwind'], c:'purple' },
    { n:'SonhaMZ', d:'IA moçambicana que lê sonhos e conversa por voz.', t:'IA', i:'🌙', url:'#', stack:['React','WebSpeech API'], c:'indigo' },
    { n:'ManoMZ', d:'Máquina de conversa com tom moçambicano e voz masculina.', t:'IA', i:'🎤', url:'#', stack:['React','SpeechSynthesis'], c:'slate' },
    { n:'Netek Services', d:'Plataforma completa de serviços digitais para Moçambique.', t:'Plataforma', i:'🌐', url:'#', stack:['React','TypeScript','Tailwind'], c:'cyan' },
  ];
  const stats = [{ v:'4+', l:'Projectos' }, { v:'12', l:'Cursos criados' }, { v:'100+', l:'Utilizadores' }, { v:'MZ', l:'Foco local' }];
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium mb-4">🇲🇿 SHOWCASE</span>
          <h2 className="text-4xl font-bold text-white mb-4">Projectos Moçambicanos</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Soluções digitais criadas especificamente para o mercado moçambicano.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s,i) => <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-cyan-400">{s.v}</div><div className="text-gray-400 text-sm">{s.l}</div></div>)}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {projects.map((p,i) => (
            <div key={i} className={`bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-${p.c}-500/50 hover:-translate-y-1 transition-all`}>
              <div className={`bg-gradient-to-r from-${p.c}-500/20 to-${p.c}-700/20 p-6 flex items-center gap-4`}>
                <span className="text-5xl">{p.i}</span>
                <div>
                  <div className="flex items-center gap-2"><h3 className="text-white font-bold text-xl">{p.n}</h3><span className={`px-2 py-0.5 bg-${p.c}-500/20 text-${p.c}-400 text-xs rounded-full`}>{p.t}</span></div>
                  <p className="text-gray-400 text-sm mt-1">{p.d}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">{p.stack.map((s,j) => <span key={j} className="px-2 py-1 bg-slate-900/50 text-gray-400 rounded-lg text-xs">{s}</span>)}</div>
                <div className="flex gap-2">
                  {p.url !== '#' && <a href={p.url} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl text-xs font-medium text-center hover:bg-cyan-500/30 transition-all">🚀 Abrir Projecto</a>}
                  <a href={wa(`Olá! Tenho interesse no projecto ${p.n}.`)} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-medium text-center hover:bg-green-500/30 transition-all">📱 Saber Mais</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Tem um projecto para Moçambique?</h3>
          <p className="text-gray-400 mb-6">A Netek pode ajudar a desenvolver, hospedar e divulgar a sua solução digital.</p>
          <a href={wa('Olá! Tenho uma ideia de projecto digital para Moçambique e quero discutir com a Netek.')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"><WAIco /> Falar Connosco</a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 9. FORMULÁRIO DE EMPREGO / CANDIDATURA
// ═══════════════════════════════════════════════════════════
export function EmpregoPage() {
  const [tab, setTab] = useState<'buscar' | 'publicar' | 'candidatura'>('buscar');
  const vagas = [
    { id:1, cargo:'Técnico Informática', emp:'Tech Lda', local:'Maputo', tipo:'Integral', salario:'15.000-25.000 MT', req:'Conhecimentos de redes e suporte técnico', date:'20 Jan 2025' },
    { id:2, cargo:'Designer Gráfico', emp:'Agência Criativa', local:'Maputo', tipo:'Freelance', salario:'Negociável', req:'Portfolio e conhecimento de Adobe', date:'19 Jan 2025' },
    { id:3, cargo:'Programador Python', emp:'Fintech Startup', local:'Remoto', tipo:'Integral', salario:'35.000-60.000 MT', req:'Python, Django e APIs', date:'18 Jan 2025' },
    { id:4, cargo:'Gestor de Redes Sociais', emp:'PME Consultoria', local:'Matola', tipo:'Part-time', salario:'8.000-12.000 MT', req:'Experiência em marketing digital', date:'17 Jan 2025' },
    { id:5, cargo:'Professor de Informática', emp:'Instituto Privado', local:'Beira', tipo:'Integral', salario:'20.000-30.000 MT', req:'Licenciatura e experiência docente', date:'16 Jan 2025' },
    { id:6, cargo:'Analista de Dados', emp:'Banco Moçambique', local:'Maputo', tipo:'Integral', salario:'45.000-70.000 MT', req:'Python, SQL, Excel avançado', date:'15 Jan 2025' },
  ];
  const [form, setForm] = useState({ nome:'',email:'',tel:'',local:'',cargo:'',experiencia:'',habilidades:'',linkedin:'',disponibilidade:'' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const sendCandidatura = () => {
    const msg = `💼 CANDIDATURA DE EMPREGO\n\n👤 Nome: ${form.nome}\n📧 Email: ${form.email}\n📞 Tel: ${form.tel}\n📍 Local: ${form.local}\n🎯 Cargo desejado: ${form.cargo}\n💼 Experiência: ${form.experiencia}\n🛠️ Habilidades: ${form.habilidades}\n🔗 LinkedIn: ${form.linkedin || '—'}\n📅 Disponibilidade: ${form.disponibilidade}`;
    window.open(wa(msg), '_blank');
  };
  return (
    <section className="py-20 bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-4">💼 EMPREGO</span>
          <h2 className="text-3xl font-bold text-white mb-2">Vagas e Candidaturas</h2>
          <p className="text-gray-400">Encontre emprego ou candidate-se directamente</p>
        </div>
        <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl">
          {[{id:'buscar' as const,i:'🔍',l:'Ver Vagas'},{id:'publicar' as const,i:'📢',l:'Publicar Vaga'},{id:'candidatura' as const,i:'📋',l:'Candidatura'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${tab===t.id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'text-gray-400 hover:text-white'}`}>{t.i} {t.l}</button>
          ))}
        </div>
        {tab === 'buscar' && (
          <div className="grid md:grid-cols-2 gap-4">
            {vagas.map(v => (
              <div key={v.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div><h3 className="text-white font-semibold">{v.cargo}</h3><p className="text-blue-400 text-sm">{v.emp}</p></div>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full whitespace-nowrap">{v.tipo}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                  <span>📍 {v.local}</span><span>💰 {v.salario}</span><span>📅 {v.date}</span>
                </div>
                <p className="text-gray-400 text-xs mb-4">📋 {v.req}</p>
                <div className="flex gap-2">
                  <a href={wa(`Olá! Tenho interesse na vaga de ${v.cargo} na ${v.emp}. Vi no Netek Services.`)} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-xs font-medium text-center hover:bg-blue-500/30 transition-all">Candidatar-me</a>
                  <a href="https://emprego.inep.gov.mz/public/home" target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-700 text-gray-400 rounded-xl text-xs hover:bg-slate-600 transition-all">INEP</a>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'publicar' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Publicar Vaga de Emprego</h3>
            <p className="text-gray-400 text-sm mb-6">Preencha os dados e enviamos a vaga para a nossa lista de candidatos.</p>
            <div className="space-y-3 mb-4">
              {[['cargo','Cargo/Função *','Ex: Técnico Informática'],['emp','Empresa *','Nome da empresa'],['local','Localização *','Ex: Maputo, Matola'],['tipo','Tipo de emprego','Integral, Part-time, Freelance'],['salario','Salário (MT)','Ex: 20.000-30.000 MT'],['req','Requisitos *','Experiência, formação, habilidades']].map(([k,l,ph]) => (
                <div key={k}><label className="block text-xs text-gray-400 mb-1">{l}</label><input placeholder={ph} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm" /></div>
              ))}
            </div>
            <a href={wa('Olá! Quero publicar uma vaga de emprego. Cargo: [função]. Empresa: [nome]. Local: [localização]. Salário: [valor]. Requisitos: [detalhes].')} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold"><WAIco /> Enviar Vaga</a>
          </div>
        )}
        {tab === 'candidatura' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">📋 Formulário de Candidatura</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[['nome','Nome completo *'],['email','Email *'],['tel','Telefone *'],['local','Localização *'],['cargo','Cargo desejado *'],['disponibilidade','Disponibilidade *']].map(([k,l]) => (
                <div key={k}><label className="block text-xs text-gray-400 mb-1">{l}</label><input value={(form as Record<string,string>)[k]} onChange={e => set(k,e.target.value)} className="w-full px-3 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm" /></div>
              ))}
            </div>
            <div className="space-y-3 mb-4">
              <div><label className="block text-xs text-gray-400 mb-1">Experiência Profissional *</label><textarea value={form.experiencia} onChange={e => set('experiencia',e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm resize-none" placeholder="Descreva a sua experiência..." /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Habilidades *</label><textarea value={form.habilidades} onChange={e => set('habilidades',e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm resize-none" placeholder="Python, Excel, Design..." /></div>
            </div>
            <button onClick={sendCandidatura} className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"><WAIco /> Enviar Candidatura</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 10. SIMULADORES DE PC E TELEMÓVEL (placeholder melhorado)
// ═══════════════════════════════════════════════════════════
export function SimuladoresPage() {
  const [active, setActive] = useState<'pc'|'phone'>('pc');
  const [pcApp, setPcApp] = useState<string|null>(null);
  const [note, setNote] = useState('');
  const [calc, setCalc] = useState('');
  const [phoneApp, setPhoneApp] = useState<string|null>(null);
  const [msgs, setMsgs] = useState<{from:string;text:string}[]>([]);
  const [waMsgInput, setWaMsgInput] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const t = () => setCurrentTime(new Date().toLocaleTimeString('pt-MZ',{hour:'2-digit',minute:'2-digit'}));
    t(); const i = setInterval(t, 30000);
    return () => clearInterval(i);
  }, []);

  const calcPress = (v: string) => {
    if (v === '=') {
      try {
        const expr = calc.replace(/×/g,'*').replace(/÷/g,'/');
        const safe = expr.replace(/[^0-9+\-*/.()]/g,'');
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + safe)();
        setCalc(String(result));
      } catch { setCalc('Erro'); }
    }
    else if (v === 'C') setCalc('');
    else setCalc(c => c + v);
  };

  const sendWAMsg = () => {
    if (!waMsgInput.trim()) return;
    setMsgs(p => [...p, {from:'Eu',text:waMsgInput}]);
    setWaMsgInput('');
    setTimeout(() => setMsgs(p => [...p, {from:'Mãe',text:['Ok filho!','Sim, recebi!','Boa ideia!','👍','Tá bem!'][Math.floor(Math.random()*5)]}]), 1200);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium mb-4">🖥️ SIMULADORES INTERACTIVOS</span>
          <h2 className="text-3xl font-bold text-white mb-2">Simuladores de Computador e Telemóvel</h2>
          <p className="text-gray-400">Aprenda a usar tecnologia com simuladores reais</p>
        </div>
        <div className="flex gap-3 mb-8 justify-center">
          {[{id:'pc' as const,i:'🖥️',l:'Computador Windows'},{id:'phone' as const,i:'📱',l:'Telemóvel Android'}].map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`px-6 py-3 rounded-xl font-medium transition-all ${active===t.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'bg-slate-800 text-gray-400 border border-slate-700'}`}>{t.i} {t.l}</button>
          ))}
        </div>

        {active === 'pc' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-t-2xl p-2 border-2 border-gray-700">
              {/* Title Bar */}
              {pcApp && (
                <div className="bg-slate-700 flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg">
                  <span className="text-white text-xs">{pcApp}</span>
                  <button onClick={() => setPcApp(null)} className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs flex items-center justify-center">✕</button>
                </div>
              )}
              {/* Screen */}
              <div className="bg-gradient-to-b from-blue-800 to-blue-900 rounded-xl overflow-hidden" style={{height:'360px'}}>
                {!pcApp ? (
                  <div className="h-full p-4">
                    <div className="text-white text-xs mb-4 text-right">{currentTime}</div>
                    <div className="grid grid-cols-4 gap-3">
                      {[{i:'📁',l:'Documentos',a:'docs'},{i:'🌐',l:'Chrome',a:'chrome'},{i:'📝',l:'Notepad',a:'notepad'},{i:'🔢',l:'Calc',a:'calc'},{i:'📊',l:'Excel',a:'excel'},{i:'🎨',l:'Paint',a:'paint'},{i:'⚙️',l:'Config',a:'config'},{i:'📧',l:'Email',a:'email'}].map(ap => (
                        <button key={ap.a} onDoubleClick={() => setPcApp(ap.l)} className="flex flex-col items-center gap-1 hover:bg-white/10 p-2 rounded-lg transition-all">
                          <span className="text-3xl">{ap.i}</span><span className="text-white text-[9px]">{ap.l}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-white/50 text-[10px] text-center mt-4">Dê duplo-clique para abrir os apps</p>
                  </div>
                ) : pcApp === 'Notepad' ? (
                  <div className="h-full flex flex-col bg-white">
                    <div className="bg-gray-200 px-3 py-1 text-[10px] text-gray-600 flex gap-3 border-b"><span>Ficheiro</span><span>Editar</span><span>Ver</span></div>
                    <textarea value={note} onChange={e => setNote(e.target.value)} className="flex-1 p-3 text-sm text-gray-800 resize-none focus:outline-none font-mono" placeholder="Escreva aqui..." />
                    <div className="bg-gray-100 px-3 py-0.5 text-[9px] text-gray-500 border-t">{note.length} caracteres · {note.split('\n').length} linhas</div>
                  </div>
                ) : pcApp === 'Calc' ? (
                  <div className="h-full flex flex-col bg-slate-900 p-4">
                    <div className="bg-slate-800 rounded-xl p-3 mb-3 text-right"><span className="text-white text-3xl font-light">{calc || '0'}</span></div>
                    <div className="grid grid-cols-4 gap-2 flex-1">
                      {['C','±','%','÷','7','8','9','×','4','5','6','-','1','2','3','+','0','.','='].map(v => (
                        <button key={v} onClick={() => calcPress(v)} className={`rounded-xl text-lg font-medium transition-all active:scale-95 ${v==='C' ? 'bg-gray-500 text-white' : ['÷','×','-','+','='].includes(v) ? 'bg-orange-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} ${v==='0' ? 'col-span-2' : ''}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                ) : pcApp === 'Chrome' ? (
                  <div className="h-full flex flex-col bg-white">
                    <div className="bg-gray-100 p-2 flex items-center gap-2 border-b">
                      <div className="flex gap-1 text-gray-400 text-xs"><span>←</span><span>→</span><span>↻</span></div>
                      <div className="flex-1 bg-white rounded-full px-3 py-1 text-xs border text-gray-500">🔒 google.com</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="text-6xl font-bold text-blue-600 mb-2">G<span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-600">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span></div>
                      <div className="w-64 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-400 flex items-center gap-2"><span>🔍</span><span>Pesquisar...</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-white">
                    <span className="text-5xl mb-3">🚀</span>
                    <p className="font-semibold">{pcApp}</p>
                    <p className="text-white/50 text-sm mt-1">App em desenvolvimento</p>
                    <button onClick={() => setPcApp(null)} className="mt-4 px-4 py-2 bg-blue-500 rounded-xl text-sm">Fechar</button>
                  </div>
                )}
              </div>
            </div>
            {/* Taskbar */}
            <div className="bg-slate-800 rounded-b-2xl border-2 border-t-0 border-gray-700 flex items-center px-3 py-2 gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:bg-blue-600 transition-all" onClick={() => setPcApp(null)}>⊞</div>
              {pcApp && <div className="px-3 py-1 bg-white/10 rounded-lg text-white text-xs">{pcApp}</div>}
              <div className="ml-auto text-white text-xs">{currentTime}</div>
            </div>
          </div>
        )}

        {active === 'phone' && (
          <div className="mx-auto" style={{width:'280px'}}>
            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border border-gray-700">
              <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
                <div className="bg-black text-white flex items-center justify-between px-5 py-1.5 text-xs">
                  <span>{currentTime}</span>
                  <span>📶 🔋78%</span>
                </div>
                <div style={{height:'450px'}} className="bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
                  {!phoneApp ? (
                    <div className="p-4">
                      <div className="text-white text-4xl font-light text-center mt-4 mb-2">{currentTime}</div>
                      <p className="text-gray-400 text-xs text-center mb-6">{new Date().toLocaleDateString('pt-MZ',{weekday:'long',day:'numeric',month:'long'})}</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[{i:'💬',l:'WhatsApp',a:'whatsapp',c:'from-green-500 to-green-600'},{i:'📞',l:'Telefone',a:'phone',c:'from-green-400 to-green-500'},{i:'📷',l:'Câmera',a:'camera',c:'from-gray-600 to-gray-700'},{i:'🌐',l:'Chrome',a:'browser',c:'from-blue-500 to-red-500'},{i:'📧',l:'Gmail',a:'gmail',c:'from-red-500 to-red-600'},{i:'🗺️',l:'Mapas',a:'maps',c:'from-green-500 to-green-700'},{i:'🔢',l:'Calc',a:'pcalc',c:'from-slate-600 to-slate-700'},{i:'⚙️',l:'Config',a:'pconfig',c:'from-gray-500 to-gray-600'}].map(ap => (
                          <button key={ap.a} onClick={() => setPhoneApp(ap.a)} className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 bg-gradient-to-br ${ap.c} rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform`}>{ap.i}</div>
                            <span className="text-[9px] text-gray-300">{ap.l}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : phoneApp === 'whatsapp' ? (
                    <div className="flex flex-col h-full bg-slate-900">
                      <div className="bg-green-700 px-3 py-2.5 flex items-center gap-2">
                        <button onClick={() => setPhoneApp(null)} className="text-white text-sm">←</button>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm">M</div>
                        <div><p className="text-white text-sm font-medium">Mãe</p><p className="text-green-200 text-[10px]">online</p></div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%23ffffff08\'/%3E%3C/svg%3E")'}}>
                        {msgs.length === 0 && <p className="text-center text-gray-500 text-xs mt-8">Envie uma mensagem para a Mãe! 😊</p>}
                        {msgs.map((m,i) => (
                          <div key={i} className={`flex ${m.from==='Eu' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs ${m.from==='Eu' ? 'bg-green-600 text-white rounded-br-none' : 'bg-slate-700 text-white rounded-bl-none'}`}>{m.text}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 flex gap-2 bg-slate-800">
                        <input value={waMsgInput} onChange={e => setWaMsgInput(e.target.value)} onKeyPress={e => e.key==='Enter' && sendWAMsg()} placeholder="Mensagem..." className="flex-1 px-3 py-2 bg-slate-700 text-white text-xs rounded-full focus:outline-none" />
                        <button onClick={sendWAMsg} className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">📤</button>
                      </div>
                    </div>
                  ) : phoneApp === 'pcalc' ? (
                    <div className="flex flex-col h-full bg-black p-3">
                      <div className="flex-1 flex items-end justify-end mb-2"><span className="text-white text-4xl font-light">{calc || '0'}</span></div>
                      <div className="grid grid-cols-4 gap-1">
                        {['C','±','%','÷','7','8','9','×','4','5','6','-','1','2','3','+','0','.','='].map(v => (
                          <button key={v} onClick={() => calcPress(v)} className={`py-3 rounded-full text-base font-medium active:scale-95 transition-transform ${v==='C' ? 'bg-gray-500 text-black' : ['÷','×','-','+','='].includes(v) ? 'bg-orange-500 text-white' : 'bg-gray-700 text-white'} ${v==='0' ? 'col-span-2' : ''}`}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-white">
                      <div className="text-5xl mb-3">{phoneApp === 'camera' ? '📷' : phoneApp === 'gmail' ? '📧' : phoneApp === 'maps' ? '🗺️' : phoneApp === 'browser' ? '🌐' : '📱'}</div>
                      <p className="font-semibold capitalize">{phoneApp}</p>
                      <p className="text-white/50 text-xs mt-1">App simulado</p>
                      <button onClick={() => setPhoneApp(null)} className="mt-4 px-4 py-2 bg-green-500 rounded-xl text-sm">Voltar</button>
                    </div>
                  )}
                </div>
                <div className="bg-black py-1.5 flex justify-center">
                  <button onClick={() => setPhoneApp(null)} className="w-24 h-1 bg-gray-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export { WAIco, wa };
