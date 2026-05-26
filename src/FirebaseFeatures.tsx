import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FBUser,
} from 'firebase/auth';
import {
  ref,
  push,
  onValue,
  off,
  set,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  onDisconnect,
  remove,
} from 'firebase/database';
import {
  collection,
  addDoc,
  getDocs,
  query as fsQuery,
  orderBy,
  serverTimestamp as fsTs,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { auth, db, firestore } from './firebase';
import { WA, ADMIN_EMAIL, MASTER_EMAIL } from './data';

const wa = (msg: string) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

// ─── HOOK: AUTH FIREBASE ────────────────────────────────────────────────────
export function useFirebaseAuth() {
  const [fbUser, setFbUser] = useState<FBUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setFbUser(u); setLoading(false); });
    return unsub;
  }, []);

  const register = async (email: string, password: string, name: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(firestore, 'users', cred.user.uid), {
      name, email, phone, createdAt: fsTs(), points: 50,
      role: email.toLowerCase() === MASTER_EMAIL.toLowerCase() ? 'admin' : 'user',
      avatar: email.toLowerCase() === MASTER_EMAIL.toLowerCase() ? '👑' : '👤',
    });
    return cred.user;
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(firestore, 'users', cred.user.uid));
    if (!snap.exists()) {
      await setDoc(doc(firestore, 'users', cred.user.uid), {
        name: cred.user.displayName || 'Utilizador', email: cred.user.email,
        phone: '', createdAt: fsTs(), points: 50,
        role: cred.user.email?.toLowerCase() === MASTER_EMAIL.toLowerCase() ? 'admin' : 'user',
        avatar: cred.user.email?.toLowerCase() === MASTER_EMAIL.toLowerCase() ? '👑' : '👤',
      });
    }
    return cred.user;
  };

  const logout = () => signOut(auth);
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  return { fbUser, loading, register, login, loginGoogle, logout, resetPassword };
}

// ─── 1. LOGIN FIREBASE COMPLETO ─────────────────────────────────────────────
export function FirebaseLoginPage({ onClose }: { onClose: () => void }) {
  const { register, login, loginGoogle, resetPassword } = useFirebaseAuth();
  const [tab, setTab] = useState<'login'|'register'|'reset'>('login');
  const [f, setF] = useState({ name:'', email:'', password:'', phone:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try { await login(f.email, f.password); onClose(); }
    catch (e: unknown) { setError((e as Error).message?.includes('invalid') ? 'Email ou senha incorrectos.' : 'Erro ao entrar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(''); setLoading(true);
    try { await register(f.email, f.password, f.name, f.phone); onClose(); }
    catch (e: unknown) {
      const msg = (e as Error).message || '';
      setError(msg.includes('email-already') ? 'Email já registado!' : msg.includes('weak-password') ? 'Senha muito fraca (mín. 6 chars).' : 'Erro ao criar conta.');
    }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginGoogle(); onClose(); }
    catch { setError('Erro ao entrar com Google.'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setError(''); setLoading(true);
    try { await resetPassword(f.email); setSuccess('Email de redefinição enviado!'); setTab('login'); }
    catch { setError('Email não encontrado.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">N</div>
          <h2 className="text-xl font-bold text-white">
            {tab === 'login' ? '🚀 Entrar na Netek' : tab === 'register' ? '📝 Criar Conta' : '🔑 Recuperar Senha'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">Conta real sincronizada com Firebase</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">❌ {error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">✅ {success}</div>}

        <div className="space-y-3">
          {tab === 'register' && <>
            <input value={f.name} onChange={e => set('name',e.target.value)} placeholder="Nome completo *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
            <input value={f.phone} onChange={e => set('phone',e.target.value)} placeholder="Telefone *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
          </>}
          {tab !== 'reset' || true ? (
            <input type="email" value={f.email} onChange={e => set('email',e.target.value)} placeholder="Email *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
          ) : null}
          {tab !== 'reset' && (
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={f.password} onChange={e => set('password',e.target.value)} placeholder="Senha *" className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm pr-12" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? '🙈' : '👁️'}</button>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-4">
          <button onClick={tab === 'login' ? handleLogin : tab === 'register' ? handleRegister : handleReset}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50">
            {loading ? '⏳ Aguarde...' : tab === 'login' ? '🚀 Entrar' : tab === 'register' ? '✅ Criar Conta' : '📧 Enviar Email'}
          </button>

          {tab === 'login' && (
            <button onClick={handleGoogle} disabled={loading} className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          {tab === 'login' ? (
            <>
              <button onClick={() => setTab('register')} className="text-cyan-400 hover:text-cyan-300">Criar conta →</button>
              <button onClick={() => setTab('reset')} className="text-gray-500 hover:text-gray-400">Esqueci a senha</button>
            </>
          ) : (
            <button onClick={() => setTab('login')} className="text-cyan-400 hover:text-cyan-300">← Voltar ao login</button>
          )}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 text-gray-600 text-sm hover:text-gray-400 transition-colors">Continuar sem conta</button>
      </div>
    </div>
  );
}

// ─── 2. CHAT EM TEMPO REAL (FIREBASE RTDB) ──────────────────────────────────
interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: number;
  room: string;
}

const chatRooms = [
  { id: 'geral', name: '🌍 Geral', desc: 'Conversa livre' },
  { id: 'tecnologia', name: '💻 Tecnologia', desc: 'Tech e programação' },
  { id: 'negocios', name: '💼 Negócios', desc: 'Empreendedorismo' },
  { id: 'emprego', name: '💼 Emprego', desc: 'Vagas e oportunidades' },
  { id: 'kayamoz', name: '🔍 KayaMoz', desc: 'Talentos e serviços' },
  { id: 'cursos', name: '📚 Cursos', desc: 'Estudo e formação' },
];

export function RealTimeChatPage({ fbUser }: { fbUser: FBUser | null }) {
  const [room, setRoom] = useState('geral');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  // Load messages
  useEffect(() => {
    const msgRef = query(ref(db, `chat/${room}/messages`), orderByChild('createdAt'), limitToLast(50));
    const handle = onValue(msgRef, snap => {
      const data = snap.val();
      if (!data) { setMessages([]); return; }
      const msgs: ChatMessage[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<ChatMessage,'id'>) }));
      setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
    });
    return () => off(msgRef, 'value', handle);
  }, [room]);

  // Presence
  useEffect(() => {
    if (!fbUser) return;
    const presRef = ref(db, `chat/${room}/online/${fbUser.uid}`);
    set(presRef, { name: fbUser.displayName || 'Utilizador', online: true, at: serverTimestamp() });
    onDisconnect(presRef).remove();

    const allRef = ref(db, `chat/${room}/online`);
    const h = onValue(allRef, snap => setOnlineCount(snap.size || 1));
    return () => { off(allRef, 'value', h); remove(presRef); };
  }, [fbUser, room]);

  // Typing
  const handleTyping = () => {
    if (!fbUser) return;
    const typRef = ref(db, `chat/${room}/typing/${fbUser.uid}`);
    set(typRef, fbUser.displayName || 'Alguém');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => remove(typRef), 2000);
  };

  useEffect(() => {
    const typRef = ref(db, `chat/${room}/typing`);
    const h = onValue(typRef, snap => {
      const data = snap.val() || {};
      setTypingUsers(Object.entries(data).filter(([uid]) => uid !== fbUser?.uid).map(([,n]) => n as string));
    });
    return () => off(typRef, 'value', h);
  }, [room, fbUser]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async () => {
    if (!text.trim()) return;
    if (!fbUser) { setShowLogin(true); return; }

    const msgData = {
      text: text.trim(),
      userId: fbUser.uid,
      userName: fbUser.displayName || 'Utilizador',
      userAvatar: fbUser.email?.[0]?.toUpperCase() || 'U',
      createdAt: Date.now(),
      room,
    };
    await push(ref(db, `chat/${room}/messages`), msgData);

    // Also track in Firestore for admin
    try {
      await addDoc(collection(firestore, 'chatMessages'), { ...msgData, createdAt: fsTs() });
    } catch {}

    setText('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    remove(ref(db, `chat/${room}/typing/${fbUser.uid}`));
  }, [text, fbUser, room]);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {showLogin && <FirebaseLoginPage onClose={() => setShowLogin(false)} />}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium mb-4">🔴 AO VIVO</span>
            <h2 className="text-3xl font-bold text-white mb-2">Chat em Tempo Real</h2>
            <p className="text-gray-400">Converse com utilizadores da Netek em tempo real</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-4">
            {/* Rooms */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs font-medium">{onlineCount} online</span>
                </div>
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Salas</p>
                {chatRooms.map(r => (
                  <button key={r.id} onClick={() => setRoom(r.id)}
                    className={`w-full flex items-start gap-2 p-3 rounded-xl text-left text-sm transition-all mb-1 ${room === r.id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:bg-white/5'}`}>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs opacity-70">{r.desc}</p>
                    </div>
                    {room === r.id && <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="lg:col-span-3 flex flex-col" style={{ height: '520px' }}>
              <div className="bg-slate-800/50 border border-slate-700 rounded-t-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{chatRooms.find(r => r.id === room)?.name}</p>
                  <p className="text-gray-500 text-xs">{chatRooms.find(r => r.id === room)?.desc}</p>
                </div>
                {!fbUser && (
                  <button onClick={() => setShowLogin(true)} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl text-xs font-medium hover:bg-cyan-500/30 transition-all">
                    🔐 Entrar para participar
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900/50 border-x border-slate-700 p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="text-sm">Seja o primeiro a enviar mensagem nesta sala!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.userId === fbUser?.uid ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${msg.userId === fbUser?.uid ? 'bg-cyan-500' : 'bg-purple-500'}`}>
                      {msg.userAvatar}
                    </div>
                    <div className={`max-w-[70%] ${msg.userId === fbUser?.uid ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-400 text-xs">{msg.userName}</span>
                        <span className="text-gray-600 text-xs">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.userId === fbUser?.uid ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <div className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}</div>
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está a escrever' : 'estão a escrever'}...
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-b-2xl p-3">
                {fbUser ? (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-xl px-4">
                      <input
                        value={text}
                        onChange={e => { setText(e.target.value); handleTyping(); }}
                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && send()}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 py-3 bg-transparent text-white text-sm focus:outline-none"
                      />
                      <div className="flex gap-1 text-gray-600">
                        <button className="hover:text-gray-400 transition-colors">😊</button>
                        <button className="hover:text-gray-400 transition-colors">📎</button>
                      </div>
                    </div>
                    <button onClick={send} className="w-11 h-11 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg">
                      ➤
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowLogin(true)} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold">
                    🔐 Entrar para participar no chat
                  </button>
                )}
                {fbUser && <p className="text-gray-600 text-xs mt-2 text-center">A conversar como <span className="text-cyan-400">{fbUser.displayName || fbUser.email}</span></p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── 3. PAINEL DE PERFIL FIREBASE ───────────────────────────────────────────
export function FirebaseProfilePage({ fbUser, onLogout }: { fbUser: FBUser; onLogout: () => void }) {
  const [userData, setUserData] = useState<Record<string,unknown>>({});
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fbUser) return;
    const unsub = onSnapshot(doc(firestore, 'users', fbUser.uid), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setBio((data.bio as string) || '');
        setPhone((data.phone as string) || '');
      }
    });
    return unsub;
  }, [fbUser]);

  const saveProfile = async () => {
    setSaving(true);
    await updateDoc(doc(firestore, 'users', fbUser.uid), { bio, phone, updatedAt: fsTs() });
    setSaving(false);
    setEditing(false);
  };

  const addPoints = async (pts: number) => {
    await updateDoc(doc(firestore, 'users', fbUser.uid), { points: increment(pts) });
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {fbUser.displayName?.[0] || fbUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-slate-900">✓</div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{fbUser.displayName || 'Utilizador'}</h1>
              <p className="text-gray-400 text-sm">{fbUser.email}</p>
              {userData.phone ? <p className="text-gray-400 text-sm">📞 {String(userData.phone)}</p> : null}
              {userData.bio ? <p className="text-gray-300 text-sm mt-1 italic">"{String(userData.bio)}"</p> : null}
              <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Firebase Auth ✅</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Conta Real</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="px-4 py-2 bg-yellow-500/20 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-400">{(userData.points as number) || 0}</div>
                <div className="text-xs text-gray-400">Pontos</div>
              </div>
              <button onClick={() => setEditing(!editing)} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-xs hover:bg-slate-600 transition-all">✏️ Editar</button>
            </div>
          </div>

          {editing && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <div><label className="block text-xs text-gray-400 mb-1">Bio</label><input value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="Escreva algo sobre si..." /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Telefone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" placeholder="+258 84 000 0000" /></div>
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving} className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 disabled:opacity-50">{saving ? '⏳ A guardar...' : '💾 Guardar'}</button>
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl text-sm hover:bg-slate-600">Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Firebase */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{(userData.points as number) || 0}</div>
            <div className="text-xs text-gray-400">Pontos</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{fbUser.emailVerified ? '✓' : '✗'}</div>
            <div className="text-xs text-gray-400">Email Verificado</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{fbUser.metadata.lastSignInTime ? '🟢' : '⚪'}</div>
            <div className="text-xs text-gray-400">Último login</div>
          </div>
        </div>

        {/* Ganhar Pontos */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">💰 Ganhar Pontos</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { label:'Partilhar Netek', pts:10, action:'share', icon:'📤' },
              { label:'Completar Curso', pts:50, action:'course', icon:'📚' },
              { label:'Indicar Amigo', pts:25, action:'refer', icon:'👥' },
            ].map(item => (
              <div key={item.action} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-white text-sm font-medium mb-1">{item.label}</p>
                <p className="text-yellow-400 font-bold mb-3">+{item.pts} pts</p>
                <button onClick={() => addPoints(item.pts)} className="w-full py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition-all">Ganhar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">🔒 Informações da Conta Firebase</h3>
          <div className="space-y-3">
            {[
              { l:'UID Firebase', v: fbUser.uid },
              { l:'Criado em', v: fbUser.metadata.creationTime || '—' },
              { l:'Último acesso', v: fbUser.metadata.lastSignInTime || '—' },
              { l:'Provedor', v: fbUser.providerData[0]?.providerId || 'email' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <span className="text-gray-400 text-sm">{item.l}</span>
                <span className="text-white text-sm font-mono text-right truncate max-w-xs">{item.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <a href={wa(`Olá! Sou ${fbUser.displayName || fbUser.email} e preciso de ajuda.`)} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-green-500/20 text-green-400 rounded-xl font-medium text-center hover:bg-green-500/30 transition-all">
            📱 Suporte WhatsApp
          </a>
          <button onClick={onLogout} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-all">🚪 Terminar Sessão</button>
        </div>
      </div>
    </section>
  );
}

// ─── 4. FEED DE PUBLICAÇÕES (FIRESTORE) ─────────────────────────────────────
interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorId: string;
  createdAt: unknown;
  likes: number;
  views: number;
}

export function ForumPage({ fbUser }: { fbUser: FBUser | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Geral' });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const categories = ['Todos', 'Geral', 'Tecnologia', 'Negócios', 'Emprego', 'Cursos', 'KayaMoz'];

  useEffect(() => {
    const q = fsQuery(collection(firestore, 'forum'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post));
    });
    return unsub;
  }, []);

  const submit = async () => {
    if (!fbUser) { setShowLogin(true); return; }
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    await addDoc(collection(firestore, 'forum'), {
      title: form.title, content: form.content, category: form.category,
      authorName: fbUser.displayName || 'Anónimo', authorId: fbUser.uid,
      createdAt: fsTs(), likes: 0, views: 0,
    });
    setForm({ title: '', content: '', category: 'Geral' });
    setShowForm(false);
    setLoading(false);
  };

  const likePost = async (postId: string) => {
    if (!fbUser) { setShowLogin(true); return; }
    await updateDoc(doc(firestore, 'forum', postId), { likes: increment(1) });
  };

  const filtered = filter === 'Todos' ? posts : posts.filter(p => p.category === filter);

  return (
    <>
      {showLogin && <FirebaseLoginPage onClose={() => setShowLogin(false)} />}
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-sm font-medium mb-4">💬 FÓRUM COMUNIDADE</span>
            <h2 className="text-3xl font-bold text-white mb-2">Fórum Netek</h2>
            <p className="text-gray-400">Powered by Firebase Firestore · Dados em tempo real</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map(c => <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter===c ? 'bg-orange-500 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'}`}>{c}</button>)}
            </div>
            <button onClick={() => fbUser ? setShowForm(!showForm) : setShowLogin(true)} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
              ✏️ Nova Publicação
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
              <h3 className="text-white font-semibold mb-4">✏️ Nova Publicação</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="Título da publicação *" className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none text-sm" />
                <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none text-sm">
                  {categories.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
                </select>
                <textarea value={form.content} onChange={e => setForm(p => ({...p,content:e.target.value}))} rows={4} placeholder="Conteúdo da publicação *" className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none text-sm resize-none" />
                <div className="flex gap-2">
                  <button onClick={submit} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold disabled:opacity-50">{loading ? '⏳...' : '📤 Publicar'}</button>
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">💬</p>
              <p>Nenhuma publicação ainda. Seja o primeiro!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(post => (
                <article key={post.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-orange-500/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">{post.category}</span>
                        <span className="text-gray-500 text-xs">
                          {post.createdAt && (post.createdAt as {toDate?: () => Date}).toDate ? (post.createdAt as {toDate:()=>Date}).toDate().toLocaleDateString('pt-MZ') : 'Agora'}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-lg">{post.title}</h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold shrink-0">
                      {post.authorName?.[0]?.toUpperCase() || 'A'}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 {post.authorName}</span>
                      <span>👁️ {post.views || 0} vistas</span>
                    </div>
                    <button onClick={() => likePost(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30 transition-all">
                      ❤️ {post.likes || 0}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── 5. PAINEL ADMIN FIREBASE ────────────────────────────────────────────────
export function FirebaseAdminPanel({ adminEmail }: { adminEmail: string }) {
  const [users, setUsers] = useState<Record<string,unknown>[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<'users'|'forum'|'chat'|'live'>('live');

  const isAdmin = adminEmail === ADMIN_EMAIL || adminEmail === MASTER_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    // Users
    getDocs(collection(firestore, 'users')).then(snap => setUsers(snap.docs.map(d => ({id:d.id,...d.data()}))));
    // Forum posts
    const q = fsQuery(collection(firestore, 'forum'), orderBy('createdAt', 'desc'));
    const u = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({id:d.id,...d.data()}) as Post)));
    // Chat messages
    const cm = fsQuery(collection(firestore, 'chatMessages'), orderBy('createdAt', 'desc'));
    const u2 = onSnapshot(cm, snap => setMsgs(snap.docs.map(d => ({id:d.id,...d.data()}) as ChatMessage)));
    return () => { u(); u2(); };
  }, [isAdmin]);

  if (!isAdmin) return <div className="py-20 text-center text-red-400">Acesso negado</div>;

  return (
    <div className="mt-8 bg-slate-800/50 border border-red-500/20 rounded-2xl p-6">
      <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center gap-2">🔥 Firebase Admin Panel</h3>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[{id:'live' as const,l:'🔴 Live'},{ id:'users' as const,l:'👥 Users'},{ id:'forum' as const,l:'💬 Fórum'},{ id:'chat' as const,l:'📨 Chat'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab===t.id ? 'bg-red-500 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}>{t.l}</button>
        ))}
      </div>
      {tab === 'live' && (
        <div className="grid md:grid-cols-3 gap-4">
          {[{icon:'👥',l:'Utilizadores Firebase',v:users.length},{icon:'💬',l:'Posts no Fórum',v:posts.length},{icon:'📨',l:'Mensagens Chat',v:msgs.length}].map((s,i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-red-400">{s.v}</div>
              <div className="text-xs text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700">{['Nome','Email','Pontos','Criado'].map(h => <th key={h} className="text-left p-3 text-gray-400 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u,i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="p-3 text-white">{(u.name as string) || '—'}</td>
                  <td className="p-3 text-gray-400">{(u.email as string) || '—'}</td>
                  <td className="p-3 text-yellow-400">{(u.points as number) || 0}</td>
                  <td className="p-3 text-gray-500 text-xs">—</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum utilizador registado ainda</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'forum' && (
        <div className="space-y-3">
          {posts.slice(0,10).map(p => (
            <div key={p.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl">
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full shrink-0">{p.category}</span>
              <div className="flex-1"><p className="text-white text-sm font-medium">{p.title}</p><p className="text-gray-500 text-xs">{p.authorName} · ❤️ {p.likes}</p></div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-center text-gray-500 py-6">Sem posts ainda</p>}
        </div>
      )}
      {tab === 'chat' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {msgs.slice(0,20).map((m,i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-xl text-sm">
              <span className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">{m.userAvatar || 'U'}</span>
              <div><span className="text-gray-400 text-xs">{m.userName} · {m.room}</span><p className="text-white">{m.text}</p></div>
            </div>
          ))}
          {msgs.length === 0 && <p className="text-center text-gray-500 py-6">Sem mensagens ainda</p>}
        </div>
      )}
    </div>
  );
}
