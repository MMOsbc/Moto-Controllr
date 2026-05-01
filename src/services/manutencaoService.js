// servico de manutencoes - crud completo no firestore
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

const COLECAO = 'manutencoes';

// adiciona nova manutencao vinculada ao usuario
export const adicionarManutencao = async (uid, dados) => {
  const ref = await addDoc(collection(db, COLECAO), {
    ...dados,
    uid,
    criadoEm: new Date().toISOString(),
  });
  return ref.id;
};

// busca manutencoes do usuario ordenadas por data
export const buscarManutencoes = async (uid) => {
  const q = query(
    collection(db, COLECAO),
    where('uid', '==', uid),
    orderBy('criadoEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// atualiza uma manutencao existente
export const atualizarManutencao = async (id, dados) => {
  await updateDoc(doc(db, COLECAO, id), {
    ...dados,
    atualizadoEm: new Date().toISOString(),
  });
};

// remove uma manutencao pelo id
export const removerManutencao = async (id) => {
  await deleteDoc(doc(db, COLECAO, id));
};
