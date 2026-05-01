// servico de abastecimentos - crud completo no firestore
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

const COLECAO = 'abastecimentos';

// calcula o consumo medio em km/l
export const calcularConsumo = (kmAtual, kmAnterior, litros) => {
  if (!kmAnterior || !litros || litros === 0) return null;
  const distancia = kmAtual - kmAnterior;
  if (distancia <= 0) return null;
  return (distancia / litros).toFixed(2);
};

// adiciona novo abastecimento para o usuario
export const adicionarAbastecimento = async (uid, dados) => {
  const ref = await addDoc(collection(db, COLECAO), {
    ...dados,
    uid,
    criadoEm: new Date().toISOString(),
  });
  return ref.id;
};

// busca abastecimentos do usuario
export const buscarAbastecimentos = async (uid) => {
  const q = query(
    collection(db, COLECAO),
    where('uid', '==', uid),
    orderBy('criadoEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// atualiza um abastecimento existente
export const atualizarAbastecimento = async (id, dados) => {
  await updateDoc(doc(db, COLECAO, id), {
    ...dados,
    atualizadoEm: new Date().toISOString(),
  });
};

// remove um abastecimento pelo id
export const removerAbastecimento = async (id) => {
  await deleteDoc(doc(db, COLECAO, id));
};
