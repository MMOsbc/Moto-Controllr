// tela de manutencoes - listagem e acoes crud
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  buscarManutencoes,
  adicionarManutencao,
  atualizarManutencao,
  removerManutencao,
} from '../services/manutencaoService';
import Cabecalho from '../components/Cabecalho';
import Cartao from '../components/Cartao';
import Campo from '../components/Campo';
import Botao from '../components/Botao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

// tipos padrao de manutencao
const TIPOS = ['Troca de oleo', 'Revisao geral', 'Pneus', 'Freios', 'Corrente', 'Filtros', 'Eletrica', 'Outro'];

const TelaManutencoes = ({ navigation }) => {
  const [manutencoes, setManutencoes] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // campos do formulario
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [custo, setCusto] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const usuario = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
      carregarManutencoes();
    }, [])
  );

  const carregarManutencoes = async () => {
    try {
      const dados = await buscarManutencoes(usuario.uid);
      setManutencoes(dados);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel carregar as manutencoes.');
    }
  };

  // abre o modal para adicionar ou editar
  const abrirModal = (manutencao = null) => {
    if (manutencao) {
      setEditando(manutencao);
      setTipo(manutencao.tipo || '');
      setDescricao(manutencao.descricao || '');
      setData(manutencao.data || '');
      setQuilometragem(manutencao.quilometragem || '');
      setCusto(manutencao.custo || '');
      setObservacoes(manutencao.observacoes || '');
    } else {
      setEditando(null);
      setTipo('');
      setDescricao('');
      setData('');
      setQuilometragem('');
      setCusto('');
      setObservacoes('');
    }
    setModalVisivel(true);
  };

  const handleSalvar = async () => {
    if (!tipo.trim() || !descricao.trim()) {
      Alert.alert('Atencao', 'Tipo e descricao sao obrigatorios.');
      return;
    }
    setCarregando(true);
    const dados = { tipo, descricao, data, quilometragem, custo, observacoes };

    try {
      if (editando) {
        await atualizarManutencao(editando.id, dados);
      } else {
        await adicionarManutencao(usuario.uid, dados);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisivel(false);
      carregarManutencoes();
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar.');
    } finally {
      setCarregando(false);
    }
  };

  const confirmarRemocao = (id) => {
    Alert.alert('Remover', 'Deseja remover esta manutencao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await removerManutencao(id);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          carregarManutencoes();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Cartao>
      <View style={estilos.itemTopo}>
        <View style={estilos.tipoTag}>
          <Text style={estilos.tipoTexto}>{item.tipo}</Text>
        </View>
        {item.custo ? (
          <Text style={estilos.custo}>R$ {parseFloat(item.custo).toFixed(2)}</Text>
        ) : null}
      </View>
      <Text style={estilos.descricao}>{item.descricao}</Text>
      {item.quilometragem ? (
        <Text style={estilos.km}>{parseInt(item.quilometragem).toLocaleString('pt-BR')} km</Text>
      ) : null}
      {item.observacoes ? (
        <Text style={estilos.obs}>{item.observacoes}</Text>
      ) : null}
      <View style={estilos.rodape}>
        <Text style={estilos.dataTexto}>
          {item.data || new Date(item.criadoEm).toLocaleDateString('pt-BR')}
        </Text>
        <View style={estilos.acoes}>
          <TouchableOpacity onPress={() => abrirModal(item)} style={estilos.botaoAcao}>
            <Text style={estilos.botaoAcaoTexto}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmarRemocao(item.id)} style={[estilos.botaoAcao, estilos.botaoRemover]}>
            <Text style={[estilos.botaoAcaoTexto, estilos.textoRemover]}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Cartao>
  );

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo="Manutencoes"
        acaoDireita={
          <TouchableOpacity onPress={() => abrirModal()}>
            <Text style={estilos.botaoAdicionar}>+</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={manutencoes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <View style={estilos.vazio}>
            <Text style={estilos.vazioTitulo}>Nenhuma manutencao registrada</Text>
            <Text style={estilos.vazioTexto}>Toque no + para adicionar uma manutencao.</Text>
          </View>
        }
      />

      {/* modal de cadastro/edicao */}
      <Modal visible={modalVisivel} animationType="slide" onRequestClose={() => setModalVisivel(false)}>
        <KeyboardAvoidingView
          style={estilos.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Cabecalho
            titulo={editando ? 'Editar Manutencao' : 'Nova Manutencao'}
            aoVoltar={() => setModalVisivel(false)}
          />
          <ScrollView contentContainerStyle={estilos.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={estilos.labelTipo}>Tipo de manutencao *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.tiposScroll}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[estilos.tipoPastilha, tipo === t && estilos.tipoPastilhaSelecionada]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[estilos.tipoPastilhaTexto, tipo === t && estilos.tipoPastilhaTextoSelecionado]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Campo label="Descricao" valor={descricao} aoMudar={setDescricao} placeholder="Descreva o servico realizado" multiline obrigatorio />
            <Campo label="Data" valor={data} aoMudar={setData} placeholder="DD/MM/AAAA" />
            <Campo label="Quilometragem" valor={quilometragem} aoMudar={setQuilometragem} placeholder="Ex: 15000" tipo="numeric" />
            <Campo label="Custo (R$)" valor={custo} aoMudar={setCusto} placeholder="Ex: 250.00" tipo="decimal-pad" />
            <Campo label="Observacoes" valor={observacoes} aoMudar={setObservacoes} placeholder="Informacoes adicionais" multiline />

            <Botao titulo={editando ? 'Salvar alteracoes' : 'Adicionar'} onPress={handleSalvar} carregando={carregando} estilo={estilos.botaoSalvar} />
            <Botao titulo="Cancelar" onPress={() => setModalVisivel(false)} variante="fantasma" />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  flex: { flex: 1, backgroundColor: CORES.branco },
  botaoAdicionar: { fontSize: 28, color: CORES.preto, fontWeight: '300', lineHeight: 32 },
  lista: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  itemTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACAMENTO.xs },
  tipoTag: { backgroundColor: CORES.cinzaFundo, paddingHorizontal: ESPACAMENTO.sm, paddingVertical: 2, borderRadius: BORDA.full },
  tipoTexto: { fontSize: FONTE.xs, color: CORES.cinzaMedio, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  custo: { fontSize: FONTE.md, fontWeight: '700', color: CORES.preto },
  descricao: { fontSize: FONTE.md, color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  km: { fontSize: FONTE.sm, color: CORES.cinzaClaro, marginBottom: ESPACAMENTO.xs },
  obs: { fontSize: FONTE.sm, color: CORES.cinzaTexto, fontStyle: 'italic', marginBottom: ESPACAMENTO.xs },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: ESPACAMENTO.xs },
  dataTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro },
  acoes: { flexDirection: 'row', gap: ESPACAMENTO.xs },
  botaoAcao: { paddingHorizontal: ESPACAMENTO.sm, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, borderWidth: 1, borderColor: CORES.cinzaBorda },
  botaoRemover: { borderColor: CORES.erro },
  botaoAcaoTexto: { fontSize: FONTE.sm, color: CORES.preto },
  textoRemover: { color: CORES.erro },
  vazio: { alignItems: 'center', padding: ESPACAMENTO.xxl },
  vazioTitulo: { fontSize: FONTE.lg, fontWeight: '700', color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  vazioTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro },
  modalScroll: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  labelTipo: { fontSize: FONTE.sm, fontWeight: '600', color: CORES.cinzaMedio, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: ESPACAMENTO.sm },
  tiposScroll: { marginBottom: ESPACAMENTO.md },
  tipoPastilha: { paddingHorizontal: ESPACAMENTO.md, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, borderWidth: 1.5, borderColor: CORES.cinzaBorda, marginRight: ESPACAMENTO.xs },
  tipoPastilhaSelecionada: { backgroundColor: CORES.preto, borderColor: CORES.preto },
  tipoPastilhaTexto: { fontSize: FONTE.sm, color: CORES.cinzaMedio },
  tipoPastilhaTextoSelecionado: { color: CORES.branco, fontWeight: '600' },
  botaoSalvar: { marginTop: ESPACAMENTO.md, marginBottom: ESPACAMENTO.sm },
});

export default TelaManutencoes;
