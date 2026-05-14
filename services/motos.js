// services/motos.js
// Gerenciamento de motos com Firestore (nuvem) + AsyncStorage (cache local)
// Estrutura Firestore: usuarios/{usuarioId}/motos/{motoId}

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { validarObrigatorio, validarPlaca } from '../utils/validators';

// ─── Chaves AsyncStorage (cache local) ───────────────────────────────────────

function chaveMotosPorUsuario(usuarioId) {
  return `@motoapp:motos:${usuarioId}`;
}
function chaveMotoAtiva(usuarioId) {
  return `@motoapp:moto_ativa:${usuarioId}`;
}
export function chaveModulo(modulo, motoId) {
  return `@motoapp:${modulo}:${motoId}`;
}

// ─── Coleções Firestore ───────────────────────────────────────────────────────

function colecaoMotos(usuarioId) {
  return collection(db, 'usuarios', usuarioId, 'motos');
}
function docMoto(usuarioId, motoId) {
  return doc(db, 'usuarios', usuarioId, 'motos', motoId);
}

// ─── Validação ────────────────────────────────────────────────────────────────

function validarDadosMoto({ nome, marca, modelo, placa }) {
  const erroNome = validarObrigatorio(nome, 'Nome').erro;
  if (erroNome) return { valido: false, erro: erroNome };

  const erroMarca = validarObrigatorio(marca, 'Marca').erro;
  if (erroMarca) return { valido: false, erro: erroMarca };

  const erroModelo = validarObrigatorio(modelo, 'Modelo').erro;
  if (erroModelo) return { valido: false, erro: erroModelo };

  if (placa && placa.trim()) {
    const erroPlaca = validarPlaca(placa).erro;
    if (erroPlaca) return { valido: false, erro: `Placa: ${erroPlaca}` };
  }

  return { valido: true, erro: '' };
}

// ─── Listar motos ─────────────────────────────────────────────────────────────

export async function listarMotos(usuarioId) {
  try {
    // 1. Tenta buscar do Firestore (fonte da verdade)
    const snap = await getDocs(colecaoMotos(usuarioId));
    const motos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Atualiza cache local
    await AsyncStorage.setItem(chaveMotosPorUsuario(usuarioId), JSON.stringify(motos));
    return motos;
  } catch (erro) {
    console.warn('Firestore indisponível, usando cache local:', erro.message);
    // 2. Fallback: cache AsyncStorage
    try {
      const json = await AsyncStorage.getItem(chaveMotosPorUsuario(usuarioId));
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }
}

// ─── Adicionar moto ───────────────────────────────────────────────────────────

export async function adicionarMoto(usuarioId, dados) {
  try {
    const validacao = validarDadosMoto(dados);
    if (!validacao.valido) return { sucesso: false, erro: validacao.erro };

    const motos = await listarMotos(usuarioId);

    // Verifica placa duplicada
    if (dados.placa && dados.placa.trim()) {
      const placaNormalizada = dados.placa.trim().toUpperCase();
      const placaExiste = motos.find(
        m => m.placa && m.placa.toUpperCase() === placaNormalizada
      );
      if (placaExiste) {
        return { sucesso: false, erro: `Já existe uma moto com a placa ${placaNormalizada}.` };
      }
    }

    const novaMoto = {
      nome: dados.nome.trim(),
      marca: dados.marca?.trim() || '',
      modelo: dados.modelo?.trim() || '',
      ano: dados.ano?.trim() || '',
      placa: dados.placa?.trim().toUpperCase() || '',
      cor: dados.cor?.trim() || '',
      kmAtual: dados.kmAtual?.trim() || '0',
      foto: dados.foto || null,
      criadaEm: new Date().toISOString(),
    };

    // Salva no Firestore
    const novoDoc = doc(colecaoMotos(usuarioId)); // gera ID automático
    await setDoc(novoDoc, { ...novaMoto, criadaEmServer: serverTimestamp() });
    const motoComId = { id: novoDoc.id, ...novaMoto };

    // Atualiza cache local
    const novaLista = [...motos, motoComId];
    await AsyncStorage.setItem(chaveMotosPorUsuario(usuarioId), JSON.stringify(novaLista));

    // Se for a primeira moto, define como ativa
    if (motos.length === 0) {
      await definirMotoAtiva(usuarioId, motoComId.id);
    }

    return { sucesso: true, moto: motoComId };
  } catch (erro) {
    console.error('Erro ao adicionar moto:', erro);
    return { sucesso: false, erro: 'Erro ao adicionar moto.' };
  }
}

// ─── Remover moto ─────────────────────────────────────────────────────────────

export async function removerMoto(usuarioId, motoId) {
  try {
    // Remove do Firestore
    await deleteDoc(docMoto(usuarioId, motoId));

    // Remove dados relacionados à moto no Firestore
    const modulos = ['manutencoes', 'abastecimentos', 'pneus', 'gastos', 'checklist'];
    await Promise.all(
      modulos.map(mod =>
        deleteDoc(doc(db, 'usuarios', usuarioId, mod, motoId)).catch(() => {})
      )
    );

    // Atualiza cache local
    const motos = await listarMotos(usuarioId);
    const novaLista = motos.filter(m => m.id !== motoId);
    await AsyncStorage.setItem(chaveMotosPorUsuario(usuarioId), JSON.stringify(novaLista));

    // Remove também do cache de módulos
    for (const mod of modulos) {
      await AsyncStorage.removeItem(chaveModulo(mod, motoId));
    }

    // Redefine moto ativa se necessário
    const ativaId = await obterMotoAtivaId(usuarioId);
    if (ativaId === motoId) {
      const outra = novaLista[0];
      if (outra) {
        await definirMotoAtiva(usuarioId, outra.id);
      } else {
        await AsyncStorage.removeItem(chaveMotoAtiva(usuarioId));
      }
    }

    return { sucesso: true };
  } catch (erro) {
    console.error('Erro ao remover moto:', erro);
    return { sucesso: false };
  }
}

// ─── Definir / obter moto ativa ───────────────────────────────────────────────

export async function definirMotoAtiva(usuarioId, motoId) {
  try {
    // Salva no Firestore para sincronizar entre dispositivos
    await setDoc(
      doc(db, 'usuarios', usuarioId, 'config', 'motoAtiva'),
      { motoId, atualizadoEm: serverTimestamp() }
    );
    // Cache local imediato
    await AsyncStorage.setItem(chaveMotoAtiva(usuarioId), motoId);
  } catch (erro) {
    // Se Firestore falhar, mantém ao menos o cache local
    console.warn('Erro ao definir moto ativa no Firestore:', erro.message);
    await AsyncStorage.setItem(chaveMotoAtiva(usuarioId), motoId);
  }
}

export async function obterMotoAtivaId(usuarioId) {
  try {
    // Tenta Firestore primeiro
    const snap = await getDoc(doc(db, 'usuarios', usuarioId, 'config', 'motoAtiva'));
    if (snap.exists()) {
      const motoId = snap.data().motoId;
      await AsyncStorage.setItem(chaveMotoAtiva(usuarioId), motoId);
      return motoId;
    }
    return null;
  } catch {
    // Fallback AsyncStorage
    return await AsyncStorage.getItem(chaveMotoAtiva(usuarioId));
  }
}

export async function obterMotoAtiva(usuarioId) {
  try {
    const id = await obterMotoAtivaId(usuarioId);
    if (!id) return null;
    const motos = await listarMotos(usuarioId);
    return motos.find(m => m.id === id) || null;
  } catch {
    return null;
  }
}

// ─── Atualizar moto ───────────────────────────────────────────────────────────

export async function atualizarMoto(usuarioId, motoId, dados) {
  try {
    const motos = await listarMotos(usuarioId);
    const motoAtual = motos.find(m => m.id === motoId);
    if (!motoAtual) return { sucesso: false, erro: 'Moto não encontrada.' };

    const motoAtualizada = { ...motoAtual, ...dados };

    const validacao = validarDadosMoto({
      nome: motoAtualizada.nome,
      marca: motoAtualizada.marca,
      modelo: motoAtualizada.modelo,
      placa: motoAtualizada.placa,
    });
    if (!validacao.valido) return { sucesso: false, erro: validacao.erro };

    if (motoAtualizada.placa && motoAtualizada.placa.trim()) {
      const placaNormalizada = motoAtualizada.placa.trim().toUpperCase();
      const placaExiste = motos.find(
        m => m.id !== motoId && m.placa && m.placa.toUpperCase() === placaNormalizada
      );
      if (placaExiste) {
        return { sucesso: false, erro: `Já existe uma moto com a placa ${placaNormalizada}.` };
      }
    }

    // Atualiza no Firestore (remove campos undefined para evitar erros)
    const { id, ...dadosSemId } = motoAtualizada;
    await updateDoc(docMoto(usuarioId, motoId), dadosSemId);

    // Atualiza cache local
    const novaLista = motos.map(m => (m.id === motoId ? motoAtualizada : m));
    await AsyncStorage.setItem(chaveMotosPorUsuario(usuarioId), JSON.stringify(novaLista));

    return { sucesso: true, moto: motoAtualizada };
  } catch (erro) {
    console.error('Erro ao atualizar moto:', erro);
    return { sucesso: false };
  }
}
