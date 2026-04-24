// screens/AbastecimentoScreen.js
// tela de controle de abastecimentos
// crud com firebase, sem emoji, preto e branco

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Vibration, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { salvarItem, carregarItens, deletarItem } from '../services/storage';
import ItemCard from '../components/ItemCard';
import colors from '../services/colors';

export default function AbastecimentoScreen({ usuario }) {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [litros, setLitros] = useState('');
  const [valor, setValor] = useState('');
  const [posto, setPosto] = useState('');
  const [km, setKm] = useState('');
  const [data, setData] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  // carrega abastecimentos do firebase para o usuario logado
  async function carregar() {
    setCarregando(true);
    const dados = await carregarItens('abastecimentos', usuario.uid);
    setAbastecimentos(dados);
    setCarregando(false);
  }

  // salva novo abastecimento no firebase
  async function adicionar() {
    if (!litros.trim() || !valor.trim()) {
      Alert.alert('Atencao', 'Informe os litros e o valor.');
      return;
    }
    setSalvando(true);
    const novo = {
      litros: litros.trim(),
      valor: valor.trim(),
      descricao: `${litros}L - ${posto.trim() || 'Posto'}`,
      posto: posto.trim() || 'Nao informado',
      km: km.trim(),
      data: data.trim() || new Date().toLocaleDateString('pt-BR'),
    };
    const id = await salvarItem('abastecimentos', novo, usuario.uid);
    if (id) {
      setAbastecimentos([{ id, ...novo, criadoEm: Date.now() }, ...abastecimentos]);
      Vibration.vibrate(100);
      Alert.alert('Sucesso', 'Abastecimento registrado!');
      setLitros(''); setValor(''); setPosto(''); setKm(''); setData('');
      setMostrarForm(false);
    } else {
      Alert.alert('Erro', 'Nao foi possivel salvar.');
    }
    setSalvando(false);
  }

  async function excluir(id) {
    Alert.alert('Excluir', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await deletarItem('abastecimentos', id);
          setAbastecimentos(abastecimentos.filter((i) => i.id !== id));
          Vibration.vibrate([0, 50, 50, 50]);
        },
      },
    ]);
  }

  // totais calculados localmente a partir do estado
  const totalLitros = abastecimentos.reduce((acc, i) => acc + parseFloat(i.litros || 0), 0);
  const totalValor = abastecimentos.reduce((acc, i) => acc + parseFloat(i.valor || 0), 0);

  function renderItem({ item }) {
    return (
      <ItemCard
        titulo={`${item.litros} litros`}
        subtitulo={`${item.posto}  |  ${item.data}${item.km ? '  |  ' + item.km + ' km' : ''}`}
        info={`R$ ${parseFloat(item.valor).toFixed(2)}`}
        onExcluir={() => excluir(item.id)}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* resumo de totais */}
      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoValor}>{totalLitros.toFixed(1)} L</Text>
          <Text style={styles.resumoLabel}>Total litros</Text>
        </View>
        <View style={styles.resumoDivisor} />
        <View style={styles.resumoItem}>
          <Text style={styles.resumoValor}>R$ {totalValor.toFixed(2)}</Text>
          <Text style={styles.resumoLabel}>Total gasto</Text>
        </View>
      </View>

      <View style={styles.topBar}>
        <Text style={styles.contador}>{abastecimentos.length} registro(s)</Text>
        <TouchableOpacity style={styles.btnAdicionar} onPress={() => setMostrarForm(!mostrarForm)}>
          <Text style={styles.btnAdicionarTexto}>{mostrarForm ? 'Fechar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>

      {mostrarForm && (
        <View style={styles.form}>
          <Text style={styles.formTitulo}>Novo abastecimento</Text>
          <Text style={styles.label}>Litros</Text>
          <TextInput style={styles.input} placeholder="Ex: 12.5" placeholderTextColor={colors.placeholder} value={litros} onChangeText={setLitros} keyboardType="decimal-pad" />
          <Text style={styles.label}>Valor total (R$)</Text>
          <TextInput style={styles.input} placeholder="Ex: 75.00" placeholderTextColor={colors.placeholder} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
          <Text style={styles.label}>Posto</Text>
          <TextInput style={styles.input} placeholder="Nome do posto (opcional)" placeholderTextColor={colors.placeholder} value={posto} onChangeText={setPosto} />
          <Text style={styles.label}>Quilometragem</Text>
          <TextInput style={styles.input} placeholder="Ex: 15000" placeholderTextColor={colors.placeholder} value={km} onChangeText={setKm} keyboardType="numeric" />
          <Text style={styles.label}>Data</Text>
          <TextInput style={styles.input} placeholder="Ex: 20/04/2025" placeholderTextColor={colors.placeholder} value={data} onChangeText={setData} />
          <TouchableOpacity style={[styles.btnSalvar, salvando && styles.desativado]} onPress={adicionar} disabled={salvando}>
            {salvando ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.btnSalvarTexto}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      )}

      {carregando ? (
        <ActivityIndicator color={colors.text} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={abastecimentos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<View style={styles.vazio}><Text style={styles.vazioTexto}>Nenhum abastecimento registrado.</Text></View>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  resumo: { flexDirection: 'row', backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 16, justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  resumoItem: { alignItems: 'center' },
  resumoValor: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  resumoLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  resumoDivisor: { width: 1, height: 36, backgroundColor: colors.border },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  contador: { color: colors.textSecondary, fontSize: 13 },
  btnAdicionar: { borderWidth: 1, borderColor: colors.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  btnAdicionarTexto: { color: colors.text, fontWeight: '600', fontSize: 13 },
  form: { backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  formTitulo: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, fontSize: 14, marginBottom: 14 },
  btnSalvar: { backgroundColor: colors.button, borderRadius: 6, padding: 14, alignItems: 'center' },
  desativado: { opacity: 0.5 },
  btnSalvarTexto: { color: colors.buttonText, fontWeight: 'bold', fontSize: 14 },
  vazio: { alignItems: 'center', padding: 40 },
  vazioTexto: { color: colors.textMuted, fontSize: 14 },
});
