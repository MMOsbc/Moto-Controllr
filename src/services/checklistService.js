// servico de checklist semanal - salva e recupera historico do firestore
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLECAO = 'checklists';

// itens padrao do checklist de seguranca
export const ITENS_CHECKLIST = [
  { chave: 'pneus', label: 'Pneus' },
  { chave: 'freios', label: 'Freios' },
  { chave: 'oleo', label: 'Oleo' },
  { chave: 'corrente', label: 'Corrente' },
  { chave: 'iluminacao', label: 'Iluminacao' },
  { chave: 'bateria', label: 'Bateria' },
  { chave: 'documentos', label: 'Documentos' },
];

// salva resultado do checklist no banco de dados
export const salvarChecklist = async (uid, motoId, itens) => {
  const ref = await addDoc(collection(db, COLECAO), {
    uid,
    motoId,
    itens,
    data: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
  });
  return ref.id;
};

// busca historico de checklists do usuario
export const buscarChecklists = async (uid) => {
  const q = query(
    collection(db, COLECAO),
    where('uid', '==', uid),
    orderBy('criadoEm', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
