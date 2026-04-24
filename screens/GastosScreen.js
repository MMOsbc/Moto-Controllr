// screens/GastosScreen.js
// tela de controle de gastos gerais
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

// categorias de gasto em texto simples sem emoji
const CATEGORIAS = ['Peca', 'Servico', 'Seguro', 'IPVA/Doc', 'Acessorio', 'Outro'];

export default function GastosScreen({ usuario }) {
  const [gastos, setGastos] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [data, setData] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await carregarItens('gastos', usuario.uid);
    setGastos(dados);
    setCarregando(false);
  }

  async function adicionar() {
    if (!descricao.trim() || !valor.trim()) {
      Alert.alert('Atencao', 'Informe a descricao e o valor.');
      return;
    }
    setSalvando(true);
    const novo = {
      descricao: descricao.trim(),
      valor: valor.trim(),
      categoria,
      data: data.trim() || new Date().toLocaleDateString('pt-BR'),
    };
    const id = await salvarItem('gastos', novo, usuario.uid);
    if (id) {
      setGastos([{ id, ...novo, criadoEm: Date.now() }, ...gastos]);
      Vibration.vibrate(100);
      Alert.alert('Sucesso', 'Gasto registrado!');
      setDescricao(''); setValor(''); setData('');
      setMostrarForm(false);
    } else {
      Alert.alert('Erro', 'Nao foi possivel salvar.');
    }
    setSalvando(false);
  }

  async function excluir(id) {
    Alert.alert('Excluir', 'Deseja excluir este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await deletarItem('gastos', id);
          setGastos(gastos.filter((i) => i.id !== id));
          Vibration.vibrate([0, 50, 50, 50]);
        },
      },
    ]);
  }

  // soma total de todos os gastos da lista
  const totalGeral = gastos.reduce((acc, i) => acc + parseFloat(i.valor || 0), 0);

  function renderItem({ item }) {
    return (
      <ItemCard
        titulo={item.descricao}
        subtitulo={`${item.categoria}  |  ${item.data}`}
        info={`R$ ${parseFloat(item.valor).toFixed(2)}`}
        onExcluir={() => excluir(item.id)}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* card com total acumulado de gastos */}
      <View style={styles.cardTotal}>
        <Text style={styles.cardTotalLabel}>TOTAL DE GASTOS</Text>
        <Text style={styles.cardTotalValor}>R$ {totalGeral.toFixed(2)}</Text>
      </View>

      <View style={styles.topBar}>
        <Text style={styles.contador}>{gastos.length} registro(s)</Text>
        <TouchableOpacity style={styles.btnAdicionar} onPress={() => setMostrarForm(!mostrarForm)}>
          <Text style={styles.btnAdicionarTexto}>{mostrarForm ? 'Fechar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>

      {mostrarForm && (
        <View style={styles.form}>
          <Text style={styles.formTitulo}>Novo gasto</Text>

          {/* grade de categorias para selecionar */}
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categorias}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBotao, categoria === cat && styles.catAtivo]}
                onPress={() => setCategoria(cat)}
              >
                <Text style={[styles.catTexto, categoria === cat && styles.catTextoAtivo]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Descricao</Text>
          <TextInput style={styles.input} placeholder="Descricao do gasto" placeholderTextColor={colors.placeholder} value={descricao} onChangeText={setDescricao} />
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput style={styles.input} placeholder="Ex: 250.00" placeholderTextColor={colors.placeholder} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
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
          data={gastos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<View style={styles.vazio}><Text style={styles.vazioTexto}>Nenhum gasto registrado.</Text></View>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cardTotal: { backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cardTotalLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  cardTotalValor: { color: colors.text, fontSize: 26, fontWeight: 'bold' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  contador: { color: colors.textSecondary, fontSize: 13 },
  btnAdicionar: { borderWidth: 1, borderColor: colors.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  btnAdicionarTexto: { color: colors.text, fontWeight: '600', fontSize: 13 },
  form: { backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  formTitulo: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBotao: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catAtivo: { backgroundColor: colors.button, borderColor: colors.button },
  catTexto: { color: colors.textSecondary, fontSize: 12 },
  catTextoAtivo: { color: colors.buttonText, fontWeight: 'bold' },
  input: { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, fontSize: 14, marginBottom: 14 },
  btnSalvar: { backgroundColor: colors.button, borderRadius: 6, padding: 14, alignItems: 'center' },
  desativado: { opacity: 0.5 },
  btnSalvarTexto: { color: colors.buttonText, fontWeight: 'bold', fontSize: 14 },
  vazio: { alignItems: 'center', padding: 40 },
  vazioTexto: { color: colors.textMuted, fontSize: 14 },
});
