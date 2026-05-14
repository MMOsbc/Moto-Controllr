// services/storage.js
// Persistência de dados de módulos (abastecimentos, manutenções, pneus, gastos, checklist)
// Estratégia: Firestore como fonte da verdade + AsyncStorage como cache local / offline
//
// Estrutura Firestore:
//   usuarios/{usuarioId}/{modulo}/{motoId}  → documento com campo "lista: [...]"
//
// O mesmo motoId continua sendo usado como chave, mantendo compatibilidade total
// com todas as telas existentes.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

// ─── Chave AsyncStorage (cache local) ────────────────────────────────────────

function gerarChaveLocal(modulo, motoId) {
  if (motoId) return `@motoapp:${modulo}:${motoId}`;
  // Compatibilidade com dados legados sem motoId
  const CHAVES_LEGADAS = {
    manutencoes: '@motoapp:manutencoes',
    abastecimentos: '@motoapp:abastecimentos',
    pneus: '@motoapp:pneus',
    gastos: '@motoapp:gastos',
    checklist: '@motoapp:checklist',
  };
  return CHAVES_LEGADAS[modulo];
}

// ─── Referência Firestore ─────────────────────────────────────────────────────

function docFirestore(modulo, motoId) {
  const usuarioId = auth.currentUser?.uid;
  if (!usuarioId || !motoId) return null;
  return doc(db, 'usuarios', usuarioId, modulo, motoId);
}

// ─── salvarDados ──────────────────────────────────────────────────────────────
//
// Salva no Firestore E no AsyncStorage simultaneamente.
// Se o Firestore falhar (offline), os dados ficam no AsyncStorage e serão
// sincronizados na próxima chamada bem-sucedida.

export async function salvarDados(modulo, dados, motoId = null) {
  // 1. Salva no cache local imediatamente (garante velocidade na UI)
  try {
    const chaveLocal = gerarChaveLocal(modulo, motoId);
    await AsyncStorage.setItem(chaveLocal, JSON.stringify(dados));
  } catch (erroLocal) {
    console.error('Erro ao salvar no AsyncStorage:', erroLocal);
  }

  // 2. Salva no Firestore (em segundo plano, não bloqueia a UI)
  const ref = docFirestore(modulo, motoId);
  if (ref) {
    setDoc(ref, { lista: dados, atualizadoEm: serverTimestamp() }, { merge: true })
      .catch(erroCloud => {
        // Falha silenciosa — dados já estão no AsyncStorage
        console.warn(`[Firebase] Falha ao salvar ${modulo}/${motoId}:`, erroCloud.message);
      });
  }
}

// ─── carregarDados ────────────────────────────────────────────────────────────
//
// Tenta carregar do Firestore. Se falhar (offline / sem auth), usa AsyncStorage.

export async function carregarDados(modulo, motoId = null) {
  // 1. Tenta Firestore (dados mais recentes / multi-dispositivo)
  const ref = docFirestore(modulo, motoId);
  if (ref) {
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const dados = snap.data().lista || [];
        // Atualiza cache local com dados vindos da nuvem
        const chaveLocal = gerarChaveLocal(modulo, motoId);
        AsyncStorage.setItem(chaveLocal, JSON.stringify(dados)).catch(() => {});
        return dados;
      }
      // Documento não existe ainda no Firestore — retorna o que há no cache
    } catch (erroCloud) {
      console.warn(`[Firebase] Usando cache para ${modulo}/${motoId}:`, erroCloud.message);
    }
  }

  // 2. Fallback: AsyncStorage
  try {
    const chaveLocal = gerarChaveLocal(modulo, motoId);
    const json = await AsyncStorage.getItem(chaveLocal);
    return json ? JSON.parse(json) : [];
  } catch (erroLocal) {
    console.error('Erro ao carregar do AsyncStorage:', erroLocal);
    return [];
  }
}

// ─── removerDadosMoto ─────────────────────────────────────────────────────────
//
// Remove todos os dados de uma moto (chamado em removerMoto em motos.js)

export async function removerDadosMoto(motoId) {
  const usuarioId = auth.currentUser?.uid;
  const modulos = ['manutencoes', 'abastecimentos', 'pneus', 'gastos', 'checklist'];

  for (const modulo of modulos) {
    // Cache local
    const chave = gerarChaveLocal(modulo, motoId);
    AsyncStorage.removeItem(chave).catch(() => {});

    // Firestore
    if (usuarioId) {
      const ref = doc(db, 'usuarios', usuarioId, modulo, motoId);
      deleteDoc(ref).catch(() => {});
    }
  }
}
