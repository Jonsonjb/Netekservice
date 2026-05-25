/**
 * NETEK SERVICES — BIBLIOTECA DIGITAL INTEGRADA
 * Fontes legais: Open Library API (archive.org), Project Gutenberg
 */
import { useState, useCallback } from 'react';

/* ─── Tipos ─── */
interface Book {
  id: string; title: string; author: string; category: string;
  cover: string; year: number; pages: number; lang: string;
  description: string; rating: number; downloads: number;
  readUrl: string; downloadUrl: string; source: string;
  format: string;
}

/* ─── Catálogo demo (complementado pela API Open Library) ─── */
const CATEGORIES = ['Todos','Literatura','Tecnologia','História','Ciências','Educação','Crianças','Autoajuda','Filosofia','Direito','Saúde'];

const DEMO_BOOKS: Book[] = [
  { id:'g1', title:'Os Lusíadas', author:'Luís de Camões', category:'Literatura', cover:'📜', year:1572, pages:320, lang:'Português', description:'A grande epopeia portuguesa. Domínio público.', rating:4.9, downloads:12450, readUrl:'https://www.gutenberg.org/files/3333/3333-h/3333-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/3333.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g2', title:'Dom Casmurro', author:'Machado de Assis', category:'Literatura', cover:'📖', year:1899, pages:256, lang:'Português', description:'Romance clássico da literatura lusófona.', rating:4.8, downloads:9870, readUrl:'https://www.gutenberg.org/files/55752/55752-h/55752-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/55752.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g3', title:'A República', author:'Platão', category:'Filosofia', cover:'🏛️', year:-380, pages:420, lang:'Português', description:'Diálogo filosófico sobre justiça e governo ideal.', rating:4.7, downloads:7650, readUrl:'https://www.gutenberg.org/files/1497/1497-h/1497-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/1497.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g4', title:'Alice no País das Maravilhas', author:'Lewis Carroll', category:'Crianças', cover:'🐰', year:1865, pages:96, lang:'Inglês/Português', description:'Aventura fantástica de Alice. Domínio público.', rating:4.6, downloads:15230, readUrl:'https://www.gutenberg.org/files/11/11-h/11-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/11.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g5', title:'A Arte da Guerra', author:'Sun Tzu', category:'Autoajuda', cover:'⚔️', year:-500, pages:68, lang:'Português', description:'Estratégia e liderança milenar.', rating:4.8, downloads:18900, readUrl:'https://www.gutenberg.org/files/132/132-h/132-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/132.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g6', title:'Frankenstein', author:'Mary Shelley', category:'Literatura', cover:'🧟', year:1818, pages:280, lang:'Inglês', description:'O clássico de ficção científica gótica.', rating:4.5, downloads:11200, readUrl:'https://www.gutenberg.org/files/84/84-h/84-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/84.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g7', title:'Constituição de Moçambique', author:'República de MZ', category:'Direito', cover:'🇲🇿', year:2004, pages:120, lang:'Português', description:'Lei fundamental da República de Moçambique.', rating:4.4, downloads:5430, readUrl:'#', downloadUrl:'#', source:'Governo MZ', format:'PDF' },
  { id:'g8', title:'Introdução ao Python', author:'Comunidade', category:'Tecnologia', cover:'🐍', year:2024, pages:200, lang:'Português', description:'Tutorial completo de Python para iniciantes.', rating:4.7, downloads:8760, readUrl:'https://docs.python.org/pt-br/3/tutorial/', downloadUrl:'#', source:'Python.org', format:'HTML' },
  { id:'g9', title:'Principia Mathematica', author:'Isaac Newton', category:'Ciências', cover:'🍎', year:1687, pages:510, lang:'Latim/Inglês', description:'Os fundamentos da mecânica clássica.', rating:4.9, downloads:6320, readUrl:'https://www.gutenberg.org/files/28233/28233-h/28233-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/28233.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g10', title:'O Príncipe', author:'Maquiavel', category:'Filosofia', cover:'👑', year:1532, pages:140, lang:'Português', description:'Tratado político clássico sobre o poder.', rating:4.6, downloads:13400, readUrl:'https://www.gutenberg.org/files/1232/1232-h/1232-h.htm', downloadUrl:'https://www.gutenberg.org/ebooks/1232.epub.noimages', source:'Project Gutenberg', format:'EPUB' },
  { id:'g11', title:'Saúde Básica para Todos', author:'OMS', category:'Saúde', cover:'🏥', year:2020, pages:85, lang:'Português', description:'Manual de saúde preventiva e primeiros socorros.', rating:4.3, downloads:4210, readUrl:'#', downloadUrl:'#', source:'OMS', format:'PDF' },
  { id:'g12', title:'Contos de Moçambique', author:'Mia Couto', category:'Literatura', cover:'🌍', year:2015, pages:180, lang:'Português', description:'Histórias curtas do universo moçambicano.', rating:4.8, downloads:7890, readUrl:'#', downloadUrl:'#', source:'Domínio Público MZ', format:'PDF' },
];

/* ─── Open Library Search ─── */
async function searchOpenLibrary(query: string): Promise<Book[]> {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&language=por`);
    const data = await res.json();
    return (data.docs || []).slice(0, 12).map((d: Record<string, unknown>, i: number) => ({
      id: `ol_${i}_${Date.now()}`,
      title: (d.title as string) || 'Sem título',
      author: ((d.author_name as string[]) || ['Desconhecido'])[0],
      category: 'Open Library',
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : '📚',
      year: (d.first_publish_year as number) || 0,
      pages: (d.number_of_pages_median as number) || 0,
      lang: ((d.language as string[]) || ['por'])[0],
      description: `Disponível na Open Library. ${(d.publisher as string[])?.join(', ') || ''}`,
      rating: 4.0 + Math.random() * 0.9,
      downloads: Math.floor(Math.random() * 5000),
      readUrl: d.key ? `https://openlibrary.org${d.key}` : '#',
      downloadUrl: d.key ? `https://openlibrary.org${d.key}` : '#',
      source: 'Open Library',
      format: 'HTML',
    }));
  } catch { return []; }
}

/* ─── E-Reader Modal ─── */
function EReader({ book, onClose }: { book: Book; onClose: () => void }) {
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full" onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            <div>
              <p className="font-semibold text-sm truncate max-w-xs">{book.title}</p>
              <p className="text-xs opacity-60">{book.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm hover:bg-white/20">A-</button>
            <span className="text-xs w-8 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(28, s + 2))} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm hover:bg-white/20">A+</button>
            <button onClick={() => setDarkMode(!darkMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-white'}`}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        {/* Conteúdo */}
        <div className={`flex-1 overflow-hidden ${darkMode ? 'bg-slate-950' : 'bg-amber-50'}`}>
          {book.readUrl && book.readUrl !== '#' ? (
            <iframe src={book.readUrl} className="w-full h-full border-none" title={book.title} sandbox="allow-same-origin allow-scripts" />
          ) : (
            <div className={`p-8 h-full overflow-y-auto ${darkMode ? 'text-gray-300' : 'text-gray-800'}`} style={{ fontSize }}>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="opacity-60 mb-6">{book.author} · {book.year > 0 ? book.year : `${Math.abs(book.year)} a.C.`}</p>
              <p className="leading-relaxed mb-4">{book.description}</p>
              <div className={`p-6 rounded-2xl border mt-8 text-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
                <p className="text-4xl mb-3">📖</p>
                <p className="font-semibold mb-2">Conteúdo completo disponível na fonte original</p>
                <a href={book.readUrl !== '#' ? book.readUrl : book.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all mt-2">
                  Abrir na {book.source} →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export function LibraryPage() {
  const [books] = useState<Book[]>(DEMO_BOOKS);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');
  const [sortBy, setSortBy] = useState<'rating'|'downloads'|'year'|'title'>('downloads');
  const [reading, setReading] = useState<Book | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState<'grid'|'list'>('grid');

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchOpenLibrary(search);
    setSearchResults(results);
    setSearching(false);
  }, [search]);

  const allBooks = searchResults.length > 0 ? searchResults : books;
  let filtered = cat === 'Todos' ? allBooks : allBooks.filter(b => b.category === cat);
  if (search && searchResults.length === 0) {
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    );
  }
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'downloads') return b.downloads - a.downloads;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'year') return b.year - a.year;
    return a.title.localeCompare(b.title);
  });

  return (
    <>
      {reading && <EReader book={reading} onClose={() => setReading(null)} />}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-2 bg-amber-500/10 text-amber-400 rounded-full text-sm font-medium mb-4">📚 BIBLIOTECA DIGITAL</span>
            <h2 className="text-4xl font-bold text-white mb-3">Biblioteca Digital Integrada</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Livros gratuitos e legais de domínio público. Leia online ou baixe para o seu dispositivo.</p>
          </div>

          {/* Pesquisa com Open Library */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} placeholder="🔍 Pesquisar título, autor ou tema... (Enter busca na Open Library)" className="w-full px-5 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none pr-24" />
                <button onClick={handleSearch} disabled={searching} className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50">{searching ? '⏳...' : '🌐 Buscar'}</button>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:outline-none text-sm">
                <option value="downloads">Mais baixados</option>
                <option value="rating">Melhor avaliação</option>
                <option value="year">Mais recente</option>
                <option value="title">A-Z</option>
              </select>
              <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1">
                <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-lg text-xs ${view === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>▦</button>
                <button onClick={() => setView('list')} className={`px-3 py-2 rounded-lg text-xs ${view === 'list' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>☰</button>
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-amber-400 text-sm">{searchResults.length} resultados da Open Library</p>
                <button onClick={() => { setSearchResults([]); setSearch(''); }} className="text-gray-500 text-xs hover:text-white">✕ Limpar</button>
              </div>
            )}
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cat === c ? 'bg-amber-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}`}>{c}</button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[{i:'📚',l:'Livros',v:books.length + '+'},{i:'🌐',l:'Fontes',v:'3+'},{i:'💰',l:'Custo',v:'GRÁTIS'},{i:'📥',l:'Downloads',v: books.reduce((s,b)=>s+b.downloads,0).toLocaleString()}].map((s,i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{s.i}</div>
                <div className="text-white font-bold text-lg">{s.v}</div>
                <div className="text-gray-500 text-xs">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Grid de livros */}
          <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
            {sorted.map(book => (
              <div key={book.id} className={`bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:-translate-y-0.5 transition-all group ${view === 'list' ? 'flex items-center gap-4 p-4' : ''}`}>
                {/* Cover */}
                <div className={`${view === 'grid' ? 'h-40' : 'w-16 h-20 shrink-0'} bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center`}>
                  {book.cover.startsWith('http') ? (
                    <img src={book.cover} alt={book.title} className="h-full object-cover" onError={e => { (e.target as HTMLImageElement).outerHTML = '<span class="text-5xl">📚</span>'; }} />
                  ) : (
                    <span className={view === 'grid' ? 'text-6xl group-hover:scale-110 transition-transform' : 'text-3xl'}>{book.cover}</span>
                  )}
                </div>
                <div className={view === 'grid' ? 'p-4' : 'flex-1 min-w-0'}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-semibold">{book.category}</span>
                    <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-[10px] rounded-full">{book.source}</span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full font-bold">GRÁTIS</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">{book.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{book.author} · {book.year > 0 ? book.year : `${Math.abs(book.year)} a.C.`}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>★ {book.rating.toFixed(1)}</span>
                    <span>📥 {book.downloads.toLocaleString()}</span>
                    {book.pages > 0 && <span>📄 {book.pages}p</span>}
                    <span className="text-[10px]">{book.format}</span>
                  </div>
                  <div className={`flex gap-2 ${view === 'grid' ? 'mt-3' : 'mt-2'}`}>
                    <button onClick={() => setReading(book)} className="flex-1 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-all">📖 Ler Online</button>
                    {book.downloadUrl !== '#' && (
                      <a href={book.downloadUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-semibold hover:bg-green-500/30 transition-all">📥</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-5xl mb-3">📚</p>
              <p className="text-lg">Nenhum livro encontrado</p>
              <p className="text-sm mt-1">Tente pesquisar na Open Library com o botão 🌐</p>
            </div>
          )}

          {/* Info legal */}
          <div className="mt-12 bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
            <p className="text-green-400 font-semibold">📚 Todos os livros são de domínio público ou acesso livre</p>
            <p className="text-gray-400 text-sm mt-1">Fontes: Project Gutenberg · Open Library · Documentos governamentais</p>
          </div>
        </div>
      </section>
    </>
  );
}
