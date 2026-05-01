// servico de autenticacao - login, cadastro e logout
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// cadastra novo usuario no firebase auth e salva dados no firestore
export const cadastrarUsuario = async (nome, email, senha) => {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  await updateProfile(credencial.user, { displayName: nome });
  await setDoc(doc(db, 'usuarios', credencial.user.uid), {
    nome,
    email,
    criadoEm: new Date().toISOString(),
  });
  return credencial.user;
};

// realiza login com email e senha
export const loginUsuario = async (email, senha) => {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
};

// realiza logout do usuario atual
export const logoutUsuario = async () => {
  await signOut(auth);
};
