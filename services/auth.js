// services/auth.js
// Autenticação via Firebase Auth + fallback local com AsyncStorage
// Registro e login usam Firebase; sessão é espelhada no AsyncStorage para acesso offline

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { validarEmail, validarObrigatorio } from '../utils/validators';

// Chaves locais (AsyncStorage) para cache da sessão
const CHAVES = {
  sessao: '@motoapp:sessao_ativa',
};

// ─── Validações ─────────────────────────────────────────────────────────────

function validarDadosRegistro({ nome, email, senha }) {
  const erroNome = validarObrigatorio(nome, 'Nome').erro;
  if (erroNome) return { valido: false, erro: erroNome };

  const erroEmail = validarEmail(email).erro;
  if (erroEmail) return { valido: false, erro: erroEmail };

  if (!senha || senha.length < 6) {
    return { valido: false, erro: 'A senha deve ter no mínimo 6 caracteres.' };
  }
  return { valido: true, erro: '' };
}

function validarDadosLogin({ email, senha }) {
  if (!email || !email.trim()) return { valido: false, erro: 'Informe o e-mail.' };
  if (!senha || !senha.trim()) return { valido: false, erro: 'Informe a senha.' };
  return { valido: true, erro: '' };
}

// ─── Registro ────────────────────────────────────────────────────────────────

export async function registrar({ nome, email, senha, telefone }) {
  try {
    const validacao = validarDadosRegistro({ nome, email, senha });
    if (!validacao.valido) return { sucesso: false, erro: validacao.erro };

    // Cria usuário no Firebase Auth
    const credencial = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha
    );
    const uid = credencial.user.uid;

    // Atualiza o displayName no Auth
    await updateProfile(credencial.user, { displayName: nome.trim() });

    // Salva dados extras no Firestore (coleção "usuarios")
    const novoUsuario = {
      id: uid,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone || '',
      criadoEm: serverTimestamp(),
    };
    await setDoc(doc(db, 'usuarios', uid), novoUsuario);

    // Espelha sessão no AsyncStorage (sem a senha)
    await _salvarSessaoLocal(novoUsuario);

    return { sucesso: true, usuario: novoUsuario };
  } catch (erro) {
    console.error('Erro ao registrar:', erro);
    return { sucesso: false, erro: _traduzirErroFirebase(erro.code) };
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login({ email, senha }) {
  try {
    const validacao = validarDadosLogin({ email, senha });
    if (!validacao.valido) return { sucesso: false, erro: validacao.erro };

    const credencial = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha
    );
    const uid = credencial.user.uid;

    // Busca dados do usuário no Firestore
    const snap = await getDoc(doc(db, 'usuarios', uid));
    const dadosFirestore = snap.exists() ? snap.data() : {};

    const usuario = {
      id: uid,
      nome: dadosFirestore.nome || credencial.user.displayName || '',
      email: credencial.user.email,
      telefone: dadosFirestore.telefone || '',
    };

    await _salvarSessaoLocal(usuario);
    return { sucesso: true, usuario };
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    return { sucesso: false, erro: _traduzirErroFirebase(erro.code) };
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout() {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem(CHAVES.sessao);
    return { sucesso: true };
  } catch (erro) {
    console.error('Erro ao fazer logout:', erro);
    return { sucesso: false };
  }
}

// ─── Sessão ──────────────────────────────────────────────────────────────────

// Retorna o usuário da sessão local (AsyncStorage) para acesso rápido / offline
export async function obterSessao() {
  try {
    const json = await AsyncStorage.getItem(CHAVES.sessao);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

// Observa mudanças de autenticação do Firebase (útil para token refresh)
export function observarAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Helpers internos ────────────────────────────────────────────────────────

async function _salvarSessaoLocal(usuario) {
  await AsyncStorage.setItem(CHAVES.sessao, JSON.stringify(usuario));
}

function _traduzirErroFirebase(code) {
  const erros = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'A senha deve ter no mínimo 6 caracteres.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  };
  return erros[code] || 'Erro inesperado. Tente novamente.';
}
