import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  where,
} from 'firebase/firestore';
import { type User as FBUser } from 'firebase/auth';
import { firestore } from './firebase';
import { WA_BUSINESS, WA_GROUP_LINK } from './data';
import { FirebaseLoginPage } from './FirebaseFeatures';

/* ─── tipos ─────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  emoji: string;
  sellerName: string;
  sellerPhone: string;
  sellerId: string;
  views: number;
  likes: number;
  sold: boolean;
  featured: boolean;
  createdAt: unknown;
}

interface CartItem extends Product { qty: number; }

/* ─── helpers ───────────────────────────────────────────── */
const BUSINESS = WA_BUSINESS;           // +258 840 166 592
const GROUP    = WA_GROUP_LINK;         // link convite WhatsApp

function waMsg(phone: string, msg: string) {
  return `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
}

function buildSellMsg(product: Product) {
  return (
    `🛍️ *INTERESSE EM PRODUTO – Netek Marketplace*\n\n` +
    `📦 Produto: ${product.name}\n` +
    `💰 Preço: ${product.price.toLocaleString()} MT\n` +
    `📍 Local: ${product.location}\n` +
    `📝 Descrição: ${product.description}\n\n` +
    `👤 Vendedor: ${product.sellerName}\n\n` +
    `Quero comprar este produto. Pode guiar-me para o grupo de vendas?`
  );
}

function buildListMsg(product: Product) {
  return (
    `📢 *ANÚNCIO – Netek Marketplace*\n\n` +
    `📦 ${product.name}\n` +
    `💰 ${product.price.toLocaleString()} MT\n` +
    `🏷️ Condição: ${product.condition}\n` +
    `📍 ${product.location}\n` +
    `📝 ${product.description}\n\n` +
    `Por favor, adicione-me ao grupo de vendas Netek!`
  );
}

const CATS = ['Todos','Electrónica','Roupas','Casa & Jardim','Veículos','Serviços','Informática','Alimentos','Saúde','Educação','Outro'];
const CONDITIONS = ['Novo','Como Novo','Bom Estado','Usado'];
const EMOJIS: Record<string, string> = {
  Electrónica:'📱', Roupas:'👗', 'Casa & Jardim':'🏠', Veículos:'🚗',
  Serviços:'🔧', Informática:'💻', Alimentos:'🍎', Saúde:'💊', Educação:'📚', Outro:'📦',
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE MODAL DE CHECKOUT
═══════════════════════════════════════════════════════════ */
function CheckoutModal({
  product, onClose,
}: { product: Product; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const confirmPurchase = async () => {
    // Registar no Firestore
    await addDoc(collection(firestore, 'orders'), {
      productId: product.id,
      productName: product.name,
      price: product.price,
      buyerName, buyerPhone, buyerAddress, payMethod,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      status: 'Pendente',
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(firestore, 'products', product.id), { views: increment(1) });
    setStep(3);
  };

  const goToWABusiness = () => {
    const msg = buildSellMsg(product) +
      `\n\n👤 Comprador: ${buyerName}\n📞 Tel: ${buyerPhone}\n📍 Endereço: ${buyerAddress}\n💳 Pagamento: ${payMethod}`;
    window.open(waMsg(BUSINESS, msg), '_blank');
    window.open(GROUP, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-b border-slate-700 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">🛒 Finalizar Compra</h2>
            <p className="text-gray-400 text-sm">{product.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{product.price.toLocaleString()} MT</div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xs mt-1">✕ Fechar</button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex border-b border-slate-700">
          {['Dados','Pagamento','Confirmar'].map((l, i) => (
            <div key={i} className={`flex-1 py-3 text-center text-xs font-semibold ${step === i+1 ? 'bg-green-500/20 text-green-400' : step > i+1 ? 'bg-slate-800 text-gray-400' : 'text-gray-600'}`}>
              <span className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] mr-1 ${step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-green-500 text-white' : 'bg-slate-700'}`}>{step > i+1 ? '✓' : i+1}</span>
              {l}
            </div>
          ))}
        </div>

        <div className="p-5">
          {/* Passo 1 – Dados */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">👤 Os seus dados</h3>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nome completo *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" />
              <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="WhatsApp / Telefone *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" />
              <input value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder="Endereço / Bairro *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" />
              <button onClick={() => buyerName && buyerPhone && buyerAddress && setStep(2)} disabled={!buyerName || !buyerPhone || !buyerAddress} className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold disabled:opacity-40">Continuar →</button>
            </div>
          )}

          {/* Passo 2 – Pagamento */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">💳 Método de Pagamento</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{id:'mpesa',l:'💚 M-Pesa',d:'Transferência instantânea'},{id:'emola',l:'🔵 e-Mola',d:'Carteira digital'},{id:'banco',l:'🏦 Transferência',d:'Banco Moçambique'},{id:'dinheiro',l:'💵 Dinheiro',d:'Pagamento presencial'}].map(p => (
                  <button key={p.id} onClick={() => setPayMethod(p.id)} className={`p-4 rounded-xl border text-left transition-all ${payMethod === p.id ? 'border-green-500 bg-green-500/20' : 'border-slate-700 hover:border-green-500/50'}`}>
                    <div className="text-white text-sm font-semibold">{p.l}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{p.d}</div>
                  </button>
                ))}
              </div>
              {payMethod === 'mpesa' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-300 text-sm">
                  📱 M-Pesa: Envie para <strong>+258 84 016 6592</strong> e envie comprovativo pelo WhatsApp
                </div>
              )}
              {payMethod === 'emola' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-sm">
                  📱 e-Mola: Envie para <strong>+258 84 016 6592</strong> e envie comprovativo pelo WhatsApp
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">← Voltar</button>
                <button onClick={confirmPurchase} disabled={!payMethod} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold disabled:opacity-40">Confirmar ✓</button>
              </div>
            </div>
          )}

          {/* Passo 3 – Sucesso */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pedido Registado!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Agora clique abaixo para falar com o vendedor pelo <strong className="text-green-400">WhatsApp Business</strong> e entrar no <strong className="text-green-400">Grupo de Vendas Netek</strong>!
              </p>
              <div className="space-y-3">
                <button onClick={goToWABusiness} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/30">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Falar no WhatsApp Business + Entrar no Grupo
                </button>
                <p className="text-gray-600 text-xs">Será redirecionado para o WhatsApp Business (+258 84 016 6592) e depois para o grupo de vendas</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORMULÁRIO PUBLICAR PRODUTO
═══════════════════════════════════════════════════════════ */
function PublishProductForm({ fbUser, onDone }: { fbUser: FBUser; onDone: () => void }) {
  const [f, setF] = useState({ name:'', description:'', price:'', category:'Electrónica', condition:'Novo', location:'', phone: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name || !f.price || !f.location) return;
    setLoading(true);
    const product = {
      name: f.name, description: f.description,
      price: Number(f.price), category: f.category,
      condition: f.condition, location: f.location,
      emoji: EMOJIS[f.category] || '📦',
      images: [], sellerName: fbUser.displayName || 'Vendedor',
      sellerPhone: f.phone || WA_BUSINESS,
      sellerId: fbUser.uid,
      views: 0, likes: 0, sold: false, featured: false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(firestore, 'products'), product);

    // Notificar WhatsApp Business
    const msg = buildListMsg({ id: docRef.id, ...product } as Product);
    window.open(waMsg(BUSINESS, msg), '_blank');

    setSuccess(true);
    setLoading(false);
    setTimeout(onDone, 2000);
  };

  if (success) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">✅</div>
      <h3 className="text-white font-bold text-xl mb-1">Produto Publicado!</h3>
      <p className="text-gray-400 text-sm">Será adicionado ao grupo de vendas pelo WhatsApp Business.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-xl mb-2">📢 Publicar Produto</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="block text-xs text-gray-400 mb-1">Nome do Produto *</label><input value={f.name} onChange={e => set('name',e.target.value)} placeholder="Ex: iPhone 12 Pro Max" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Categoria</label><select value={f.category} onChange={e => set('category',e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm">{CATS.filter(c=>c!=='Todos').map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs text-gray-400 mb-1">Condição</label><select value={f.condition} onChange={e => set('condition',e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm">{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="block text-xs text-gray-400 mb-1">Preço (MT) *</label><input type="number" value={f.price} onChange={e => set('price',e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" /></div>
        <div><label className="block text-xs text-gray-400 mb-1">Localização *</label><input value={f.location} onChange={e => set('location',e.target.value)} placeholder="Ex: Maputo - Sommerschield" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" /></div>
        <div className="md:col-span-2"><label className="block text-xs text-gray-400 mb-1">Descrição</label><textarea value={f.description} onChange={e => set('description',e.target.value)} rows={3} placeholder="Descreva o produto..." className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm resize-none" /></div>
        <div className="md:col-span-2"><label className="block text-xs text-gray-400 mb-1">Seu WhatsApp (para contacto)</label><input value={f.phone} onChange={e => set('phone',e.target.value)} placeholder="+258 84 XXX XXX" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none text-sm" /></div>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-300 text-xs">
        ✅ Ao publicar, será enviada uma mensagem para o WhatsApp Business <strong>+258 840 166 592</strong> e será adicionado ao grupo de vendas Netek.
      </div>
      <button onClick={submit} disabled={loading || !f.name || !f.price || !f.location} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-40 transition-all">
        {loading ? '⏳ A publicar...' : '📤 Publicar + Entrar no Grupo de Vendas'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DO MARKETPLACE
═══════════════════════════════════════════════════════════ */
export function MarketplacePage({ fbUser }: { fbUser: FBUser | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState('Todos');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent'|'price_asc'|'price_desc'|'views'>('recent');
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<'shop'|'sell'|'orders'>('shop');

  // Produtos demo caso Firestore vazio
  const demoProducts: Product[] = [
    { id:'d1', name:'iPhone 13 Pro', description:'Excelente estado, carregador original incluído. Memória 256GB.', price:65000, category:'Electrónica', condition:'Como Novo', location:'Maputo - Polana', images:[], emoji:'📱', sellerName:'Carlos Silva', sellerPhone:WA_BUSINESS, sellerId:'demo', views:234, likes:45, sold:false, featured:true, createdAt:null },
    { id:'d2', name:'Laptop Dell XPS 15', description:'Core i7, 16GB RAM, SSD 512GB. Ideal para trabalho e estudo.', price:120000, category:'Informática', condition:'Bom Estado', location:'Maputo - Malhangalene', images:[], emoji:'💻', sellerName:'Ana Tembe', sellerPhone:WA_BUSINESS, sellerId:'demo', views:189, likes:32, sold:false, featured:true, createdAt:null },
    { id:'d3', name:'Capulana Premium (5 metros)', description:'Capulana estampada de alta qualidade, várias cores disponíveis.', price:1500, category:'Roupas', condition:'Novo', location:'Maputo - Xipamanine', images:[], emoji:'🧵', sellerName:'Maria Cossa', sellerPhone:WA_BUSINESS, sellerId:'demo', views:98, likes:21, sold:false, featured:false, createdAt:null },
    { id:'d4', name:'Mota Honda CB 150', description:'2019, bom estado, documentos em dia. Negociável.', price:185000, category:'Veículos', condition:'Bom Estado', location:'Matola - Machava', images:[], emoji:'🏍️', sellerName:'Pedro Nhaca', sellerPhone:WA_BUSINESS, sellerId:'demo', views:412, likes:78, sold:false, featured:true, createdAt:null },
    { id:'d5', name:'Serviço de Canalização', description:'Reparações, instalações e desentupimentos. Urgência disponível.', price:2500, category:'Serviços', condition:'Novo', location:'Maputo - Toda a cidade', images:[], emoji:'🔧', sellerName:'José Mabunda', sellerPhone:WA_BUSINESS, sellerId:'demo', views:67, likes:12, sold:false, featured:false, createdAt:null },
    { id:'d6', name:'Frigorifico Samsung 350L', description:'Frost free, 2 anos de uso, funciona perfeitamente.', price:28000, category:'Casa & Jardim', condition:'Bom Estado', location:'Beira - Centro', images:[], emoji:'🧊', sellerName:'Rosa Bila', sellerPhone:WA_BUSINESS, sellerId:'demo', views:155, likes:28, sold:false, featured:false, createdAt:null },
    { id:'d7', name:'Curso Excel Completo (USB)', description:'50 horas de vídeo aulas offline. Certificado incluído.', price:800, category:'Educação', condition:'Novo', location:'Online / Entrega', images:[], emoji:'📊', sellerName:'Netek Academy', sellerPhone:WA_BUSINESS, sellerId:'demo', views:320, likes:95, sold:false, featured:true, createdAt:null },
    { id:'d8', name:'TV Samsung 55" 4K Smart', description:'2022, QLED, controle remoto voz, Netflix/YouTube embutido.', price:85000, category:'Electrónica', condition:'Como Novo', location:'Maputo - Sommerschield', images:[], emoji:'📺', sellerName:'Luis Vilanculo', sellerPhone:WA_BUSINESS, sellerId:'demo', views:278, likes:61, sold:false, featured:false, createdAt:null },
    { id:'d9', name:'Cacana de Amendoim (5kg)', description:'Amendoim torrado artesanal, sem conservantes. Colheita fresca.', price:600, category:'Alimentos', condition:'Novo', location:'Maputo - Mavalane', images:[], emoji:'🥜', sellerName:'Ilda Matavel', sellerPhone:WA_BUSINESS, sellerId:'demo', views:44, likes:9, sold:false, featured:false, createdAt:null },
    { id:'d10', name:'Kit Escolar Completo', description:'Mochilas, cadernos, canetas e materiais para todas as classes.', price:3500, category:'Educação', condition:'Novo', location:'Maputo - Alto Maé', images:[], emoji:'🎒', sellerName:'Livraria Central', sellerPhone:WA_BUSINESS, sellerId:'demo', views:88, likes:19, sold:false, featured:false, createdAt:null },
    { id:'d11', name:'PlayStation 5 + 2 Controles', description:'Versão Digital, 1 ano de uso, carregador e jogos incluídos.', price:95000, category:'Electrónica', condition:'Bom Estado', location:'Maputo - Costa do Sol', images:[], emoji:'🎮', sellerName:'Gamers MZ', sellerPhone:WA_BUSINESS, sellerId:'demo', views:501, likes:112, sold:false, featured:true, createdAt:null },
    { id:'d12', name:'Serviço de Design Gráfico', description:'Logos, flyers, cartões, posts de redes sociais. Entrega rápida.', price:1200, category:'Serviços', condition:'Novo', location:'Online', images:[], emoji:'🎨', sellerName:'DesignMZ Studio', sellerPhone:WA_BUSINESS, sellerId:'demo', views:203, likes:47, sold:false, featured:false, createdAt:null },
  ];

  // Carregar produtos do Firestore + demo
  useEffect(() => {
    try {
      const q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        const firestoreProds = snap.docs.map(d => ({ id:d.id, ...d.data() }) as Product);
        setProducts([...firestoreProds, ...demoProducts]);
      }, () => setProducts(demoProducts));
      return unsub;
    } catch {
      setProducts(demoProducts);
    }
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty+1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const buyNow = (p: Product) => {
    if (!fbUser) { setShowLogin(true); return; }
    setCheckoutProduct(p);
  };

  const likeProduct = async (p: Product) => {
    if (!fbUser) { setShowLogin(true); return; }
    if (!p.id.startsWith('d')) {
      await updateDoc(doc(firestore, 'products', p.id), { likes: increment(1) });
    }
  };

  // Filtros e ordenação
  let filtered = products.filter(p => {
    if (cat !== 'Todos' && p.category !== cat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (sortBy === 'price_asc') filtered = [...filtered].sort((a,b) => a.price - b.price);
  else if (sortBy === 'price_desc') filtered = [...filtered].sort((a,b) => b.price - a.price);
  else if (sortBy === 'views') filtered = [...filtered].sort((a,b) => (b.views||0) - (a.views||0));

  const featured = products.filter(p => p.featured).slice(0,4);

  return (
    <>
      {showLogin && <FirebaseLoginPage onClose={() => setShowLogin(false)} />}
      {checkoutProduct && <CheckoutModal product={checkoutProduct} onClose={() => setCheckoutProduct(null)} />}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 z-40 flex justify-end" onClick={() => setShowCart(false)}>
          <div className="w-full max-w-sm bg-slate-900 h-full shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-5 flex items-center justify-between border-b border-slate-700">
              <h3 className="text-white font-bold text-lg">🛒 Carrinho ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-500"><p className="text-4xl mb-3">🛒</p><p>Carrinho vazio</p></div>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-green-400 text-sm font-bold">{item.price.toLocaleString()} MT</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart(c => c.map(i => i.id===item.id ? {...i, qty:Math.max(1,i.qty-1)} : i))} className="w-7 h-7 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">-</button>
                        <span className="text-white text-sm w-6 text-center">{item.qty}</span>
                        <button onClick={() => setCart(c => c.map(i => i.id===item.id ? {...i, qty:i.qty+1} : i))} className="w-7 h-7 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">+</button>
                        <button onClick={() => setCart(c => c.filter(i => i.id!==item.id))} className="w-7 h-7 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-700">
                  <div className="flex justify-between text-white font-bold text-lg mb-4">
                    <span>Total</span><span className="text-green-400">{cartTotal.toLocaleString()} MT</span>
                  </div>
                  <button onClick={() => {
                    const msg = `🛒 ENCOMENDA CARRINHO – Netek Marketplace\n\n` +
                      cart.map(i => `• ${i.name} (x${i.qty}) = ${(i.price*i.qty).toLocaleString()} MT`).join('\n') +
                      `\n\n💰 TOTAL: ${cartTotal.toLocaleString()} MT\n\nQuero finalizar a compra!`;
                    window.open(waMsg(BUSINESS, msg), '_blank');
                    window.open(GROUP, '_blank');
                  }} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Finalizar pelo WhatsApp Business
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-2">🛍️ MARKETPLACE</span>
              <h1 className="text-4xl font-bold text-white">Netek Marketplace</h1>
              <p className="text-gray-400 text-sm mt-1">Compre e venda no WhatsApp Business · <span className="text-green-400">+258 840 166 592</span></p>
            </div>
            <div className="flex items-center gap-3">
              {cart.length > 0 && (
                <button onClick={() => setShowCart(true)} className="relative px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2">
                  🛒 <span className="font-medium">{cartTotal.toLocaleString()} MT</span>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>
                </button>
              )}
              <a href={GROUP} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium hover:bg-green-500/30 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Grupo de Vendas
              </a>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl">
            {[{id:'shop' as const,i:'🛍️',l:'Comprar'},{id:'sell' as const,i:'📢',l:'Vender'},{id:'orders' as const,i:'📋',l:'Meus Pedidos'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${tab===t.id ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25' : 'text-gray-400 hover:text-white'}`}>
                {t.i} {t.l}
              </button>
            ))}
          </div>

          {/* ── TAB COMPRAR ── */}
          {tab === 'shop' && (
            <>
              {/* Banner WA Business */}
              <div className="bg-gradient-to-r from-green-500/15 to-green-700/15 border border-green-500/25 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-4xl">📱</div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-semibold">Compra pelo WhatsApp Business!</p>
                  <p className="text-gray-400 text-sm">Clique em "Comprar Agora" e será guiado para o nosso <strong className="text-green-400">WhatsApp Business +258 840 166 592</strong> e adicionado ao <strong className="text-green-400">Grupo de Vendas</strong>.</p>
                </div>
                <a href={waMsg(BUSINESS,'Olá! Vim do Marketplace Netek. Quero saber mais sobre os produtos.')} target="_blank" rel="noreferrer" className="px-5 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all text-sm whitespace-nowrap flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contactar Agora
                </a>
              </div>

              {/* Destaques */}
              {featured.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-white font-bold text-xl mb-4">⭐ Produtos em Destaque</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featured.map(p => (
                      <div key={p.id+'_f'} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 hover:border-yellow-500/50 hover:-translate-y-1 transition-all cursor-pointer" onClick={() => setSelected(p)}>
                        <div className="text-5xl text-center mb-3">{p.emoji}</div>
                        <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider mb-1">⭐ Destaque</div>
                        <h3 className="text-white font-semibold text-sm line-clamp-1">{p.name}</h3>
                        <p className="text-green-400 font-bold text-lg mt-1">{p.price.toLocaleString()} MT</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Busca + filtros */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar produto ou localização..." className="flex-1 px-5 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-green-500 focus:outline-none" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:outline-none text-sm">
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Preço ↑</option>
                  <option value="price_desc">Preço ↓</option>
                  <option value="views">Mais Vistos</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {CATS.map(c => <button key={c} onClick={() => setCat(c)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${cat===c ? 'bg-green-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}`}>{EMOJIS[c] || '🎯'} {c}</button>)}
              </div>

              {/* Grid de produtos */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <div key={p.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-green-500/50 hover:-translate-y-1 transition-all group">
                    {/* Imagem/Emoji */}
                    <div className="h-36 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-6xl cursor-pointer relative" onClick={() => setSelected(p)}>
                      {p.emoji}
                      {p.featured && <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded-full">⭐ Destaque</span>}
                      {p.sold && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><span className="text-red-400 font-bold text-sm">VENDIDO</span></div>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-[10px] rounded-full">{p.category}</span>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">{p.condition}</span>
                      </div>
                      <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">{p.name}</h3>
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{p.description}</p>
                      <p className="text-gray-500 text-xs mb-3">📍 {p.location}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 font-bold text-xl">{p.price.toLocaleString()} <span className="text-sm font-normal">MT</span></span>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <button onClick={() => likeProduct(p)} className="flex items-center gap-1 hover:text-red-400 transition-colors">❤️ {p.likes}</button>
                          <span>👁️ {p.views}</span>
                        </div>
                      </div>
                      {!p.sold ? (
                        <div className="flex gap-2">
                          <button onClick={() => buyNow(p)} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-xs font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md shadow-green-500/20">
                            🛍️ Comprar Agora
                          </button>
                          <button onClick={() => addToCart(p)} className="px-3 py-2.5 bg-slate-700 text-white rounded-xl text-xs hover:bg-slate-600 transition-all">🛒</button>
                        </div>
                      ) : (
                        <div className="py-2.5 bg-red-500/20 text-red-400 rounded-xl text-xs font-medium text-center">❌ Vendido</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                        <span className="text-gray-600 text-xs">👤 {p.sellerName}</span>
                        <a href={waMsg(p.sellerPhone || BUSINESS, `Olá! Vi o produto "${p.name}" por ${p.price.toLocaleString()} MT no Netek Marketplace.`)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="ml-auto text-green-400 text-xs hover:text-green-300">📱 Chat</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-5xl mb-3">🔍</p>
                  <p className="text-lg">Nenhum produto encontrado</p>
                  <p className="text-sm">Tente outra categoria ou pesquisa</p>
                </div>
              )}
            </>
          )}

          {/* ── TAB VENDER ── */}
          {tab === 'sell' && (
            <div className="max-w-2xl mx-auto">
              {!fbUser ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔐</div>
                  <h3 className="text-white font-bold text-xl mb-2">Inicie sessão para vender</h3>
                  <p className="text-gray-400 mb-6">Crie uma conta e publique os seus produtos no Marketplace Netek</p>
                  <button onClick={() => setShowLogin(true)} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold">🚀 Entrar para Vender</button>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <PublishProductForm fbUser={fbUser} onDone={() => setTab('shop')} />
                </div>
              )}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[{i:'📱',t:'WhatsApp Business',d:'+258 840 166 592'},{i:'👥',t:'Grupo de Vendas',d:'Partilha gratuita'},{i:'🔥',t:'Firebase',d:'Dados em tempo real'}].map((b,i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="text-3xl mb-2">{b.i}</div>
                    <p className="text-white text-xs font-semibold">{b.t}</p>
                    <p className="text-gray-500 text-xs">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB PEDIDOS ── */}
          {tab === 'orders' && (
            <OrdersPage fbUser={fbUser} setShowLogin={setShowLogin} />
          )}
        </div>

        {/* Modal de produto */}
        {selected && (
          <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-8xl">{selected.emoji}</div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-white font-bold text-xl">{selected.name}</h3>
                    <p className="text-gray-400 text-sm">📍 {selected.location}</p>
                  </div>
                  <div className="text-right"><p className="text-green-400 font-bold text-2xl">{selected.price.toLocaleString()} MT</p><div className="flex gap-1 mt-1"><span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-[10px] rounded-full">{selected.category}</span><span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">{selected.condition}</span></div></div>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{selected.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-5"><span>👤 {selected.sellerName}</span><span>❤️ {selected.likes}</span><span>👁️ {selected.views}</span></div>
                <div className="flex gap-3">
                  <button onClick={() => { buyNow(selected); setSelected(null); }} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Comprar Agora
                  </button>
                  <button onClick={() => { addToCart(selected); setSelected(null); }} className="px-5 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all">🛒</button>
                  <button onClick={() => setSelected(null)} className="px-5 py-3 bg-slate-700 text-gray-400 rounded-xl hover:bg-slate-600 transition-all">✕</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/* ─── PEDIDOS DO UTILIZADOR ─────────────────────────────── */
function OrdersPage({ fbUser, setShowLogin }: { fbUser: FBUser | null; setShowLogin: (v: boolean) => void }) {
  const [orders, setOrders] = useState<Record<string,unknown>[]>([]);

  useEffect(() => {
    if (!fbUser) return;
    const q = query(collection(firestore, 'orders'), where('buyerPhone', '!=', ''), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => setOrders(snap.docs.map(d => ({id:d.id,...d.data()}))));
    return unsub;
  }, [fbUser]);

  if (!fbUser) return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📋</div>
      <h3 className="text-white font-bold text-xl mb-2">Veja os seus pedidos</h3>
      <p className="text-gray-400 mb-6">Entre na sua conta para ver o histórico de compras</p>
      <button onClick={() => setShowLogin(true)} className="px-8 py-4 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600">🔐 Entrar</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-white font-bold text-xl mb-6">📋 Os meus Pedidos</h3>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Ainda não fez nenhuma compra</p>
          <p className="text-sm mt-1">Explore o marketplace e compre o que precisa!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-semibold">{o.productName as string}</h4>
                  <p className="text-gray-400 text-sm">Vendedor: {o.sellerName as string}</p>
                  <p className="text-gray-500 text-xs">{(o.createdAt as {toDate?:()=>Date})?.toDate?.()?.toLocaleDateString('pt-MZ') || 'Recente'}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-xl">{(o.price as number).toLocaleString()} MT</p>
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">{o.status as string}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={waMsg(BUSINESS, `Olá! Tenho um pedido pendente: ${o.productName as string} por ${(o.price as number).toLocaleString()} MT. ID: ${o.id as string}`)} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-medium text-center hover:bg-green-500/30 transition-all">📱 Confirmar WhatsApp</a>
                <a href={GROUP} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-slate-700 text-gray-300 rounded-xl text-xs font-medium text-center hover:bg-slate-600 transition-all">👥 Grupo Vendas</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
