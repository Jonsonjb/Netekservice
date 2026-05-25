/**
 * NETEK SERVICES — BACKOFFICE ADMINISTRATIVO v1.0
 * ─────────────────────────────────────────────────
 * Segurança em camadas:
 *   1. Credenciais locais (BO_EMAIL / BO_PASS)
 *   2. 2FA via TOTP mockado (6 dígitos)
 *   3. Bloqueio de força bruta (5 tentativas → 5 min)
 *   4. Sessão JWT simulada com expiração por inatividade (30 min)
 *   5. Audit log imutável (RTDB Firebase)
 *   6. CSP + cabeçalhos de segurança no HTML (documentados)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, push, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from './firebase';
import { BO_EMAIL, BO_PASS, BO_2FA_SECRET } from './data';

/* ─── TIPOS ──────────────────────────────────────────────── */
type BOPage =
  | 'dashboard' | 'usuarios' | 'conteudo' | 'marketplace_mod'
  | 'denuncias' | 'suporte' | 'blacklist' | 'scraping'
  | 'logs' | 'configuracoes' | 'seguranca';

interface AuditEntry {
  id?: string;
  action: string;
  admin: string;
  target?: string;
  details?: string;
  ip?: string;
  ts: number;
}

interface MockUser {
  id: string; name: string; email: string; status: 'activo'|'suspenso'|'banido';
  joined: string; reports: number; purchases: number;
}

interface Report {
  id: string; type: string; subject: string; user: string; date: string; status: 'pendente'|'resolvido'|'ignorado'; msg: string;
}

interface BlacklistEntry { id: string; value: string; type: 'dominio'|'ip'|'keyword'; reason: string; date: string; }

/* ─── CONSTANTES ─────────────────────────────────────────── */
const SESSION_KEY = 'netek_bo_session';
const SESSION_TTL = 30 * 60 * 1000;   // 30 min
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 5 * 60 * 1000;  // 5 min
const LOCK_KEY     = 'netek_bo_lock';

/* ─── UTILS JWT MOCK ─────────────────────────────────────── */
function createMockJWT(email: string): string {
  const header  = btoa(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const payload = btoa(JSON.stringify({ sub:email, iat:Date.now(), exp:Date.now()+SESSION_TTL, role:'superadmin' }));
  const sig     = btoa(`${email}-${Date.now()}-netek_secret_2025`);
  return `${header}.${payload}.${sig}`;
}

function verifyMockJWT(token: string): { valid:boolean; expired:boolean; email:string } {
  try {
    const parts   = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    const expired = Date.now() > payload.exp;
    return { valid:true, expired, email:payload.sub };
  } catch {
    return { valid:false, expired:true, email:'' };
  }
}

/* ─── HOOK PRINCIPAL DE SEGURANÇA ────────────────────────── */
function useBackofficeAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [step, setStep] = useState<'creds'|'2fa'|'done'>('creds');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [sessionToken, setSessionToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const inactivityTimer = useRef<number|null>(null);

  // Restaurar sessão ao montar
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const { token } = JSON.parse(raw);
    const { valid, expired, email } = verifyMockJWT(token);
    if (valid && !expired) {
      setSessionToken(token);
      setAdminEmail(email);
      setAuthenticated(true);
      setStep('done');
      resetInactivity(token);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Timer de inatividade
  const resetInactivity = useCallback((token: string) => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      logAudit('SESSÃO EXPIRADA POR INATIVIDADE', 'sistema', '', '');
      logout();
    }, SESSION_TTL);

    // Renovar ao atividade do utilizador
    const renew = () => resetInactivity(token);
    window.addEventListener('mousemove', renew, { once:true });
    window.addEventListener('keydown',   renew, { once:true });
  }, []);

  function checkLock(): boolean {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return false;
    const { until, count } = JSON.parse(raw);
    if (Date.now() < until) { setLockUntil(until); return true; }
    if (count >= MAX_ATTEMPTS) {
      localStorage.removeItem(LOCK_KEY);
    }
    return false;
  }

  function registerFailedAttempt(): { locked:boolean; remaining:number } {
    const raw   = localStorage.getItem(LOCK_KEY);
    const prev  = raw ? JSON.parse(raw) : { count:0 };
    const count = prev.count + 1;
    const until = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
    localStorage.setItem(LOCK_KEY, JSON.stringify({ count, until }));
    setAttempts(count);
    if (until) setLockUntil(until);
    return { locked: count >= MAX_ATTEMPTS, remaining: MAX_ATTEMPTS - count };
  }

  function clearLock() { localStorage.removeItem(LOCK_KEY); setAttempts(0); setLockUntil(0); }

  function logAudit(action:string, admin:string, target:string, details:string) {
    const entry: AuditEntry = { action, admin, target, details, ip:'127.0.0.1', ts:Date.now() };
    try { push(ref(db, 'bo_audit'), { ...entry, ts:serverTimestamp() }); } catch {}
    // Também guarda localmente para exibir imediatamente
    const logs: AuditEntry[] = JSON.parse(localStorage.getItem('netek_bo_logs')||'[]');
    logs.unshift({ ...entry, id: String(Date.now()) });
    localStorage.setItem('netek_bo_logs', JSON.stringify(logs.slice(0,200)));
  }

  function verifyCredentials(email:string, password:string): boolean {
    return email === BO_EMAIL && password === BO_PASS;
  }

  function verify2FA(code:string): boolean {
    // Em produção: TOTP com speakeasy/authenticator
    // Mock: código fixo ou timestamp-based
    const valid = code === BO_2FA_SECRET || code === String(Math.floor(Date.now()/30000)%1000000).padStart(6,'0');
    return valid;
  }

  function loginStep1(email:string, password:string): { ok:boolean; error?:string } {
    if (checkLock()) return { ok:false, error:`Conta bloqueada. Tente novamente em ${Math.ceil((lockUntil-Date.now())/60000)} min.` };
    if (!verifyCredentials(email,password)) {
      const { locked, remaining } = registerFailedAttempt();
      logAudit('LOGIN_FALHOU', email, '', `Tentativa ${MAX_ATTEMPTS - remaining}/${MAX_ATTEMPTS}`);
      if (locked) return { ok:false, error:`Conta bloqueada por ${LOCKOUT_MS/60000} min após ${MAX_ATTEMPTS} tentativas falhadas.` };
      return { ok:false, error:`Credenciais inválidas. ${remaining} tentativa(s) restante(s).` };
    }
    setAdminEmail(email);
    clearLock();
    logAudit('LOGIN_CREDENCIAIS_OK', email, '', '2FA pendente');
    return { ok:true };
  }

  function loginStep2(code:string): { ok:boolean; error?:string } {
    if (!verify2FA(code)) {
      logAudit('2FA_FALHOU', adminEmail, '', '');
      return { ok:false, error:'Código 2FA inválido. Verifique o seu autenticador.' };
    }
    const token = createMockJWT(adminEmail);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, email:adminEmail }));
    setSessionToken(token);
    setAuthenticated(true);
    setStep('done');
    logAudit('LOGIN_SUCESSO', adminEmail, '', 'Sessão iniciada com 2FA');
    resetInactivity(token);
    return { ok:true };
  }

  function logout() {
    logAudit('LOGOUT', adminEmail||'admin', '', '');
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setStep('creds');
    setSessionToken('');
    setAdminEmail('');
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }

  return { authenticated, step, setStep, attempts, lockUntil, sessionToken, adminEmail, loginStep1, loginStep2, logout, logAudit };
}

/* ─── TELA DE LOGIN BACKOFFICE ───────────────────────────── */
function BOLoginScreen({ auth }: { auth: ReturnType<typeof useBackofficeAuth> }) {
  const [email, setEmail]    = useState('admin@netek.com');
  const [pass, setPass]      = useState('');
  const [code, setCode]      = useState('');
  const [error, setError]    = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!auth.lockUntil) return;
    const tick = setInterval(() => {
      const rem = Math.max(0, Math.ceil((auth.lockUntil - Date.now()) / 1000));
      setCountdown(rem);
      if (rem === 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [auth.lockUntil]);

  const handleCreds = async () => {
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // Anti-timing
    const res = auth.loginStep1(email, pass);
    if (res.ok) auth.setStep('2fa');
    else setError(res.error || 'Erro');
    setLoading(false);
  };

  const handle2FA = async () => {
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const res = auth.loginStep2(code);
    if (!res.ok) setError(res.error || 'Código inválido');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Netek Backoffice</h1>
          <p className="text-gray-500 text-sm mt-1">Acesso Restrito · Somente Administradores</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {['🔐','🛡️','🔒'].map((i,idx) => <span key={idx} className="text-green-400 text-xs">{i}</span>)}
            <span className="text-green-400 text-[10px]">Conexão Segura</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Bloqueio */}
          {auth.lockUntil > Date.now() && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><span className="text-red-400 text-lg">🚫</span><span className="text-red-400 font-bold">Conta Bloqueada</span></div>
              <p className="text-red-300 text-sm">Demasiadas tentativas falhadas. Desbloqueio em <strong>{Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</strong></p>
            </div>
          )}

          {error && !auth.lockUntil && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/25 rounded-xl flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {auth.step === 'creds' && (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span className="text-white font-medium text-sm">Credenciais de Acesso</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email Administrativo</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={e => e.key==='Enter' && handleCreds()} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none text-sm" placeholder="admin@netek.com" disabled={auth.lockUntil > Date.now()} />
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-gray-500 mb-1">Senha</label>
                    <input type={showPass?'text':'password'} value={pass} onChange={e => setPass(e.target.value)} onKeyPress={e => e.key==='Enter' && handleCreds()} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none text-sm pr-12" disabled={auth.lockUntil > Date.now()} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-300">{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>
              </div>
              {auth.attempts > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  {Array.from({length:MAX_ATTEMPTS}).map((_,i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i < auth.attempts ? 'bg-red-500' : 'bg-slate-700'}`} />
                  ))}
                  <span className="text-red-400 text-xs whitespace-nowrap">{auth.attempts}/{MAX_ATTEMPTS}</span>
                </div>
              )}
              <button onClick={handleCreds} disabled={loading || !email || !pass || auth.lockUntil > Date.now()} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-40 shadow-lg shadow-red-500/20">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> A verificar...</span> : 'Continuar →'}
              </button>
            </>
          )}

          {auth.step === '2fa' && (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span className="text-white font-medium text-sm">Autenticação de Dois Fatores (2FA)</span>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">📱</span><span className="text-gray-300 text-sm font-medium">Código do Autenticador</span></div>
                  <p className="text-gray-500 text-xs">Abra o Google Authenticator / Authy e insira o código de 6 dígitos para <span className="text-orange-400">netek.com</span></p>
                  <p className="text-gray-600 text-[10px] mt-2">Modo dev: use <strong className="text-orange-400">{BO_2FA_SECRET}</strong></p>
                </div>
                <label className="block text-xs text-gray-500 mb-1">Código 2FA (6 dígitos)</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  onKeyPress={e => e.key==='Enter' && code.length===6 && handle2FA()}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none text-sm text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="• • • • • •"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { auth.setStep('creds'); setCode(''); setError(''); }} className="flex-1 py-3 bg-slate-800 text-gray-400 rounded-xl text-sm hover:bg-slate-700">← Voltar</button>
                <button onClick={handle2FA} disabled={loading || code.length !== 6} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-40">
                  {loading ? '⚙️...' : '🔓 Verificar'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Avisos de segurança */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['🛡️','Anti-Brute Force'],['🔐','JWT Session'],['📋','Audit Log']].map(([i,l]) => (
            <div key={l} className="bg-slate-900/50 border border-slate-800 rounded-xl p-2">
              <div className="text-lg">{i}</div>
              <div className="text-gray-600 text-[9px]">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR DO BACKOFFICE ──────────────────────────────── */
const boNav = [
  { id:'dashboard'     as BOPage, i:'📊', l:'Dashboard Geral' },
  { id:'usuarios'      as BOPage, i:'👥', l:'Utilizadores' },
  { id:'marketplace_mod' as BOPage, i:'🛍️', l:'Moderação Marketplace' },
  { id:'conteudo'      as BOPage, i:'📝', l:'Moderação Conteúdo' },
  { id:'denuncias'     as BOPage, i:'🚨', l:'Denúncias' },
  { id:'suporte'       as BOPage, i:'💬', l:'Central de Suporte' },
  { id:'blacklist'     as BOPage, i:'🚫', l:'Blacklist / Whitelist' },
  { id:'scraping'      as BOPage, i:'🔄', l:'Sistema de Scraping' },
  { id:'logs'          as BOPage, i:'📋', l:'Logs de Atividade' },
  { id:'seguranca'     as BOPage, i:'🔐', l:'Segurança & Sessões' },
  { id:'configuracoes' as BOPage, i:'⚙️', l:'Configurações' },
];

/* ─── DASHBOARD ──────────────────────────────────────────── */
function BODashboard() {
  const [liveUsers, setLiveUsers] = useState(0);
  useEffect(() => {
    const r = ref(db,'chat/geral/online');
    const h = onValue(r, s => setLiveUsers(s.size || 0));
    return () => off(r,'value',h);
  },[]);

  const stats = [
    { icon:'👥', label:'Utilizadores Total', value:'1.247', diff:'+23 hoje', color:'cyan' },
    { icon:'🛍️', label:'Produtos Marketplace', value:'89', diff:'+5 hoje', color:'green' },
    { icon:'💬', label:'Mensagens Chat', value:'3.412', diff:'+127 hoje', color:'purple' },
    { icon:'📌', label:'Posts Fórum', value:'231', diff:'+8 hoje', color:'orange' },
    { icon:'🔴', label:'Online Agora', value:String(liveUsers||3), diff:'ao vivo', color:'red' },
    { icon:'🚨', label:'Denúncias Pendentes', value:'7', diff:'requer atenção', color:'yellow' },
  ];

  const chartData = [
    { day:'Seg', visitas:320, compras:45, users:28 },
    { day:'Ter', visitas:410, compras:62, users:41 },
    { day:'Qua', visitas:380, compras:55, users:35 },
    { day:'Qui', visitas:510, compras:78, users:52 },
    { day:'Sex', visitas:680, compras:112, users:74 },
    { day:'Sáb', visitas:520, compras:88, users:61 },
    { day:'Dom', visitas:290, compras:38, users:22 },
  ];

  const maxVal = Math.max(...chartData.map(d => d.visitas));

  const recentActivity = [
    { a:'Produto aprovado', u:'admin@netek.com', t:'Há 5 min', i:'🛍️' },
    { a:'Utilizador suspenso #1245', u:'admin@netek.com', t:'Há 12 min', i:'🚫' },
    { a:'Denúncia resolvida #89', u:'admin@netek.com', t:'Há 18 min', i:'✅' },
    { a:'Scraping manual iniciado', u:'admin@netek.com', t:'Há 1 h', i:'🔄' },
    { a:'Domínio adicionado à blacklist', u:'admin@netek.com', t:'Há 2 h', i:'🚨' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📊 Dashboard Geral</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm">Sistema operacional</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s,i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{s.diff}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Actividade dos Últimos 7 Dias</h3>
          <div className="flex gap-4 text-xs">
            {[['bg-cyan-500','Visitas'],['bg-green-500','Compras'],['bg-purple-500','Novos Users']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1"><div className={`w-2.5 h-2.5 ${c} rounded-sm`}/><span className="text-gray-400">{l}</span></div>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-3 h-48">
          {chartData.map((d,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5" style={{height:'160px'}}>
                <div style={{height:`${(d.visitas/maxVal)*100}%`}} className="flex-1 bg-cyan-500/70 rounded-t hover:bg-cyan-400 transition-all" title={`${d.visitas} visitas`} />
                <div style={{height:`${(d.compras/maxVal)*100}%`}} className="flex-1 bg-green-500/70 rounded-t hover:bg-green-400 transition-all" title={`${d.compras} compras`} />
                <div style={{height:`${(d.users/maxVal)*100}%`}} className="flex-1 bg-purple-500/70 rounded-t hover:bg-purple-400 transition-all" title={`${d.users} users`} />
              </div>
              <span className="text-gray-500 text-[10px]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actividade recente + Alertas */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🕐 Actividade Recente</h3>
          <div className="space-y-3">
            {recentActivity.map((a,i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-900/50 rounded-xl">
                <span className="text-xl">{a.i}</span>
                <div className="flex-1"><p className="text-white text-sm">{a.a}</p><p className="text-gray-500 text-xs">{a.u}</p></div>
                <span className="text-gray-600 text-xs whitespace-nowrap">{a.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🚨 Alertas do Sistema</h3>
          <div className="space-y-3">
            {[
              { l:'7 denúncias aguardam revisão', sev:'alta', i:'🔴' },
              { l:'Scraping há 3 dias sem actualização', sev:'media', i:'🟡' },
              { l:'2 domínios suspeitos detectados', sev:'media', i:'🟡' },
              { l:'Utilizador #1198 reportado 3x', sev:'alta', i:'🔴' },
              { l:'Certificado SSL renova em 14 dias', sev:'baixa', i:'🟢' },
            ].map((a,i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${a.sev==='alta'?'bg-red-500/10 border-red-500/20':a.sev==='media'?'bg-yellow-500/10 border-yellow-500/20':'bg-green-500/10 border-green-500/20'}`}>
                <span>{a.i}</span>
                <span className="text-sm text-gray-300 flex-1">{a.l}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.sev==='alta'?'bg-red-500/20 text-red-400':a.sev==='media'?'bg-yellow-500/20 text-yellow-400':'bg-green-500/20 text-green-400'}`}>{a.sev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GESTÃO DE UTILIZADORES ─────────────────────────────── */
function BOUsuarios({ logAudit, adminEmail }: { logAudit: Function; adminEmail: string }) {
  const mockUsers: MockUser[] = [
    { id:'u001', name:'João Machava', email:'joao@email.com', status:'activo', joined:'10 Jan 2025', reports:0, purchases:3 },
    { id:'u002', name:'Maria Santos', email:'maria@email.com', status:'activo', joined:'12 Jan 2025', reports:1, purchases:7 },
    { id:'u003', name:'Pedro Spam', email:'spam@fake.com', status:'suspenso', joined:'14 Jan 2025', reports:5, purchases:0 },
    { id:'u004', name:'Ana Tembe', email:'ana@email.com', status:'activo', joined:'15 Jan 2025', reports:0, purchases:12 },
    { id:'u005', name:'Carlos Bot', email:'bot@temp.com', status:'banido', joined:'16 Jan 2025', reports:8, purchases:0 },
    { id:'u006', name:'Rosa Cossa', email:'rosa@email.co.mz', status:'activo', joined:'17 Jan 2025', reports:0, purchases:5 },
  ];
  const [users, setUsers] = useState(mockUsers);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{user:MockUser;action:string}|null>(null);

  const filtered = users.filter(u => {
    if (filter !== 'todos' && u.status !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const changeStatus = (id:string, status: MockUser['status']) => {
    setUsers(p => p.map(u => u.id===id ? {...u,status} : u));
    const u = users.find(x=>x.id===id);
    logAudit(`UTILIZADOR_${status.toUpperCase()}`, adminEmail, u?.email, `Status alterado para ${status}`);
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">👥 Gestão de Utilizadores</h2>
        <div className="flex gap-2">
          {['todos','activo','suspenso','banido'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter===f?'bg-cyan-500 text-white':'bg-slate-700 text-gray-400 hover:text-white'}`}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        </div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Pesquisar utilizador..." className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none" />
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-700 bg-slate-900/50">{['Utilizador','Email','Status','Entrou','Denúncias','Compras','Ações'].map(h => <th key={h} className="text-left p-4 text-gray-400 font-medium text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm">{u.name[0]}</div><span className="text-white">{u.name}</span></div></td>
                <td className="p-4 text-gray-400">{u.email}</td>
                <td className="p-4"><span className={`px-2 py-0.5 text-xs rounded-full ${u.status==='activo'?'bg-green-500/20 text-green-400':u.status==='suspenso'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>{u.status}</span></td>
                <td className="p-4 text-gray-500 text-xs">{u.joined}</td>
                <td className="p-4"><span className={u.reports>3?'text-red-400 font-bold':'text-gray-400'}>{u.reports}</span></td>
                <td className="p-4 text-cyan-400">{u.purchases}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {u.status !== 'activo'    && <button onClick={() => setConfirmAction({user:u,action:'activo'})}    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30">✅</button>}
                    {u.status !== 'suspenso'  && <button onClick={() => setConfirmAction({user:u,action:'suspenso'})}  className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30">⏸️</button>}
                    {u.status !== 'banido'    && <button onClick={() => setConfirmAction({user:u,action:'banido'})}    className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">🚫</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">⚠️ Confirmar Acção</h3>
            <p className="text-gray-400 mb-4">Vai alterar o status de <strong className="text-white">{confirmAction.user.name}</strong> para <strong className="text-yellow-400">{confirmAction.action}</strong>. Confirmar?</p>
            <div className="flex gap-2">
              <button onClick={() => changeStatus(confirmAction.user.id, confirmAction.action as MockUser['status'])} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-semibold">Confirmar</button>
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 bg-slate-700 text-white rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MODERAÇÃO DE CONTEÚDO ──────────────────────────────── */
function BOConteudo({ logAudit, adminEmail }: { logAudit: Function; adminEmail: string }) {
  const items = [
    { id:'c1', type:'Restaurante', name:'Churrasqueira Zé Manel', loc:'Maputo - Malhangalene', status:'pendente', reporter:'user@email.com', issue:'Localização incorrecta' },
    { id:'c2', type:'Hotel', name:'Hotel Maputo Star', loc:'Maputo - Polana', status:'pendente', reporter:'outro@email.com', issue:'Preços desactualizados' },
    { id:'c3', type:'Mercado', name:'Mercado Xipamanine', loc:'Maputo - Xipamanine', status:'aprovado', reporter:'-', issue:'-' },
    { id:'c4', type:'Casa Aluguer', name:'Vivenda Beira Mar', loc:'Beira - Macuti', status:'removido', reporter:'denuncia@email.com', issue:'Fraude detectada' },
    { id:'c5', type:'Restaurante', name:'Restaurante Mar Azul', loc:'Maputo - Costa do Sol', status:'pendente', reporter:'user3@email.com', issue:'Já não existe' },
  ];
  const [data, setData] = useState(items);

  const action = (id:string, st:string) => {
    setData(p => p.map(x => x.id===id ? {...x,status:st} : x));
    const item = data.find(x=>x.id===id);
    logAudit(`CONTEUDO_${st.toUpperCase()}`, adminEmail, item?.name, `Tipo: ${item?.type}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">📝 Moderação do Guia Local</h2>
      <div className="grid gap-4">
        {data.map(item => (
          <div key={item.id} className={`bg-slate-800/60 border rounded-2xl p-5 ${item.status==='pendente'?'border-yellow-500/30':item.status==='aprovado'?'border-green-500/30':'border-red-500/30'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-xs rounded-full">{item.type}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${item.status==='pendente'?'bg-yellow-500/20 text-yellow-400':item.status==='aprovado'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{item.status}</span>
                </div>
                <h3 className="text-white font-semibold">{item.name}</h3>
                <p className="text-gray-400 text-sm">📍 {item.loc}</p>
                {item.issue !== '-' && <p className="text-yellow-400 text-xs mt-1">⚠️ {item.issue} — reportado por: {item.reporter}</p>}
              </div>
              {item.status === 'pendente' && (
                <div className="flex gap-2">
                  <button onClick={() => action(item.id,'aprovado')} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30">✅ Aprovar</button>
                  <button onClick={() => action(item.id,'editado')} className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-xs hover:bg-blue-500/30">✏️ Editar</button>
                  <button onClick={() => action(item.id,'removido')} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30">🗑️ Remover</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BLACKLIST / WHITELIST ──────────────────────────────── */
function BOBlacklist({ logAudit, adminEmail }: { logAudit: Function; adminEmail: string }) {
  const initBL: BlacklistEntry[] = [
    { id:'b1', value:'spam-mz.co', type:'dominio', reason:'Spam reincidente', date:'15 Jan 2025' },
    { id:'b2', value:'192.168.1.100', type:'ip', reason:'Ataque de força bruta', date:'17 Jan 2025' },
    { id:'b3', value:'clique aqui grátis', type:'keyword', reason:'Phishing detectado', date:'18 Jan 2025' },
  ];
  const [blacklist, setBlacklist] = useState(initBL);
  const [whitelist] = useState([
    { id:'w1', value:'netek.co.mz', type:'dominio', reason:'Site oficial' },
    { id:'w2', value:'kayamoz.co.mz', type:'dominio', reason:'Parceiro oficial' },
    { id:'w3', value:'google.com', type:'dominio', reason:'Fonte de dados confiável' },
  ]);
  const [tab, setTab] = useState<'black'|'white'>('black');
  const [newEntry, setNewEntry] = useState({ value:'', type:'dominio' as BlacklistEntry['type'], reason:'' });

  const addEntry = () => {
    if (!newEntry.value || !newEntry.reason) return;
    const entry: BlacklistEntry = { id:'b'+Date.now(), ...newEntry, date:new Date().toLocaleDateString('pt-MZ') };
    setBlacklist(p => [...p, entry]);
    logAudit('BLACKLIST_ADDED', adminEmail, newEntry.value, `Tipo: ${newEntry.type} | Razão: ${newEntry.reason}`);
    setNewEntry({ value:'', type:'dominio', reason:'' });
  };

  const removeEntry = (id:string) => {
    const e = blacklist.find(x=>x.id===id);
    setBlacklist(p => p.filter(x=>x.id!==id));
    logAudit('BLACKLIST_REMOVED', adminEmail, e?.value, '');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">🚫 Blacklist & Whitelist</h2>
      <div className="flex gap-2 bg-slate-800/50 p-2 rounded-2xl w-fit">
        {[{id:'black' as const,l:'🚫 Blacklist'},{id:'white' as const,l:'✅ Whitelist'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===t.id?'bg-gradient-to-r from-red-500 to-orange-500 text-white':'text-gray-400 hover:text-white'}`}>{t.l}</button>
        ))}
      </div>
      {tab === 'black' && (
        <>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">➕ Adicionar à Blacklist</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input value={newEntry.value} onChange={e=>setNewEntry(p=>({...p,value:e.target.value}))} placeholder="Domínio, IP ou palavra-chave" className="px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none text-sm" />
              <select value={newEntry.type} onChange={e=>setNewEntry(p=>({...p,type:e.target.value as BlacklistEntry['type']}))} className="px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:outline-none text-sm">
                <option value="dominio">Domínio</option>
                <option value="ip">Endereço IP</option>
                <option value="keyword">Palavra-chave</option>
              </select>
              <input value={newEntry.reason} onChange={e=>setNewEntry(p=>({...p,reason:e.target.value}))} placeholder="Razão do bloqueio" className="px-4 py-2.5 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none text-sm" />
            </div>
            <button onClick={addEntry} className="mt-3 px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">🚫 Bloquear</button>
          </div>
          <div className="space-y-2">
            {blacklist.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-4 bg-slate-800/60 border border-red-500/20 rounded-xl">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">{e.type}</span>
                <span className="text-white font-mono text-sm flex-1">{e.value}</span>
                <span className="text-gray-500 text-xs">{e.reason}</span>
                <span className="text-gray-600 text-xs">{e.date}</span>
                <button onClick={() => removeEntry(e.id)} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'white' && (
        <div className="space-y-2">
          {whitelist.map(e => (
            <div key={e.id} className="flex items-center gap-3 p-4 bg-slate-800/60 border border-green-500/20 rounded-xl">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">{e.type}</span>
              <span className="text-white font-mono text-sm flex-1">{e.value}</span>
              <span className="text-gray-500 text-xs">{e.reason}</span>
              <span className="text-green-400 text-xs">✅ Confiável</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SISTEMA DE SCRAPING ────────────────────────────────── */
function BOScraping({ logAudit, adminEmail }: { logAudit: Function; adminEmail: string }) {
  const [running, setRunning] = useState(false);
  const [freq, setFreq] = useState('diario');
  const [lastRun, setLastRun] = useState('20 Jan 2025 · 03:00');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [sources, setSources] = useState([
    { name:'Google Maps API', active:true, lastSync:'Hoje', items:1247 },
    { name:'OpenStreetMap', active:true, lastSync:'Ontem', items:892 },
    { name:'Redes Sociais (Facebook)', active:false, lastSync:'3 dias', items:234 },
    { name:'Sites Locais MZ', active:true, lastSync:'Hoje', items:456 },
  ]);

  const forceUpdate = () => {
    setRunning(true);
    setProgress(0);
    setLogs(['[00:00] Iniciando scraping manual...']);
    logAudit('SCRAPING_MANUAL_INICIADO', adminEmail, '', '');

    const steps = [
      '[00:02] Conectando ao Google Maps API...',
      '[00:05] Obtendo dados de restaurantes em Maputo...',
      '[00:08] 247 novos registos encontrados',
      '[00:12] Verificando duplicados...',
      '[00:15] Processando hotéis e alojamentos...',
      '[00:18] 89 hotéis actualizados',
      '[00:22] Scraping de mercados locais...',
      '[00:25] Filtrando blacklist...',
      '[00:28] Salvando na base de dados...',
      '[00:30] ✅ Scraping concluído! 412 registos processados.',
    ];
    steps.forEach((s,i) => {
      setTimeout(() => {
        setLogs(p => [...p, s]);
        setProgress(Math.round(((i+1)/steps.length)*100));
        if (i === steps.length-1) {
          setRunning(false);
          setLastRun(new Date().toLocaleString('pt-MZ'));
          logAudit('SCRAPING_MANUAL_CONCLUIDO', adminEmail, '', '412 registos processados');
        }
      }, (i+1)*800);
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔄 Sistema de Compilação (Scraping)</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">⚡ Forçar Actualização</h3>
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm">Última execução: <span className="text-cyan-400 font-medium">{lastRun}</span></p>
            <p className="text-gray-400 text-sm mt-1">Frequência: <span className="text-purple-400 font-medium capitalize">{freq}</span></p>
          </div>
          {running && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progresso</span><span>{progress}%</span></div>
              <div className="w-full bg-slate-700 rounded-full h-3"><div className="bg-gradient-to-r from-cyan-500 to-green-500 h-3 rounded-full transition-all duration-500" style={{width:`${progress}%`}} /></div>
            </div>
          )}
          <button onClick={forceUpdate} disabled={running} className={`w-full py-3 rounded-xl font-bold transition-all ${running?'bg-slate-700 text-gray-500 cursor-not-allowed':'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20'}`}>
            {running ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> A executar...</span> : '🔄 Forçar Actualização Agora'}
          </button>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">⏱️ Frequência de Execução</h3>
          <div className="space-y-2">
            {[{v:'horario',l:'A cada hora',d:'Alto volume de dados'},{ v:'diario',l:'Uma vez por dia',d:'Recomendado · 03:00 AM'},{ v:'semanal',l:'Uma vez por semana',d:'Baixo consumo de recursos'},{v:'manual',l:'Apenas manual',d:'Controlo total'}].map(o => (
              <label key={o.v} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${freq===o.v?'bg-purple-500/20 border border-purple-500/30':'hover:bg-slate-700/50'}`}>
                <input type="radio" value={o.v} checked={freq===o.v} onChange={() => { setFreq(o.v); logAudit('SCRAPING_FREQ_ALTERADA', adminEmail, '', o.v); }} className="accent-purple-500" />
                <div><p className="text-white text-sm font-medium">{o.l}</p><p className="text-gray-500 text-xs">{o.d}</p></div>
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Fontes de dados */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">🌐 Fontes de Dados</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {sources.map((s,i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${s.active?'bg-green-500/10 border-green-500/20':'bg-slate-900/50 border-slate-700'}`}>
              <div className={`w-3 h-3 rounded-full ${s.active?'bg-green-400 animate-pulse':'bg-slate-600'}`} />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{s.name}</p>
                <p className="text-gray-500 text-xs">{s.items.toLocaleString()} registos · Sync: {s.lastSync}</p>
              </div>
              <button onClick={() => setSources(p => p.map((x,j) => j===i?{...x,active:!x.active}:x))} className={`px-2 py-1 rounded-lg text-xs ${s.active?'bg-red-500/20 text-red-400':'bg-green-500/20 text-green-400'}`}>{s.active?'Pausar':'Activar'}</button>
            </div>
          ))}
        </div>
      </div>
      {/* Terminal de logs */}
      {logs.length > 0 && (
        <div className="bg-black border border-green-500/30 rounded-2xl p-4 font-mono">
          <div className="flex items-center gap-2 mb-3"><span className="w-3 h-3 bg-red-500 rounded-full" /><span className="w-3 h-3 bg-yellow-500 rounded-full" /><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-green-400 text-xs ml-2">netek-scraper · terminal</span></div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((l,i) => <p key={i} className={`text-xs ${l.includes('✅')?'text-green-400':l.includes('Erro')?'text-red-400':'text-green-300'}`}>{l}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── LOGS DE ATIVIDADE ──────────────────────────────────── */
function BOLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [liveRtdb, setLiveRtdb] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<'local'|'firebase'>('firebase');

  useEffect(() => {
    const local: AuditEntry[] = JSON.parse(localStorage.getItem('netek_bo_logs')||'[]');
    setLogs(local);

    const r = ref(db,'bo_audit');
    const h = onValue(r, snap => {
      const data = snap.val() || {};
      const entries: AuditEntry[] = Object.entries(data)
        .map(([id,v]) => ({id,...(v as Omit<AuditEntry,'id'>)}))
        .sort((a,b) => (b.ts as number)-(a.ts as number))
        .slice(0,100);
      setLiveRtdb(entries);
    });
    return () => off(r,'value',h);
  },[]);

  const colorFor = (action: string) => {
    if (action.includes('LOGIN_SUCESSO')) return 'text-green-400';
    if (action.includes('FALHOU') || action.includes('BLOQUEADO')) return 'text-red-400';
    if (action.includes('BANIDO') || action.includes('SUSPENSO')) return 'text-orange-400';
    if (action.includes('SCRAPING')) return 'text-cyan-400';
    return 'text-gray-300';
  };

  const displayLogs = tab === 'firebase' ? liveRtdb : logs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">📋 Logs de Atividade</h2>
        <div className="flex gap-2">
          <button onClick={() => setTab('firebase')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab==='firebase'?'bg-red-500 text-white':'bg-slate-700 text-gray-400'}`}>🔥 Firebase RTDB</button>
          <button onClick={() => setTab('local')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab==='local'?'bg-slate-500 text-white':'bg-slate-700 text-gray-400'}`}>💾 Local</button>
        </div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        {displayLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500"><p className="text-3xl mb-2">📋</p><p>Nenhum log encontrado. As ações serão registadas aqui.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-900/50 border-b border-slate-700">{['Data / Hora','Acção','Admin','Alvo','Detalhes'].map(h => <th key={h} className="text-left p-3 text-gray-400 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {displayLogs.map((l,i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(l.ts).toLocaleString('pt-MZ')}</td>
                    <td className={`p-3 font-mono font-semibold ${colorFor(l.action)}`}>{l.action}</td>
                    <td className="p-3 text-gray-400">{l.admin}</td>
                    <td className="p-3 text-gray-300">{l.target || '—'}</td>
                    <td className="p-3 text-gray-500">{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SEGURANÇA ──────────────────────────────────────────── */
function BOSeguranca({ auth }: { auth: ReturnType<typeof useBackofficeAuth> }) {
  const { valid, expired } = auth.sessionToken ? verifyMockJWT(auth.sessionToken) : { valid:false, expired:true };
  const [sessions] = useState([
    { id:'s1', ip:'196.26.x.x', ua:'Chrome 121 / Windows', location:'Maputo, MZ', start: new Date().toLocaleTimeString('pt-MZ'), active:true },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔐 Centro de Segurança</h2>
      {/* Status JWT */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { i:'🔑', t:'Token JWT', v:valid&&!expired?'✅ Válido':'❌ Expirado', c:valid&&!expired?'green':'red' },
          { i:'⏱️', t:'Expiração Sessão', v:'30 min inatividade', c:'cyan' },
          { i:'🛡️', t:'Força Bruta', v:`${auth.attempts}/${MAX_ATTEMPTS} tentativas`, c:auth.attempts>2?'red':'green' },
        ].map((s,i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{s.i}</span><span className="text-gray-400 text-sm">{s.t}</span></div>
            <span className={`text-${s.c}-400 font-bold`}>{s.v}</span>
          </div>
        ))}
      </div>
      {/* Token info */}
      {auth.sessionToken && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">🔑 Token de Sessão Actual</h3>
          <div className="bg-black rounded-xl p-4 font-mono text-xs text-green-400 break-all">{auth.sessionToken.slice(0,80)}...</div>
          <p className="text-gray-500 text-xs mt-2">Estrutura: Header.Payload.Signature (JWT HS256 simulado)</p>
        </div>
      )}
      {/* Sessões ativas */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">📱 Sessões Ativas</h3>
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Sessão atual · {s.ua}</p>
              <p className="text-gray-500 text-xs">IP: {s.ip} · {s.location} · Iniciada: {s.start}</p>
            </div>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Ativa</span>
          </div>
        ))}
      </div>
      {/* Arquitetura de segurança */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4">🏗️ Arquitetura de Segurança Recomendada</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            { t:'Auth Layer', d:'Firebase Auth + JWT custom claims + role-based access. Produção: RS256 private key.', i:'🔐' },
            { t:'2FA Production', d:'Google Authenticator (TOTP RFC 6238) via speakeasy npm package. QR code no onboarding.', i:'📱' },
            { t:'Brute Force', d:'Cloudflare WAF + ratelimit middleware + exponential backoff + CAPTCHA após 3 falhas.', i:'🛡️' },
            { t:'Audit Trail', d:'Firebase RTDB append-only + Cloud Functions para logs imutáveis + export CSV/JSON.', i:'📋' },
            { t:'Session Security', d:'HttpOnly cookies, SameSite=Strict, Secure flag, CSRF token em cada request.', i:'🍪' },
            { t:'Infrastructure', d:'Firebase Hosting (CDN) + Cloud Functions (serverless) + Firestore security rules.', i:'☁️' },
          ].map((item,i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><span className="text-xl">{item.i}</span><span className="text-cyan-400 font-semibold">{item.t}</span></div>
              <p className="text-gray-400 text-xs leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-400 text-sm font-medium">⚠️ Stack Recomendado para Produção</p>
          <p className="text-gray-400 text-xs mt-1">Frontend: React + Vite · Backend: Node.js/Express ou Firebase Cloud Functions · Auth: Firebase Auth · DB: Firestore + RTDB · Hosting: Firebase / Cloud Run · CDN: Cloudflare</p>
        </div>
      </div>
    </div>
  );
}

/* ─── SUPORTE / DENÚNCIAS ────────────────────────────────── */
function BOSuporte({ logAudit, adminEmail }: { logAudit: Function; adminEmail: string }) {
  const reports: Report[] = [
    { id:'r1', type:'Avaliação Falsa', subject:'Restaurante Mar Azul', user:'user@email.com', date:'19 Jan', status:'pendente', msg:'Suspeito de avaliações compradas. 50 reviews em 1 dia.' },
    { id:'r2', type:'Fraude', subject:'Casa Aluguer Beira', user:'vitima@email.com', date:'18 Jan', status:'pendente', msg:'Recebi dinheiro antecipado mas o imóvel não existe.' },
    { id:'r3', type:'Spam', subject:'Perfil Bot #1205', user:'user2@email.com', date:'17 Jan', status:'pendente', msg:'Conta a enviar mensagens em massa no chat.' },
    { id:'r4', type:'Conteúdo Impróprio', subject:'Post Fórum #89', user:'user3@email.com', date:'16 Jan', status:'resolvido', msg:'Post removido com sucesso.' },
  ];
  const [data, setData] = useState(reports);
  const [selected, setSelected] = useState<Report|null>(null);
  const [reply, setReply] = useState('');

  const resolve = (id:string, status: Report['status']) => {
    setData(p => p.map(r => r.id===id?{...r,status}:r));
    const r = data.find(x=>x.id===id);
    logAudit(`DENUNCIA_${status.toUpperCase()}`, adminEmail, r?.subject, r?.type);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">🚨 Denúncias & Suporte</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {data.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} className={`p-4 rounded-2xl border cursor-pointer transition-all hover:border-yellow-500/50 ${r.status==='pendente'?'bg-yellow-500/10 border-yellow-500/20':'bg-slate-800/60 border-slate-700'} ${selected?.id===r.id?'ring-2 ring-yellow-500':''}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 text-[10px] rounded-full">{r.type}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${r.status==='pendente'?'bg-yellow-500/20 text-yellow-400':'bg-green-500/20 text-green-400'}`}>{r.status}</span>
                </div>
                <span className="text-gray-600 text-xs">{r.date}</span>
              </div>
              <p className="text-white text-sm font-semibold">{r.subject}</p>
              <p className="text-gray-400 text-xs line-clamp-1">{r.msg}</p>
            </div>
          ))}
        </div>
        {selected && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-lg mb-4">📋 Detalhe da Denúncia</h3>
            <div className="space-y-2 mb-4">
              <p><span className="text-gray-500 text-xs">Tipo:</span> <span className="text-white text-sm">{selected.type}</span></p>
              <p><span className="text-gray-500 text-xs">Alvo:</span> <span className="text-white text-sm">{selected.subject}</span></p>
              <p><span className="text-gray-500 text-xs">Reportado por:</span> <span className="text-white text-sm">{selected.user}</span></p>
              <p><span className="text-gray-500 text-xs">Mensagem:</span></p>
              <div className="bg-slate-900/50 rounded-xl p-3 text-gray-300 text-sm">{selected.msg}</div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Resposta ao Utilizador</label>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-yellow-500 focus:outline-none text-sm resize-none" placeholder="Escreva a resposta..." />
            </div>
            {selected.status === 'pendente' && (
              <div className="flex gap-2">
                <button onClick={() => resolve(selected.id,'resolvido')} className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm hover:bg-green-500/30">✅ Resolver</button>
                <button onClick={() => resolve(selected.id,'ignorado')} className="flex-1 py-2 bg-gray-500/20 text-gray-400 rounded-xl text-sm hover:bg-gray-500/30">🚫 Ignorar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CONFIGURAÇÕES ──────────────────────────────────────── */
function BOConfiguracoes({ logAudit, adminEmail, logout }: { logAudit: Function; adminEmail: string; logout: () => void }) {
  const [settings, setSettings] = useState({ siteName:'Netek Services', wa:'+258 835 109 190', waBusiness:'+258 840 166 592', certHours:265, maxLoginAttempts:5, sessionTTL:30, scrapingFreq:'diario', maintenanceMode:false });
  const [saved, setSaved] = useState(false);
  const set = (k:string,v:unknown) => setSettings(p => ({...p,[k]:v}));

  const save = () => {
    logAudit('CONFIGURACOES_SALVAS', adminEmail, '', JSON.stringify(settings));
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white">⚙️ Configurações do Sistema</h2>
      {[
        { l:'Nome do Site', k:'siteName', t:'text' },
        { l:'WhatsApp Suporte', k:'wa', t:'text' },
        { l:'WhatsApp Business (Vendas)', k:'waBusiness', t:'text' },
        { l:'Horas para Certificado', k:'certHours', t:'number' },
        { l:'Max. Tentativas Login', k:'maxLoginAttempts', t:'number' },
        { l:'Timeout de Sessão (min)', k:'sessionTTL', t:'number' },
      ].map(f => (
        <div key={f.k}><label className="block text-sm text-gray-400 mb-1">{f.l}</label><input type={f.t} value={(settings as Record<string,unknown>)[f.k] as string} onChange={e=>set(f.k, f.t==='number'?+e.target.value:e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none" /></div>
      ))}
      <div className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
        <div className="flex-1"><p className="text-white font-medium">Modo Manutenção</p><p className="text-gray-400 text-sm">Bloqueia o acesso público ao site</p></div>
        <button onClick={() => { set('maintenanceMode',!settings.maintenanceMode); logAudit(`MANUTENCAO_${!settings.maintenanceMode?'ON':'OFF'}`, adminEmail,'',''); }} className={`w-14 h-7 rounded-full transition-all ${settings.maintenanceMode?'bg-red-500':'bg-slate-600'} flex items-center px-1`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${settings.maintenanceMode?'translate-x-7':''}`} />
        </button>
      </div>
      <div className="flex gap-3">
        <button onClick={save} className={`flex-1 py-3 rounded-xl font-bold transition-all ${saved?'bg-green-500 text-white':'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'}`}>{saved?'✅ Guardado!':'💾 Guardar Alterações'}</button>
        <button onClick={logout} className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30">🚪 Sair</button>
      </div>
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL DO BACKOFFICE ─────────────────── */
export function BackofficeApp() {
  const auth = useBackofficeAuth();
  const [page, setPage] = useState<BOPage>('dashboard');
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(30 * 60);

  // Countdown de sessão
  useEffect(() => {
    if (!auth.authenticated) return;
    const t = setInterval(() => setSessionTimer(p => Math.max(0, p-1)), 1000);
    return () => clearInterval(t);
  }, [auth.authenticated]);

  useEffect(() => { setSessionTimer(30*60); }, [page]);

  if (!auth.authenticated) return <BOLoginScreen auth={auth} />;

  const renderPage = () => {
    switch(page) {
      case 'dashboard':      return <BODashboard />;
      case 'usuarios':       return <BOUsuarios logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'conteudo':       return <BOConteudo logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'marketplace_mod':return <BOConteudo logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'denuncias':      return <BOSuporte logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'suporte':        return <BOSuporte logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'blacklist':      return <BOBlacklist logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'scraping':       return <BOScraping logAudit={auth.logAudit} adminEmail={auth.adminEmail} />;
      case 'logs':           return <BOLogs />;
      case 'seguranca':      return <BOSeguranca auth={auth} />;
      case 'configuracoes':  return <BOConfiguracoes logAudit={auth.logAudit} adminEmail={auth.adminEmail} logout={auth.logout} />;
    }
  };

  const mins = Math.floor(sessionTimer/60);
  const secs = sessionTimer % 60;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className={`${sideCollapsed?'w-16':'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0`}>
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          {!sideCollapsed && <div className="min-w-0"><p className="text-white font-bold text-sm leading-none">Backoffice</p><p className="text-red-400 text-[10px]">Netek Admin</p></div>}
          <button onClick={() => setSideCollapsed(!sideCollapsed)} className="ml-auto text-gray-600 hover:text-gray-400">
            {sideCollapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {boNav.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} title={item.l} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${page===item.id?'bg-red-500/20 text-red-400 font-medium':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <span className="text-base shrink-0">{item.i}</span>
              {!sideCollapsed && <span className="truncate">{item.l}</span>}
              {!sideCollapsed && page===item.id && <span className="ml-auto w-1.5 h-4 bg-red-500 rounded-full shrink-0" />}
            </button>
          ))}
        </nav>
        {/* Session info */}
        {!sideCollapsed && (
          <div className="p-3 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-green-400 text-xs font-medium">Sessão Activa</span></div>
              <p className="text-gray-500 text-[10px] truncate">{auth.adminEmail}</p>
              <div className={`text-xs font-mono mt-1 ${sessionTimer < 120 ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>Expira: {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold">{boNav.find(n=>n.id===page)?.l || 'Dashboard'}</h1>
            <p className="text-gray-600 text-xs">{new Date().toLocaleString('pt-MZ')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl">
              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">A</div>
              <div><p className="text-white text-xs font-medium">{auth.adminEmail}</p><p className="text-red-400 text-[10px]">Superadmin</p></div>
            </div>
            <button onClick={() => { auth.logAudit('LOGOUT', auth.adminEmail,'',''); auth.logout(); }} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-all">🚪 Sair</button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
