// servico de motocicletas - crud completo no firestore
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLECAO = 'motocicletas';

// adiciona nova motocicleta para o usuario
export const adicionarMoto = async (uid, dados) => {
  const ref = await addDoc(collection(db, COLECAO), {
    ...dados,
    uid,
    criadoEm: new Date().toISOString(),
  });
  return ref.id;
};

// busca todas as motocicletas do usuario
export const buscarMotos = async (uid) => {
  const q = query(
    collection(db, COLECAO),
    where('uid', '==', uid),
    orderBy('criadoEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// atualiza dados de uma motocicleta existente
export const atualizarMoto = async (id, dados) => {
  await updateDoc(doc(db, COLECAO, id), {
    ...dados,
    atualizadoEm: new Date().toISOString(),
  });
};

// remove uma motocicleta pelo id
export const removerMoto = async (id) => {
  await deleteDoc(doc(db, COLECAO, id));
};
