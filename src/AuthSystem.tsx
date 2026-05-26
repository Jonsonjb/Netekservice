/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║      NETEK SERVICES — SISTEMA DE AUTENTICAÇÃO ADMIN / MOD       ║
 * ║                                                                  ║
 * ║  Stack: React + TypeScript (simula Node/Express no browser)      ║
 * ║  JWT simulado com btoa/atob — mesma lógica de produção           ║
 * ║  Para Node.js real: ver comentários "PRODUÇÃO" ao longo          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * UTILIZADORES DE TESTE:
 *   netekservcice@gmail.com / Master@2025!Netek → role: 'admin' (MASTER)
 *   admin@netek.com   / Admin@2025!Netek  → role: 'admin'
 *   mod@netek.com     / Mod@2025!Netek    → role: 'moderator'
 *
 * ESTRUTURA DO FICHEIRO:
 *   1. ── BASE DE DADOS MOCKADA (simula tabela SQL / MongoDB)
 *   2. ── MOTOR JWT (encode / decode / verify)
 *   3. ── "SERVIDOR" (lógica de rotas POST /api/login em browser)
 *   4. ── MIDDLEWARE de protecção de rotas
 *   5. ── FRONT-END: Tela de Login  (/admin)
 *   6. ── FRONT-END: Dashboard Admin (/admin/dashboard)
 *   7. ── FRONT-END: Dashboard Moderador (/mod/dashboard)
 *   8. ── ROUTER principal que replica next/react-router
 */

import { useState, useEffect, useCallback } from 'react';
import { MASTER_EMAIL, MASTER_PASS } from './data';

/* ══════════════════════════════════════════════════════════════════
   1.  BASE DE DADOS MOCKADA
       Em produção → PostgreSQL / MongoDB / Firebase Firestore
   ══════════════════════════════════════════════════════════════════ */

/** Hash simples de senha (em produção: bcrypt.hash() no Node.js) */
function hashPassword(plain: string): string {
  // Simula resultado de bcrypt — cada caractere vira código + salt
  let hash = 0;
  const SALT = 'NETEK_SALT_2025';
  const salted = plain + SALT;
  for (let i = 0; i < salted.length; i++) {
    hash = (Math.imul(31, hash) + salted.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0') + btoa(plain).slice(0, 12);
}

function verifyPassword(plain: string, storedHash: string): boolean {
  return hashPassword(plain) === storedHash;
}

type Role = 'admin' | 'moderator';

interface DBUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar: string;
  createdAt: string;
  lastLogin: string | null;
  active: boolean;
  permissions: string[];
}

const ALL_ADMIN_PERMISSIONS = [
  'dashboard:read', 'metrics:read',
  'users:read', 'users:write', 'users:delete', 'users:ban', 'users:suspend',
  'moderators:read', 'moderators:create', 'moderators:update', 'moderators:delete', 'moderators:manage',
  'content:read', 'content:moderate', 'content:create', 'content:update', 'content:delete',
  'tourism:moderate', 'hotels:moderate', 'markets:moderate', 'rentals:moderate', 'cars:moderate',
  'config:read', 'config:write', 'scraping:read', 'scraping:write', 'scraping:force',
  'reports:read', 'reports:write', 'reports:export',
  'blacklist:read', 'blacklist:write', 'whitelist:read', 'whitelist:write',
  'audit:read', 'system:superadmin',
];

function isMasterAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === MASTER_EMAIL.toLowerCase();
}

// ──────────────────────────────────────────────────────────────────
// Tabela "users" — equivalente a CREATE TABLE users (...)
// Em produção: INSERT INTO users VALUES (...) com bcrypt na senha
// ──────────────────────────────────────────────────────────────────
const MOCK_DB: DBUser[] = [
  {
    id: 0,
    name: 'Administrador Principal Netek',
    email: MASTER_EMAIL,
    passwordHash: hashPassword(MASTER_PASS),
    role: 'admin',
    avatar: '🛡️',
    createdAt: '2025-01-01T00:00:00Z',
    lastLogin: null,
    active: true,
    permissions: ALL_ADMIN_PERMISSIONS,
  },
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@netek.com',
    passwordHash: hashPassword('Admin@2025!Netek'),
    role: 'admin',
    avatar: '👑',
    createdAt: '2025-01-01T00:00:00Z',
    lastLogin: null,
    active: true,
    permissions: ALL_ADMIN_PERMISSIONS,
  },
  {
    id: 2,
    name: 'Moderador',
    email: 'mod@netek.com',
    passwordHash: hashPassword('Mod@2025!Netek'),
    role: 'moderator',
    avatar: '🛡️',
    createdAt: '2025-01-15T00:00:00Z',
    lastLogin: null,
    active: true,
    permissions: [
      'users:read',
      'content:moderate',
      'reports:read',
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════
   2.  MOTOR JWT (browser-safe)
       Em produção → import jwt from 'jsonwebtoken'  (Node.js)
       Código equivalente está nos comentários abaixo
   ══════════════════════════════════════════════════════════════════ */

const JWT_SECRET = 'NETEK_JWT_SECRET_SUPER_SEGURO_2025_NAO_EXPOR'; // ← env var em prod
const JWT_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

interface JWTPayload {
  sub: number;          // user id
  email: string;
  role: Role;
  name: string;
  iat: number;          // issued at (ms)
  exp: number;          // expires at (ms)
  jti: string;          // unique token id (evita replay)
}

/**
 * PRODUÇÃO (Node.js):
 *   const token = jwt.sign({ sub, email, role, name }, process.env.JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' });
 */
function jwtSign(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string {
  const now = Date.now();
  const full: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_TTL_MS,
    jti: crypto.randomUUID(),
  };
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(full));
  // Assinatura HMAC simulada (em prod: crypto.createHmac('sha256', secret))
  const sigInput = `${header}.${body}.${JWT_SECRET}`;
  let sig = 0;
  for (let i = 0; i < sigInput.length; i++) {
    sig = (Math.imul(31, sig) + sigInput.charCodeAt(i)) >>> 0;
  }
  const signature = btoa(sig.toString(16));
  return `${header}.${body}.${signature}`;
}

/**
 * PRODUÇÃO (Node.js):
 *   const decoded = jwt.verify(token, process.env.JWT_SECRET);
 */
function jwtVerify(token: string): { valid: boolean; expired: boolean; payload: JWTPayload | null } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, expired: false, payload: null };

    const payload: JWTPayload = JSON.parse(atob(parts[1]));
    const now = Date.now();
    const expired = now > payload.exp;
    if (expired) return { valid: true, expired: true, payload };

    // Verificar assinatura (em prod: jwt.verify lança se inválido)
    const expectedInput = `${parts[0]}.${parts[1]}.${JWT_SECRET}`;
    let expectedSig = 0;
    for (let i = 0; i < expectedInput.length; i++) {
      expectedSig = (Math.imul(31, expectedSig) + expectedInput.charCodeAt(i)) >>> 0;
    }
    const expectedSignature = btoa(expectedSig.toString(16));
    if (parts[2] !== expectedSignature) return { valid: false, expired: false, payload: null };

    return { valid: true, expired: false, payload };
  } catch {
    return { valid: false, expired: false, payload: null };
  }
}

/* ══════════════════════════════════════════════════════════════════
   3.  "SERVIDOR" — Lógica de rotas simuladas no browser
       Em produção: Node.js + Express
   ══════════════════════════════════════════════════════════════════ */

/**
 * Equivalente à rota:
 *   POST /api/login
 *
 * CÓDIGO NODE.JS/EXPRESS (produção):
 * ─────────────────────────────────
 * app.post('/api/login', async (req, res) => {
 *   const { email, password } = req.body;
 *   if (!email || !password)
 *     return res.status(400).json({ error: 'Campos obrigatórios' });
 *
 *   const user = await db.users.findOne({ email: email.toLowerCase() });
 *   if (!user)
 *     return res.status(401).json({ error: 'Credenciais inválidas' });
 *
 *   const ok = await bcrypt.compare(password, user.passwordHash);
 *   if (!ok)
 *     return res.status(401).json({ error: 'Credenciais inválidas' });
 *
 *   if (!user.active)
 *     return res.status(403).json({ error: 'Conta suspensa' });
 *
 *   const token = jwt.sign(
 *     { sub: user.id, email: user.email, role: user.role, name: user.name },
 *     process.env.JWT_SECRET,
 *     { expiresIn: '8h' }
 *   );
 *
 *   // Actualizar lastLogin
 *   await db.users.update({ id: user.id }, { lastLogin: new Date() });
 *
 *   res.json({ token, role: user.role, name: user.name });
 * });
 */
interface LoginResponse {
  ok: boolean;
  token?: string;
  role?: Role;
  name?: string;
  avatar?: string;
  permissions?: string[];
  error?: string;
  code?: number;
}

async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  // Simula latência de rede
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

  if (!email || !password) return { ok: false, error: 'E-mail e senha são obrigatórios.', code: 400 };

  const user = MOCK_DB.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: 'Credenciais inválidas.', code: 401 };

  if (!verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: 'Credenciais inválidas.', code: 401 };
  }

  if (!user.active) return { ok: false, error: 'Esta conta está suspensa.', code: 403 };

  // Regra prioritária de alta segurança:
  // qualquer autenticação bem-sucedida do MASTER_EMAIL recebe role 'admin'
  // e permissões máximas no JWT, independentemente do valor persistido.
  const effectiveRole: Role = isMasterAdminEmail(user.email) ? 'admin' : user.role;
  const effectivePermissions = isMasterAdminEmail(user.email) ? ALL_ADMIN_PERMISSIONS : user.permissions;

  const token = jwtSign({ sub: user.id, email: user.email, role: effectiveRole, name: user.name });

  // Actualizar lastLogin na "DB"
  const idx = MOCK_DB.findIndex(u => u.id === user.id);
  if (idx !== -1) MOCK_DB[idx].lastLogin = new Date().toISOString();

  return { ok: true, token, role: effectiveRole, name: user.name, avatar: user.avatar, permissions: effectivePermissions };
}

/* ══════════════════════════════════════════════════════════════════
   4.  MIDDLEWARE de protecção de rotas
       Em produção → Express middleware verify JWT em cada rota
   ══════════════════════════════════════════════════════════════════ */

/**
 * CÓDIGO NODE.JS/EXPRESS (produção):
 * ─────────────────────────────────
 * function requireAuth(req, res, next) {
 *   const auth = req.headers['authorization'];
 *   if (!auth?.startsWith('Bearer '))
 *     return res.status(401).json({ error: 'Token ausente' });
 *   try {
 *     req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
 *     next();
 *   } catch {
 *     res.status(401).json({ error: 'Token inválido ou expirado' });
 *   }
 * }
 *
 * function requireAdmin(req, res, next) {
 *   if (req.user.role !== 'admin')
 *     return res.status(403).json({ error: 'Acesso negado' });
 *   next();
 * }
 *
 * app.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
 *   res.send('Painel Admin');
 * });
 *
 * app.get('/mod/dashboard', requireAuth, (req, res) => {
 *   res.send('Painel Moderador');
 * });
 */

const TOKEN_KEY = 'netek_auth_token';

function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

function storeToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

function getSession(): { valid: boolean; payload: JWTPayload | null; reason?: string } {
  const token = getStoredToken();
  if (!token) return { valid: false, payload: null, reason: 'no_token' };
  const { valid, expired, payload } = jwtVerify(token);
  if (!valid) return { valid: false, payload: null, reason: 'invalid_token' };
  if (expired) { clearToken(); return { valid: false, payload: null, reason: 'expired' }; }
  return { valid: true, payload };
}

/* ══════════════════════════════════════════════════════════════════
   5.  FRONT-END — TELA DE LOGIN (/admin)
   ══════════════════════════════════════════════════════════════════ */

type AuthRoute = 'login' | 'admin_dash' | 'mod_dash';

interface LoginScreenProps {
  onSuccess: (route: AuthRoute) => void;
}

function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME    = 60; // segundos

  // Countdown de bloqueio
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCountdown(rem);
      if (rem === 0) { setLockedUntil(0); setAttempts(0); }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  /**
   * handleSubmit → equivale à Fetch API para POST /api/login
   * Em produção:
   *   const res = await fetch('/api/login', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify({ email, password })
   *   });
   *   const data = await res.json();
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil > Date.now()) return;
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // ── Chamada à API (simulada, mas mesma lógica de fetch) ──
      const data = await apiLogin(email.trim(), password);

      if (!data.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCK_TIME * 1000;
          setLockedUntil(until);
          setError(`Muitas tentativas. Bloqueado por ${LOCK_TIME}s.`);
        } else {
          setError(`${data.error || 'Erro'} (${newAttempts}/${MAX_ATTEMPTS} tentativas)`);
        }
        return;
      }

      // ── Guardar token (LocalStorage) ──
      // Em produção também considerar HttpOnly Cookie via Set-Cookie do servidor
      storeToken(data.token!);
      setAttempts(0);

      // ── Redirecionar conforme role ──
      const route: AuthRoute = data.role === 'admin' ? 'admin_dash' : 'mod_dash';
      onSuccess(route);

    } catch (err) {
      setError('Sem ligação ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockedUntil > Date.now();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-slate-950 flex items-center justify-center p-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Netek — Área Restrita</h1>
          <p className="text-slate-400 text-sm mt-1">Painel de Administração e Moderação</p>
          {/* URL de acesso */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-400 text-[11px] font-mono">/admin</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl">

          {/* Bloqueio */}
          {isLocked && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <p className="text-red-400 font-semibold text-sm">Conta temporariamente bloqueada</p>
                <p className="text-red-300/80 text-xs mt-0.5">Desbloqueio automático em <strong>{countdown}s</strong></p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && !isLocked && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center gap-2">
              <span className="text-red-400 text-lg">⚠️</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@netek.com"
                  disabled={isLocked || loading}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-800/60 text-white rounded-2xl border border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm transition-all placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLocked || loading}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-800/60 text-white rounded-2xl border border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm transition-all placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Barra de tentativas */}
            {attempts > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Tentativas: {attempts}/{MAX_ATTEMPTS}</p>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${i < attempts ? 'bg-red-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isLocked || loading || !email || !password}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  A autenticar...
                </span>
              ) : isLocked ? `Bloqueado (${countdown}s)` : 'Entrar →'}
            </button>
          </form>

          {/* Credenciais de teste */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider font-semibold">
              Credenciais de Teste
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { email: MASTER_EMAIL, pass: MASTER_PASS, role: 'Master', color: 'emerald', icon: '🛡️' },
                { email: 'admin@netek.com', pass: 'Admin@2025!Netek', role: 'Admin', color: 'blue', icon: '👑' },
                { email: 'mod@netek.com',   pass: 'Mod@2025!Netek',   role: 'Mod',   color: 'purple', icon: '🛡️' },
              ].map(c => (
                <button
                  key={c.email}
                  onClick={() => { setEmail(c.email); setPassword(c.pass); setError(''); }}
                  disabled={isLocked || loading}
                  className={`p-3 bg-${c.color}-500/10 border border-${c.color}-500/20 rounded-xl text-center hover:bg-${c.color}-500/20 transition-all disabled:opacity-40 cursor-pointer`}
                >
                  <p className="text-lg">{c.icon}</p>
                  <p className="text-white text-xs font-bold mt-0.5">{c.role}</p>
                  <p className="text-slate-500 text-[10px] truncate">{c.email}</p>
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-[10px] text-center mt-3">
              Clique num cartão para pré-preencher os campos
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-slate-600 text-xs mt-4">
          Netek Services © 2025 · Acesso protegido por JWT + Rate Limiting
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   6.  FRONT-END — DASHBOARD ADMIN  (/admin/dashboard)
       Middleware: requireAuth + requireAdmin (role === 'admin')
   ══════════════════════════════════════════════════════════════════ */

function AdminDashboard({
  payload,
  onLogout,
  onGoMod,
}: {
  payload: JWTPayload;
  onLogout: () => void;
  onGoMod: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'config'>('overview');
  const [sessionTime, setSessionTime] = useState(0);

  // Timer de sessão
  useEffect(() => {
    const t = setInterval(() => setSessionTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const tokenExpiry = payload.exp - Date.now();
  const expiryMins  = Math.floor(tokenExpiry / 60000);
  const expirySecs  = Math.floor((tokenExpiry % 60000) / 1000);

  const mockUsers = [
    { id: 0, name: 'Administrador Principal', email: MASTER_EMAIL,       role: 'admin',     status: 'activo',   lastLogin: 'Agora' },
    { id: 1, name: 'Super Admin',             email: 'admin@netek.com',  role: 'admin',     status: 'activo',   lastLogin: 'Há 10min' },
    { id: 2, name: 'Moderador',               email: 'mod@netek.com',    role: 'moderator', status: 'activo',   lastLogin: 'Há 2h' },
    { id: 3, name: 'João Silva',              email: 'joao@email.com',   role: 'user',      status: 'activo',   lastLogin: 'Ontem' },
    { id: 4, name: 'Spam User',               email: 'spam@fake.com',    role: 'user',      status: 'suspenso', lastLogin: 'Há 3d' },
  ];

  const mockLogs = [
    { id: 1, action: 'LOGIN_MASTER_SUCESSO', user: MASTER_EMAIL,      ts: 'Agora',    ip: '196.26.x.x' },
    { id: 2, action: 'USER_SUSPENSO',        user: MASTER_EMAIL,      ts: 'Há 5min',  ip: '196.26.x.x' },
    { id: 3, action: 'CONTEUDO_REMOVIDO',   user: 'mod@netek.com',   ts: 'Há 12min', ip: '196.1.x.x' },
    { id: 4, action: 'LOGIN_FALHOU',        user: 'hacker@evil.com', ts: 'Há 1h',    ip: '185.x.x.x' },
    { id: 5, action: 'CONFIG_ALTERADA',     user: 'admin@netek.com', ts: 'Há 2h',    ip: '196.26.x.x' },
  ];

  const logColor = (a: string) =>
    a.includes('SUCESSO') ? 'text-green-400' :
    a.includes('FALHOU') || a.includes('BLOQUEADO') ? 'text-red-400' :
    a.includes('SUSPENSO') || a.includes('REMOVIDO') ? 'text-orange-400' : 'text-cyan-400';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── TOPBAR ── */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Netek Admin Dashboard</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full font-semibold uppercase">/admin/dashboard</span>
            </div>
            <p className="text-slate-500 text-xs">Role: <span className="text-blue-400 font-mono">admin</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Token expiry */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${expiryMins < 30 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Token: {expiryMins}m{expirySecs}s
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
            <span className="text-xl">{payload.name.includes('Admin') ? '👑' : '🛡️'}</span>
            <span className="text-white text-sm font-medium hidden sm:block">{payload.name}</span>
          </div>
          <button onClick={onLogout} className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition-all">
            🚪 Sair
          </button>
        </div>
      </header>

      {/* ── ROUTE INDICATOR ── */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 px-6 py-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="text-green-400 font-mono">GET</span>
        <span className="font-mono">/admin/dashboard</span>
        <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">200 OK</span>
        <span className="ml-auto font-mono">Middleware: requireAuth ✓ · requireAdmin ✓</span>
      </div>

      <div className="flex flex-1">
        {/* ── SIDEBAR ── */}
        <aside className="w-56 bg-slate-900 border-r border-slate-800 p-4 hidden md:flex flex-col">
          <nav className="space-y-1 flex-1">
            {[
              { id: 'overview' as const, icon: '📊', label: 'Visão Geral' },
              { id: 'users'    as const, icon: '👥', label: 'Utilizadores' },
              { id: 'logs'     as const, icon: '📋', label: 'Logs de Acesso' },
              { id: 'config'   as const, icon: '⚙️', label: 'Configurações' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === item.id ? 'bg-blue-500/20 text-blue-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span>{item.icon}</span>{item.label}
                {activeTab === item.id && <span className="ml-auto w-1.5 h-5 bg-blue-400 rounded-full" />}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onGoMod}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              🛡️ Ver painel /mod
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">📊 Visão Geral</h2>
                <p className="text-slate-500 text-sm mt-1">Sessão activa há {Math.floor(sessionTime / 60)}m{sessionTime % 60}s · {new Date().toLocaleString('pt-MZ')}</p>
              </div>
              {/* JWT Info */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🔑 Token JWT Decodificado</h3>
                <div className="grid md:grid-cols-2 gap-3 font-mono text-xs">
                  {[
                    { k: 'sub (ID)',   v: String(payload.sub) },
                    { k: 'email',      v: payload.email },
                    { k: 'role',       v: payload.role },
                    { k: 'name',       v: payload.name },
                    { k: 'iat (emitido)',  v: new Date(payload.iat).toLocaleTimeString('pt-MZ') },
                    { k: 'exp (expira)',  v: new Date(payload.exp).toLocaleTimeString('pt-MZ') },
                    { k: 'jti (ID único)',v: payload.jti.slice(0, 18) + '…' },
                    { k: 'algoritmo',  v: 'HS256' },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-xl">
                      <span className="text-slate-500 shrink-0">{k}:</span>
                      <span className={`font-semibold ${k === 'role' ? 'text-blue-400' : 'text-white'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: '👥', label: 'Utilizadores', value: '1.247', diff: '+23 hoje', color: 'blue' },
                  { icon: '🛡️', label: 'Moderadores', value: '3', diff: 'Activos', color: 'purple' },
                  { icon: '🚨', label: 'Denúncias', value: '7', diff: 'Pendentes', color: 'red' },
                  { icon: '📋', label: 'Logs hoje', value: '342', diff: 'Registos', color: 'green' },
                ].map((s, i) => (
                  <div key={i} className={`bg-${s.color}-500/10 border border-${s.color}-500/20 rounded-2xl p-5`}>
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</div>
                    <div className="text-slate-400 text-xs">{s.label}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{s.diff}</div>
                  </div>
                ))}
              </div>
              {/* Instruções de produção */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3">📚 Como Isto Funciona em Produção (Node.js)</h3>
                <div className="space-y-2 text-xs text-slate-400 font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <p className="text-green-400">// 1. POST /api/login → gera token</p>
                    <p>const token = jwt.sign({'{'} sub, email, role {'}'}, SECRET, {'{'} expiresIn: '8h' {'}'});</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <p className="text-green-400">// 2. Cliente guarda token</p>
                    <p>localStorage.setItem('token', token);</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <p className="text-green-400">// 3. Middleware protege rotas</p>
                    <p>app.get('/admin/dashboard', requireAuth, requireAdmin, handler);</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <p className="text-green-400">// 4. Fetch autenticado</p>
                    <p>fetch('/api/data', {'{'} headers: {'{'} Authorization: `Bearer ${'{'}token{'}'}` {'}'} {'}'});</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">👥 Gestão de Utilizadores</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 border-b border-slate-700">
                      {['#', 'Nome', 'Email', 'Role', 'Status', 'Último Login', 'Acções'].map(h => (
                        <th key={h} className="text-left p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((u, i) => (
                      <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                        <td className="p-4 text-slate-600 font-mono text-xs">{u.id}</td>
                        <td className="p-4 text-white font-medium">{u.name}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : u.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1.5 text-xs ${u.status === 'activo' ? 'text-green-400' : 'text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'activo' ? 'bg-green-400' : 'bg-red-400'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{u.lastLogin}</td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            <button className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-all">✏️</button>
                            <button className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-all">🚫</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-slate-600 text-xs">✅ Esta funcionalidade está disponível <strong className="text-blue-400">apenas para admins</strong>. Moderadores vêem "Acesso Negado" nesta secção.</p>
            </div>
          )}

          {/* ── Logs ── */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">📋 Logs de Acesso e Actividade</h2>
              <div className="bg-black border border-green-500/30 rounded-2xl p-4 font-mono">
                <div className="flex items-center gap-2 mb-3">
                  {['bg-red-500','bg-yellow-500','bg-green-500'].map((c, i) => <span key={i} className={`w-3 h-3 ${c} rounded-full`} />)}
                  <span className="text-green-400 text-xs ml-2">netek-audit.log</span>
                </div>
                <div className="space-y-1.5">
                  {mockLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-600">[{log.ts}]</span>
                      <span className={`font-bold ${logColor(log.action)}`}>{log.action}</span>
                      <span className="text-slate-400">user={log.user}</span>
                      <span className="text-slate-600">ip={log.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Config ── */}
          {activeTab === 'config' && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-xl font-bold text-white">⚙️ Configurações do Sistema</h2>
              {[
                { l: 'JWT Secret Key', v: '••••••••••••••••••', note: 'Nunca expor! Manter em variável de ambiente' },
                { l: 'JWT Expiry',     v: '8 horas',           note: 'Após este tempo o utilizador deve fazer novo login' },
                { l: 'Max Tentativas', v: '5',                  note: 'Após 5 falhas, bloqueio por 60 segundos' },
                { l: 'Algoritmo JWT',  v: 'HS256',             note: 'Em produção considerar RS256 (assimétrico)' },
                { l: 'Bcrypt Rounds',  v: '12',                 note: 'Custo do hash de senha (mais alto = mais lento mas mais seguro)' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <span className="text-slate-400 text-sm">{s.l}</span>
                    <span className="text-white font-mono text-sm font-semibold">{s.v}</span>
                  </div>
                  <p className="text-slate-600 text-xs">{s.note}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   7.  FRONT-END — DASHBOARD MODERADOR  (/mod/dashboard)
       Middleware: requireAuth (admin e moderator passam)
   ══════════════════════════════════════════════════════════════════ */

function ModDashboard({
  payload,
  onLogout,
  onGoAdmin,
}: {
  payload: JWTPayload;
  onLogout: () => void;
  onGoAdmin: () => void;
}) {
  const isAdmin = payload.role === 'admin';

  const pendingReports = [
    { id: 1, type: 'Conteúdo Impróprio', subject: 'Post Fórum #124', user: 'user3@email.com', date: 'Há 5min', priority: 'alta' },
    { id: 2, type: 'Avaliação Falsa',    subject: 'Perfil Carlos M.',  user: 'user7@email.com', date: 'Há 12min', priority: 'média' },
    { id: 3, type: 'Spam',               subject: 'Chat #geral',       user: 'spam@fake.com',   date: 'Há 1h',   priority: 'baixa' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── TOPBAR ── */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Netek Mod Dashboard</span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full font-semibold uppercase">/mod/dashboard</span>
              {isAdmin && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full font-semibold">via admin</span>}
            </div>
            <p className="text-slate-500 text-xs">Role: <span className={`font-mono ${isAdmin ? 'text-blue-400' : 'text-purple-400'}`}>{payload.role}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={onGoAdmin} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold hover:bg-blue-500/30 transition-all">
              ← /admin
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
            <span className="text-xl">{isAdmin ? '👑' : '🛡️'}</span>
            <span className="text-white text-sm font-medium hidden sm:block">{payload.name}</span>
          </div>
          <button onClick={onLogout} className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition-all">
            🚪 Sair
          </button>
        </div>
      </header>

      {/* ── ROUTE INDICATOR ── */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 px-6 py-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="text-green-400 font-mono">GET</span>
        <span className="font-mono">/mod/dashboard</span>
        <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">200 OK</span>
        <span className="ml-auto font-mono">Middleware: requireAuth ✓ · (admin OU mod) ✓</span>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Aviso de acesso */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-blue-400 font-semibold text-sm">Acesso como Administrador</p>
              <p className="text-slate-400 text-xs">Admins também acedem a esta área. Só moderadores <strong>não</strong> acedem a /admin/dashboard.</p>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-6">🛡️ Central de Moderação</h2>

        {/* Denúncias pendentes */}
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            🚨 Denúncias Pendentes
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">{pendingReports.length}</span>
          </h3>
          <div className="space-y-3">
            {pendingReports.map(r => (
              <div key={r.id} className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${r.priority === 'alta' ? 'bg-red-500/10 border-red-500/20' : r.priority === 'média' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${r.priority === 'alta' ? 'bg-red-500/20 text-red-400' : r.priority === 'média' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                    {r.priority}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium">{r.type}</p>
                    <p className="text-slate-400 text-xs">{r.subject} · {r.user} · {r.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30">✅ Resolver</button>
                  <button className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30">🗑️ Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissões */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🔐 As suas permissões (do JWT)</h3>
          <div className="flex flex-wrap gap-2">
            {(isAdmin
              ? ALL_ADMIN_PERMISSIONS
              : ['users:read','content:moderate','reports:read']
            ).map(perm => (
              <span key={perm} className={`px-3 py-1 rounded-full text-xs font-mono ${isAdmin ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                {perm}
              </span>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-3">
            💡 Em produção: verificar permissões individuais no middleware antes de executar cada operação
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   8.  ROUTER PRINCIPAL  — Equivale ao React Router / Next.js
   ══════════════════════════════════════════════════════════════════ */

type ViewState = 'login' | 'admin_dash' | 'mod_dash' | 'access_denied';

export function AuthSystemApp() {
  const [view, setView]       = useState<ViewState>('login');
  const [payload, setPayload] = useState<JWTPayload | null>(null);
  const [deniedMsg, setDeniedMsg] = useState('');

  // ── Verificar token existente ao montar (simula page load / refreshToken) ──
  useEffect(() => {
    const session = getSession();
    if (session.valid && session.payload) {
      setPayload(session.payload);
      setView(session.payload.role === 'admin' ? 'admin_dash' : 'mod_dash');
    }
  }, []);

  const handleLoginSuccess = useCallback((route: AuthRoute) => {
    const session = getSession();
    if (session.valid && session.payload) {
      setPayload(session.payload);
    }
    setView(route === 'admin_dash' ? 'admin_dash' : 'mod_dash');
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setPayload(null);
    setView('login');
  }, []);

  /** Simula moderador a tentar aceder /admin/dashboard → 403 Forbidden */
  const tryGoAdmin = useCallback(() => {
    if (!payload) { setView('login'); return; }
    if (payload.role === 'admin') {
      setView('admin_dash');
    } else {
      setDeniedMsg(`⛔ 403 Forbidden — A rota /admin/dashboard requer role: "admin". O seu role é: "${payload.role}".`);
      setView('access_denied');
    }
  }, [payload]);

  const tryGoMod = useCallback(() => {
    if (!payload) { setView('login'); return; }
    setView('mod_dash'); // admin e moderator passam
  }, [payload]);

  // ── GUARD: sem sessão redireciona para login ──
  if (!payload && view !== 'login') {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  // ── 403 Access Denied ──
  if (view === 'access_denied') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6">⛔</div>
          <h1 className="text-3xl font-bold text-red-400 mb-3">403 — Acesso Negado</h1>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6">
            <p className="text-red-300 text-sm leading-relaxed">{deniedMsg}</p>
            <div className="mt-4 p-3 bg-black rounded-xl font-mono text-xs text-left">
              <p className="text-green-400">// Middleware Node.js</p>
              <p className="text-slate-300">if (req.user.role !== 'admin')</p>
              <p className="text-red-400 ml-4">return res.status(403)</p>
              <p className="text-red-400 ml-6">.json({'{'} error: 'Forbidden' {'}'});</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setView(payload?.role === 'admin' ? 'admin_dash' : 'mod_dash')} className="px-6 py-3 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-600 transition-all">
              ← Voltar
            </button>
            <button onClick={handleLogout} className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold hover:bg-red-500/30 transition-all">
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'login'      && <LoginScreen onSuccess={handleLoginSuccess} />}
      {view === 'admin_dash' && payload && <AdminDashboard payload={payload} onLogout={handleLogout} onGoMod={tryGoMod} />}
      {view === 'mod_dash'   && payload && <ModDashboard payload={payload} onLogout={handleLogout} onGoAdmin={tryGoAdmin} />}
    </>
  );
}
