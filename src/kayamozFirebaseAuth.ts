import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  type User as FBUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { netekAuth as auth, netekFirestore as db } from './firebase';
import { MASTER_EMAIL } from './data';

const googleProvider = new GoogleAuthProvider();

// Configura o Google para manter o fluxo na mesma aba e permitir escolher conta.
googleProvider.setCustomParameters({ prompt: 'select_account' });

function isMaster(email?: string | null) {
  return Boolean(email && email.toLowerCase() === MASTER_EMAIL.toLowerCase());
}

async function persistirUtilizador(user: FBUser, extra?: { nome?: string; phone?: string; bairro?: string; provincia?: string; platform?: string }) {
  const role = isMaster(user.email) ? 'admin' : 'User';
  const nome = extra?.nome || user.displayName || 'Utilizador Google';
  const payload = {
    uid: user.uid,
    nome,
    name: nome,
    email: user.email,
    foto: user.photoURL || '',
    photoURL: user.photoURL || '',
    telefone: extra?.phone || '',
    phone: extra?.phone || '',
    bairro: extra?.bairro || '',
    provincia: extra?.provincia || 'Maputo Cidade',
    role,
    platform: extra?.platform || 'netek',
    pontos: 50,
    points: 50,
    ultimoLogin: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };

  // Coleção compatível com o fluxo KayaMoz pedido.
  await setDoc(doc(db, 'utilizadores', user.uid), payload, { merge: true });

  // Coleção usada pelo restante Netek, preservando compatibilidade existente.
  await setDoc(doc(db, 'users', user.uid), {
    ...payload,
    avatar: isMaster(user.email) ? '👑' : (user.email?.[0]?.toUpperCase() || 'U'),
    emailVerified: user.emailVerified,
    referralCode: `NK${user.uid.slice(0, 6).toUpperCase()}`,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return payload;
}

/**
 * 1. CAPTURAR RETORNO DO GOOGLE
 * Executar sempre que a página carregar, pois o login usa redirect na mesma aba.
 */
export async function verificarRetornoDoGoogle() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      await persistirUtilizador(user, { platform: 'google' });
      return { sucesso: true, user, msg: 'Login via Google efetuado com sucesso!' };
    }
    return { sucesso: true, user: null, msg: 'Sem retorno pendente do Google.' };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'unknown';
    console.error('Erro ao processar retorno do Google:', error);
    return { sucesso: false, erro: traduzirErroFirebase(code) };
  }
}

/**
 * 2. CRIAR CONTA (E-mail e Senha) + gravação automática na BD
 */
export async function criarContaKayamoz(email: string, password: string, nome: string, phone = '', bairro = '', provincia = 'Maputo Cidade') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: nome });
    await persistirUtilizador(user, { nome, phone, bairro, provincia, platform: 'netek' });
    return { sucesso: true, user };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'unknown';
    console.error('Erro ao criar conta:', error);
    return { sucesso: false, erro: traduzirErroFirebase(code) };
  }
}

/**
 * 3. LOGIN NORMAL (E-mail e Senha)
 */
export async function loginNormalKayamoz(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await persistirUtilizador(userCredential.user);
    return { sucesso: true, user: userCredential.user };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'unknown';
    console.error('Erro no login normal:', error);
    return { sucesso: false, erro: traduzirErroFirebase(code) };
  }
}

/**
 * 4. INICIAR LOGIN COM GOOGLE (Redirecionamento na mesma aba)
 */
export async function loginGoogleKayamoz() {
  try {
    await signInWithRedirect(auth, googleProvider);
    return { sucesso: true };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'unknown';
    console.error('Erro ao iniciar login Google:', error);
    return { sucesso: false, erro: traduzirErroFirebase(code) };
  }
}

export function traduzirErroFirebase(code: string) {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este e-mail já está registado na plataforma.';
    case 'auth/weak-password': return 'A palavra-passe deve conter pelo menos 6 caracteres.';
    case 'auth/invalid-email': return 'O formato do e-mail introduzido é inválido.';
    case 'auth/user-not-found': return 'Não existe nenhuma conta com este e-mail.';
    case 'auth/wrong-password': return 'A palavra-passe introduzida está incorreta.';
    case 'auth/invalid-credential': return 'Credenciais inválidas. Verifique os dados.';
    case 'auth/network-request-failed': return 'Sem ligação à internet. Verifique a rede.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde alguns minutos.';
    case 'auth/operation-not-allowed': return 'Este método de login ainda não está ativo no Firebase Console.';
    default: return 'Ocorreu um erro na autenticação. Por favor, tente novamente.';
  }
}
