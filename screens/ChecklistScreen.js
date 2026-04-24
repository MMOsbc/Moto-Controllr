// screens/ChecklistScreen.js
// tela de checklist de inspecao da moto
// cada item tem feito: true ou false — atualizado no firebase via updateDoc

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Vibration, ActivityIndicator,
} from 'react-native';
import {
  collection, getDocs, addDoc, deleteDoc,
  updateDoc, doc, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import colors from '../services/colors';

// itens de inspecao padrao carregados na primeira vez
const ITENS_PADRAO = [
  'Calibragem dos pneus',
  'Farol dianteiro',
  'Lanterna traseira',
  'Freio dianteiro',
  'Freio traseiro',
  'Corrente lubrificada',
  'Nivel de oleo',
  'Espelhos ajustados',
];

export default function ChecklistScreen({ usuario }) {
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [mostrarInput, setMostrarInput] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, []);

  // busca os itens do checklist do firebase filtrando pelo uid
  async function carregar() {
    setCarregando(true);
    try {
      const ref = collection(db, 'checklist');
      const consulta = query(ref, where('uid', '==', usuario.uid), orderBy('criadoEm', 'asc'));
      const snapshot = await getDocs(consulta);
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // se nao existir nenhum item, cria os itens padrao
      if (lista.length === 0) {
        await criarItensPadrao();
      } else {
        setItens(lista);
      }
    } catch (e) {
      console.error('erro ao carregar checklist:', e);
    }
    setCarregando(false);
  }

  // cria os itens padrao no firebase na primeira execucao
  async function criarItensPadrao() {
    const ref = collection(db, 'checklist');
    const novos = [];
    for (let i = 0; i < ITENS_PADRAO.length; i++) {
      const docRef = await addDoc(ref, {
        texto: ITENS_PADRAO[i],
        feito: false,
        uid: usuario.uid,
        criadoEm: i,
      });
      novos.push({ id: docRef.id, texto: ITENS_PADRAO[i], feito: false });
    }
    setItens(novos);
  }

  // alterna o valor do campo feito (true/false) no firebase
  async function alternar(id, feitoAtual) {
    try {
      await updateDoc(doc(db, 'checklist', id), { feito: !feitoAtual });
      setItens(itens.map((i) => i.id === id ? { ...i, feito: !feitoAtual } : i));
      Vibration.vibrate(50);
    } catch (e) {
      console.error('erro ao atualizar item:', e);
    }
  }

  // adiciona novo item personalizado ao checklist
  async function adicionarItem() {
    if (!novoItem.trim()) {
      Alert.alert('Atencao', 'Digite o nome do item.');
      return;
    }
    try {
      const ref = collection(db, 'checklist');
      const docRef = await addDoc(ref, {
        texto: novoItem.trim(),
        feito: false,
        uid: usuario.uid,
        criadoEm: Date.now(),
      });
      setItens([...itens, { id: docRef.id, texto: novoItem.trim(), feito: false }]);
      Vibration.vibrate(100);
      setNovoItem('');
      setMostrarInput(false);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel adicionar o item.');
    }
  }

  // remove item do firebase
  async function excluirItem(id) {
    Alert.alert('Remover', 'Remover este item do checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'checklist', id));
          setItens(itens.filter((i) => i.id !== id));
          Vibration.vibrate([0, 50, 50, 50]);
        },
      },
    ]);
  }

  // marca todos os itens como feito: true
  async function marcarTodos() {
    for (const item of itens) {
      if (!item.feito) await updateDoc(doc(db, 'checklist', item.id), { feito: true });
    }
    setItens(itens.map((i) => ({ ...i, feito: true })));
    Vibration.vibrate([0, 100, 50, 100]);
  }

  // reseta todos os itens para feito: false
  async function limparTodos() {
    for (const item of itens) {
      if (item.feito) await updateDoc(doc(db, 'checklist', item.id), { feito: false });
    }
    setItens(itens.map((i) => ({ ...i, feito: false })));
  }

  // calcula progresso para a barra de porcentagem
  const feitos = itens.filter((i) => i.feito).length;
  const progresso = itens.length > 0 ? (feitos / itens.length) * 100 : 0;

  // renderiza cada item com checkbox e botao de remover
  function renderItem({ item }) {
    return (
      <View style={[styles.itemRow, item.feito && styles.itemFeito]}>
        {/* checkbox toca para alternar true/false */}
        <TouchableOpacity
          style={[styles.checkbox, item.feito && styles.checkboxAtivo]}
          onPress={() => alternar(item.id, item.feito)}
        >
          {item.feito && <Text style={styles.checkboxMarca}>X</Text>}
        </TouchableOpacity>

        {/* texto do item com riscado quando feito */}
        <Text style={[styles.itemTexto, item.feito && styles.itemTextoFeito]}>
          {item.texto}
        </Text>

        <TouchableOpacity onPress={() => excluirItem(item.id)} style={styles.btnRemover}>
          <Text style={styles.btnRemoverTexto}>Remover</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* barra de progresso visual */}
      <View style={styles.progressoContainer}>
        <View style={styles.progressoInfo}>
          <Text style={styles.progressoTexto}>{feitos}/{itens.length} verificados</Text>
          <Text style={styles.progressoPct}>{Math.round(progresso)}%</Text>
        </View>
        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchida, { width: `${progresso}%` }]} />
        </View>
      </View>

      {/* botoes de acao em linha */}
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.btnAcao} onPress={marcarTodos}>
          <Text style={styles.btnAcaoTexto}>Marcar todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAcao, styles.btnSecundario]} onPress={limparTodos}>
          <Text style={[styles.btnAcaoTexto, { color: colors.textSecondary }]}>Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAcao, styles.btnSecundario]} onPress={() => setMostrarInput(!mostrarInput)}>
          <Text style={[styles.btnAcaoTexto, { color: colors.textSecondary }]}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* campo para adicionar item personalizado */}
      {mostrarInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome do novo item..."
            placeholderTextColor={colors.placeholder}
            value={novoItem}
            onChangeText={setNovoItem}
          />
          <TouchableOpacity style={styles.btnSalvar} onPress={adicionarItem}>
            <Text style={styles.btnSalvarTexto}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={itens}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  progressoContainer: { backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  progressoInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressoTexto: { color: colors.textSecondary, fontSize: 13 },
  progressoPct: { color: colors.text, fontWeight: 'bold', fontSize: 13 },
  barraFundo: { backgroundColor: colors.inputBackground, borderRadius: 4, height: 6, overflow: 'hidden' },
  barraPreenchida: { backgroundColor: colors.text, height: 6, borderRadius: 4 },
  acoes: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  btnAcao: { flex: 1, backgroundColor: colors.button, borderRadius: 6, padding: 10, alignItems: 'center' },
  btnSecundario: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnAcaoTexto: { color: colors.buttonText, fontWeight: '600', fontSize: 12 },
  inputContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8 },
  input: { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, fontSize: 14 },
  btnSalvar: { backgroundColor: colors.button, borderRadius: 6, padding: 12, justifyContent: 'center' },
  btnSalvarTexto: { color: colors.buttonText, fontWeight: 'bold', fontSize: 13 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemFeito: { opacity: 0.5 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: colors.borderLight, marginRight: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inputBackground },
  checkboxAtivo: { backgroundColor: colors.button, borderColor: colors.button },
  checkboxMarca: { color: colors.buttonText, fontWeight: 'bold', fontSize: 12 },
  itemTexto: { flex: 1, color: colors.text, fontSize: 14 },
  itemTextoFeito: { textDecorationLine: 'line-through', color: colors.textMuted },
  btnRemover: { paddingHorizontal: 8, paddingVertical: 4 },
  btnRemoverTexto: { color: colors.textMuted, fontSize: 11 },
});
