// screens/PneusScreen.js
// tela de controle de pneus
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

export default function PneusScreen({ usuario }) {
  const [pneus, setPneus] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [posicao, setPosicao] = useState('Dianteiro');
  const [marca, setMarca] = useState('');
  const [valor, setValor] = useState('');
  const [km, setKm] = useState('');
  const [data, setData] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await carregarItens('pneus', usuario.uid);
    setPneus(dados);
    setCarregando(false);
  }

  async function adicionar() {
    if (!descricao.trim()) {
      Alert.alert('Atencao', 'Informe a descricao.');
      return;
    }
    setSalvando(true);
    const novo = {
      descricao: descricao.trim(),
      posicao,
      marca: marca.trim() || 'Nao informada',
      valor: valor.trim(),
      km: km.trim(),
      data: data.trim() || new Date().toLocaleDateString('pt-BR'),
    };
    const id = await salvarItem('pneus', novo, usuario.uid);
    if (id) {
      setPneus([{ id, ...novo, criadoEm: Date.now() }, ...pneus]);
      Vibration.vibrate(100);
      Alert.alert('Sucesso', 'Registro de pneu salvo!');
      setDescricao(''); setMarca(''); setValor(''); setKm(''); setData('');
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
          await deletarItem('pneus', id);
          setPneus(pneus.filter((i) => i.id !== id));
          Vibration.vibrate([0, 50, 50, 50]);
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <ItemCard
        titulo={`${item.posicao} - ${item.descricao}`}
        subtitulo={`${item.marca}  |  ${item.data}${item.km ? '  |  ' + item.km + ' km' : ''}`}
        info={item.valor ? `R$ ${parseFloat(item.valor).toFixed(2)}` : null}
        onExcluir={() => excluir(item.id)}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <Text style={styles.contador}>{pneus.length} registro(s)</Text>
        <TouchableOpacity style={styles.btnAdicionar} onPress={() => setMostrarForm(!mostrarForm)}>
          <Text style={styles.btnAdicionarTexto}>{mostrarForm ? 'Fechar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>

      {mostrarForm && (
        <View style={styles.form}>
          <Text style={styles.formTitulo}>Novo registro de pneu</Text>

          {/* seletor de posicao dianteiro ou traseiro */}
          <Text style={styles.label}>Posicao</Text>
          <View style={styles.seletor}>
            {['Dianteiro', 'Traseiro'].map((op) => (
              <TouchableOpacity
                key={op}
                style={[styles.opcao, posicao === op && styles.opcaoAtiva]}
                onPress={() => setPosicao(op)}
              >
                <Text style={[styles.opcaoTexto, posicao === op && styles.opcaoTextoAtivo]}>{op}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Descricao</Text>
          <TextInput style={styles.input} placeholder="Ex: Troca de pneu" placeholderTextColor={colors.placeholder} value={descricao} onChangeText={setDescricao} />
          <Text style={styles.label}>Marca</Text>
          <TextInput style={styles.input} placeholder="Ex: Pirelli" placeholderTextColor={colors.placeholder} value={marca} onChangeText={setMarca} />
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput style={styles.input} placeholder="Ex: 350.00" placeholderTextColor={colors.placeholder} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
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
          data={pneus}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<View style={styles.vazio}><Text style={styles.vazioTexto}>Nenhum registro de pneu.</Text></View>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  contador: { color: colors.textSecondary, fontSize: 13 },
  btnAdicionar: { borderWidth: 1, borderColor: colors.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  btnAdicionarTexto: { color: colors.text, fontWeight: '600', fontSize: 13 },
  form: { backgroundColor: colors.surface, margin: 16, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  formTitulo: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  seletor: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  opcao: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 10, alignItems: 'center' },
  opcaoAtiva: { backgroundColor: colors.button, borderColor: colors.button },
  opcaoTexto: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  opcaoTextoAtivo: { color: colors.buttonText },
  input: { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, fontSize: 14, marginBottom: 14 },
  btnSalvar: { backgroundColor: colors.button, borderRadius: 6, padding: 14, alignItems: 'center' },
  desativado: { opacity: 0.5 },
  btnSalvarTexto: { color: colors.buttonText, fontWeight: 'bold', fontSize: 14 },
  vazio: { alignItems: 'center', padding: 40 },
  vazioTexto: { color: colors.textMuted, fontSize: 14 },
});
