// services/storage.js
// funcoes para salvar, carregar, atualizar e deletar dados no firestore
// todos os registros sao vinculados ao uid do usuario logado

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// salva um novo documento em uma colecao
// recebe o nome da colecao, os dados e o uid do usuario logado
export async function salvarItem(nomeColecao, dados, uid) {
  try {
    const ref = collection(db, nomeColecao);
    const docRef = await addDoc(ref, {
      ...dados,
      uid: uid,
      criadoEm: Date.now(),
    });
    return docRef.id;
  } catch (erro) {
    console.error('erro ao salvar:', erro);
    return null;
  }
}

// busca todos os documentos de uma colecao filtrando pelo uid
// retorna apenas os dados do usuario logado, ordenados do mais novo
export async function carregarItens(nomeColecao, uid) {
  try {
    const ref = collection(db, nomeColecao);
    const consulta = query(
      ref,
      where('uid', '==', uid),
      orderBy('criadoEm', 'desc')
    );
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (erro) {
    console.error('erro ao carregar:', erro);
    return [];
  }
}

// deleta um documento pelo id
export async function deletarItem(nomeColecao, id) {
  try {
    await deleteDoc(doc(db, nomeColecao, id));
    return true;
  } catch (erro) {
    console.error('erro ao deletar:', erro);
    return false;
  }
}

// atualiza campos de um documento existente
export async function atualizarItem(nomeColecao, id, dados) {
  try {
    await updateDoc(doc(db, nomeColecao, id), dados);
    return true;
  } catch (erro) {
    console.error('erro ao atualizar:', erro);
    return false;
  }
}
