/**
 * NETEK SERVICES — SISTEMA DE AUTENTICAÇÃO UNIFICADO
 * ───────────────────────────────────────────────────
 * Partilha o mesmo projecto Firebase com o KayaMoz
 * (kayamoz-debbb). Qualquer conta criada aqui funciona
 * automaticamente no KayaMoz e vice-versa.
 *
 * Suporte a:
 *  • Login com Email/Senha
 *  • Login com Google (OAuth2 popup)
 *  • Registo completo (nome, bairro, província, telefone)
 *  • Recuperação de senha por email
 *  • Persistência de sessão (onAuthStateChanged)
 *  • Detecção de conta KayaMoz existente
 *  • Sincronização de perfil Firestore (colecção "users")
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  type User as FBUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';

// ────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────
export interface UnifiedUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  bairro: string;
  provincia: string;
  avatar: string;
  photoURL: string;
  points: number;
  role: 'user' | 'admin' | 'moderator';
  platform: 'netek' | 'kayamoz' | 'google' | 'ambos';
  emailVerified: boolean;
  createdAt: unknown;
  lastLogin: unknown;
  /** Código de indicação KayaMoz (compatível) */
  referralCode?: string;
  /** Código de quem o indicou */
  referredBy?: string;
}

// ────────────────────────────────────────────────────────────
// Utilitários
// ────────────────────────────────────────────────────────────
function parseFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use':     'Este email já está registado. Tente fazer login.',
    'auth/invalid-email':            'Email inválido. Verifique o formato.',
    'auth/weak-password':            'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/user-not-found':           'Email não encontrado. Crie uma conta.',
    'auth/wrong-password':           'Senha incorrecta. Tente novamente.',
    'auth/invalid-credential':       'Credenciais inválidas. Verifique email e senha.',
    'auth/too-many-requests':        'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed':   'Sem ligação à internet. Verifique a rede.',
    'auth/popup-closed-by-user':     'Login Google cancelado. Tente novamente.',
    'auth/popup-blocked':            'Pop-up bloqueado. Permita pop-ups e tente novamente.',
    'auth/cancelled-popup-request':  'Pedido cancelado. Tente novamente.',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com este email. Use outro método.',
  };
  return map[code] || 'Erro inesperado. Tente novamente.';
}

async function upsertUserProfile(fbUser: FBUser, extra?: Partial<UnifiedUser>) {
  const ref = doc(firestore, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Novo utilizador — criar perfil compatível com KayaMoz
    const profile: Omit<UnifiedUser, 'uid'> = {
      name: fbUser.displayName || extra?.name || 'Utilizador',
      email: fbUser.email || '',
      phone: extra?.phone || '',
      bairro: extra?.bairro || '',
      provincia: extra?.provincia || 'Maputo',
      avatar: fbUser.email?.[0]?.toUpperCase() || 'U',
      photoURL: fbUser.photoURL || '',
      points: 50,
      role: 'user',
      platform: extra?.platform || 'netek',
      emailVerified: fbUser.emailVerified,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      referralCode: `NK${fbUser.uid.slice(0, 6).toUpperCase()}`,
      referredBy: extra?.referredBy || '',
      ...extra,
    };
    await setDoc(ref, profile);
    return { uid: fbUser.uid, ...profile };
  } else {
    // Utilizador existente — actualizar último login e plataforma
    const data = snap.data() as Omit<UnifiedUser, 'uid'>;

    // Se o perfil veio do KayaMoz e agora faz login via Netek → marcar como "ambos"
    const newPlatform =
      data.platform === 'kayamoz' ? 'ambos' :
      data.platform === 'netek'   ? 'netek'  : data.platform;

    await updateDoc(ref, {
      lastLogin: serverTimestamp(),
      emailVerified: fbUser.emailVerified,
      photoURL: fbUser.photoURL || data.photoURL || '',
      platform: newPlatform,
    });
    return { uid: fbUser.uid, ...data, platform: newPlatform };
  }
}

// ────────────────────────────────────────────────────────────
// Hook principal
// ────────────────────────────────────────────────────────────
export function useUnifiedAuth() {
  const [fbUser, setFbUser] = useState<FBUser | null>(null);
  const [profile, setProfile] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      if (u) {
        const p = await upsertUserProfile(u);
        setProfile({ uid: u.uid, ...(p as Omit<UnifiedUser,'uid'>) });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = useCallback(async (
    email: string, password: string, name: string,
    phone: string, bairro: string, provincia: string, referredBy?: string,
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const p = await upsertUserProfile(cred.user, { name, phone, bairro, provincia, referredBy, platform: 'netek' });
    setProfile({ uid: cred.user.uid, ...(p as Omit<UnifiedUser,'uid'>) });
    return cred.user;
  }, []);

  const loginEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await upsertUserProfile(cred.user);
    setProfile({ uid: cred.user.uid, ...(p as Omit<UnifiedUser,'uid'>) });
    return cred.user;
  }, []);

  const loginGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const p = await upsertUserProfile(cred.user, { platform: 'google' });
    setProfile({ uid: cred.user.uid, ...(p as Omit<UnifiedUser,'uid'>) });
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setFbUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback((email: string) =>
    sendPasswordResetEmail(auth, email), []);

  const checkEmailExists = useCallback(async (email: string) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return { exists: methods.length > 0, methods };
    } catch {
      return { exists: false, methods: [] };
    }
  }, []);

  return { fbUser, profile, loading, register, loginEmail, loginGoogle, logout, resetPassword, checkEmailExists };
}

// ────────────────────────────────────────────────────────────
// COMPONENTE MODAL DE AUTH UNIFICADO
// ────────────────────────────────────────────────────────────
interface UnifiedAuthModalProps {
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

const PROVINCIAS = ['Maputo Cidade','Maputo Província','Gaza','Inhambane','Sofala','Manica','Tete','Zambézia','Nampula','Cabo Delgado','Niassa'];

export function UnifiedAuthModal({ onClose, initialTab = 'login' }: UnifiedAuthModalProps) {
  const { register, loginEmail, loginGoogle, resetPassword, checkEmailExists } = useUnifiedAuth();

  const [tab, setTab] = useState<'login' | 'register' | 'reset'>(initialTab);
  const [step, setStep] = useState<1 | 2>(1); // registo em 2 passos
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [kayamozDetected, setKayamozDetected] = useState(false);

  // Campos comuns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Campos de registo
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bairro, setBairro] = useState('');
  const [provincia, setProvincia] = useState('Maputo Cidade');
  const [referredBy, setReferredBy] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const clearError = () => { setError(''); setSuccess(''); };

  // Detectar conta KayaMoz ao digitar email
  const onEmailBlur = async () => {
    if (!email.includes('@')) return;
    const { exists } = await checkEmailExists(email);
    setKayamozDetected(exists && tab === 'register');
  };

  // ── Login ─────────────────────────────────────────────────
  const handleLogin = async () => {
    clearError(); setLoading(true);
    try {
      await loginEmail(email, password);
      onClose();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code || '';
      setError(parseFirebaseError(code));
    } finally { setLoading(false); }
  };

  // ── Login Google ──────────────────────────────────────────
  const handleGoogle = async () => {
    clearError(); setGoogleLoading(true);
    try {
      await loginGoogle();
      onClose();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code || '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(parseFirebaseError(code));
      }
    } finally { setGoogleLoading(false); }
  };

  // ── Registo passo 1 → 2 ──────────────────────────────────
  const handleRegisterStep1 = async () => {
    clearError();
    if (!name.trim()) return setError('Insira o seu nome.');
    if (!email.includes('@')) return setError('Insira um email válido.');
    if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não coincidem.');
    setStep(2);
  };

  // ── Registo final ─────────────────────────────────────────
  const handleRegister = async () => {
    clearError(); setLoading(true);
    if (!acceptTerms) { setError('Aceite os Termos e a Política de Privacidade.'); setLoading(false); return; }
    try {
      await register(email, password, name, phone, bairro, provincia, referredBy);
      onClose();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code || '';
      setError(parseFirebaseError(code));
      if (code === 'auth/email-already-in-use') setStep(1);
    } finally { setLoading(false); }
  };

  // ── Reset de senha ────────────────────────────────────────
  const handleReset = async () => {
    clearError(); setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Email de recuperação enviado! Verifique a sua caixa de entrada.');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code || '';
      setError(parseFirebaseError(code));
    } finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Cabeçalho ─── */}
        <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 border-b border-slate-800 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Logo Netek */}
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30">N</div>
              <span className="text-gray-400 text-sm font-medium">×</span>
              {/* Logo KayaMoz */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                <span className="text-purple-300 font-bold text-sm">Kaya</span>
                <span className="text-purple-400 font-bold text-sm">Moz</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-gray-400 hover:text-white transition-colors">✕</button>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tab === 'login' ? 'Entrar na sua conta' :
             tab === 'register' ? (step === 1 ? 'Criar conta' : 'Completar perfil') :
             'Recuperar senha'}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Uma conta, dois mundos: <span className="text-cyan-400">Netek Services</span> + <span className="text-purple-400">KayaMoz</span>
          </p>
        </div>

        <div className="p-6">
          {/* ─── Tabs ─── */}
          {tab !== 'reset' && (
            <div className="flex gap-1 mb-5 bg-slate-800/60 p-1 rounded-2xl">
              {[{ id: 'login' as const, l: '🚀 Entrar' }, { id: 'register' as const, l: '📝 Criar conta' }].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); clearError(); setStep(1); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
                >{t.l}</button>
              ))}
            </div>
          )}

          {/* ─── Erros / Sucesso ─── */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/15 border border-red-500/25 rounded-xl">
              <span className="text-red-400 text-lg shrink-0">⚠️</span>
              <p className="text-red-300 text-sm leading-snug">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-green-500/15 border border-green-500/25 rounded-xl">
              <span className="text-green-400 text-lg shrink-0">✅</span>
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              LOGIN
          ═══════════════════════════════════════════════ */}
          {tab === 'login' && (
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-60 shadow-md"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'A entrar com Google...' : 'Continuar com Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-gray-600 text-xs">ou com email</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => { setTab('reset'); clearError(); }} className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">Esqueci a senha</button>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-40 shadow-lg shadow-cyan-500/25"
              >
                {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A entrar...</span> : '🚀 Entrar'}
              </button>

              {/* Link KayaMoz */}
              <div className="text-center pt-2 border-t border-slate-800">
                <p className="text-gray-600 text-xs mb-2">Tem conta no KayaMoz?</p>
                <a
                  href="https://jonsonjb.github.io/kayamoz/login.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-medium hover:bg-purple-500/25 transition-all"
                >
                  🔍 Entrar via KayaMoz
                </a>
                <p className="text-gray-700 text-[10px] mt-1">As contas são partilhadas pelo Firebase</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              REGISTO — PASSO 1
          ═══════════════════════════════════════════════ */}
          {tab === 'register' && step === 1 && (
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-60 shadow-md"
              >
                {googleLoading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'A registar com Google...' : 'Registar com Google'}
              </button>

              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-700" /><span className="text-gray-600 text-xs">ou com email</span><div className="flex-1 h-px bg-slate-700" /></div>

              {kayamozDetected && (
                <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-start gap-2">
                  <span className="text-purple-400 text-lg shrink-0">🔍</span>
                  <p className="text-purple-300 text-xs">Este email já tem conta no <strong>KayaMoz</strong>! Pode fazer login directamente — a conta funciona aqui também.</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nome completo *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={onEmailBlur} placeholder="seu@email.com" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Senha *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showPass ? '🙈' : '👁️'}</button>
                </div>
                {/* Força da senha */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[
                      password.length >= 6,
                      /[A-Z]/.test(password),
                      /[0-9]/.test(password),
                      /[^a-zA-Z0-9]/.test(password),
                    ].map((ok, i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all ${ok ? 'bg-green-400' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Confirmar senha *</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" className={`w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border focus:outline-none text-sm transition-all pr-12 ${confirm && confirm !== password ? 'border-red-500' : 'border-slate-700 focus:border-cyan-500'}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showConfirm ? '🙈' : '👁️'}</button>
                </div>
                {confirm && confirm !== password && <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>}
              </div>

              <button onClick={handleRegisterStep1} disabled={!name || !email || !password || !confirm} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/25">
                Continuar →
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              REGISTO — PASSO 2
          ═══════════════════════════════════════════════ */}
          {tab === 'register' && step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white text-sm transition-colors">←</button>
                <span className="text-gray-400 text-sm">Passo 2 de 2 — Dados do perfil</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Telefone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258 84..." className="w-full px-3 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Bairro</label>
                  <input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Ex: Sommerschield" className="w-full px-3 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Província</label>
                <select value={provincia} onChange={e => setProvincia(e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm">
                  {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">🎁 Código de indicação (opcional)</label>
                <input value={referredBy} onChange={e => setReferredBy(e.target.value.toUpperCase())} placeholder="Ex: NK1A2B3C" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm font-mono tracking-wider" />
              </div>

              {/* Termos */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${acceptTerms ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 group-hover:border-cyan-500'}`} onClick={() => setAcceptTerms(!acceptTerms)}>
                  {acceptTerms && <span className="text-white text-xs">✓</span>}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Aceito os{' '}
                  <a href="https://jonsonjb.github.io/kayamoz/termos.html" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="https://jonsonjb.github.io/kayamoz/privacidade.html" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Política de Privacidade</a>{' '}
                  do Netek Services e KayaMoz.
                </p>
              </label>

              <button onClick={handleRegister} disabled={loading || !acceptTerms} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold hover:from-green-600 hover:to-green-700 disabled:opacity-40 transition-all shadow-lg shadow-green-500/20">
                {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A criar conta...</span> : '✅ Criar Conta'}
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-[10px]">A sua conta funciona automaticamente em</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-full">Netek Services</span>
                  <span className="text-gray-700 text-xs">+</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full">KayaMoz</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              RESET DE SENHA
          ═══════════════════════════════════════════════ */}
          {tab === 'reset' && (
            <div className="space-y-4">
              <button onClick={() => { setTab('login'); clearError(); }} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
                ← Voltar ao login
              </button>
              <p className="text-gray-400 text-sm">Insira o seu email e enviaremos um link para redefinir a senha.</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email da conta</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleReset()} placeholder="seu@email.com" className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm transition-all" />
              </div>
              <button onClick={handleReset} disabled={loading || !email} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 transition-all">
                {loading ? '⏳ A enviar...' : '📧 Enviar Link de Recuperação'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// AVATAR DO UTILIZADOR (para o Header)
// ────────────────────────────────────────────────────────────
export function UserAvatarButton({
  profile,
  fbUser,
  onOpenProfile,
  onLogin,
  onLogout,
}: {
  profile: UnifiedUser | null;
  fbUser: FBUser | null;
  onOpenProfile: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const [dropOpen, setDropOpen] = useState(false);

  if (!fbUser) {
    return (
      <button
        onClick={onLogin}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
      >
        🚀 Entrar
      </button>
    );
  }

  const initials = (profile?.name || fbUser.displayName || fbUser.email || 'U')[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setDropOpen(!dropOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all"
      >
        {fbUser.photoURL ? (
          <img src={fbUser.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
        )}
        <span className="text-white text-sm font-medium hidden sm:block max-w-24 truncate">
          {profile?.name?.split(' ')[0] || fbUser.displayName?.split(' ')[0] || 'Conta'}
        </span>
        {profile?.platform === 'ambos' && <span className="text-[8px] px-1 py-0.5 bg-purple-500/30 text-purple-300 rounded">×2</span>}
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </button>

      {dropOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setDropOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
            {/* Info do utilizador */}
            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {fbUser.photoURL ? (
                  <img src={fbUser.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{initials}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{profile?.name || fbUser.displayName || 'Utilizador'}</p>
                  <p className="text-gray-500 text-xs truncate">{fbUser.email}</p>
                </div>
              </div>
              {profile?.platform && (
                <div className="flex items-center gap-1.5 mt-2">
                  {(profile.platform === 'netek' || profile.platform === 'ambos' || profile.platform === 'google') && (
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[9px] rounded-md">Netek</span>
                  )}
                  {(profile.platform === 'kayamoz' || profile.platform === 'ambos') && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] rounded-md">KayaMoz</span>
                  )}
                  {profile.platform === 'google' && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded-md">Google</span>
                  )}
                  <span className="ml-auto text-yellow-400 text-xs font-semibold">🏆 {profile.points || 0} pts</span>
                </div>
              )}
            </div>
            {/* Acções */}
            <div className="p-2">
              {[
                { icon:'👤', label:'O meu perfil', action: () => { onOpenProfile(); setDropOpen(false); } },
                { icon:'🔍', label:'KayaMoz (integrado)', action: () => { onOpenProfile(); setDropOpen(false); } },
              ].map((item, i) => (
                <button key={i} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all text-left">
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
              <div className="h-px bg-slate-700 my-1" />
              <button onClick={() => { onLogout(); setDropOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all text-left">
                <span>🚪</span>Terminar sessão
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
