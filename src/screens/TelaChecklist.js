// tela de checklist semanal de seguranca
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { salvarChecklist, buscarChecklists, ITENS_CHECKLIST } from '../services/checklistService';
import { buscarMotos } from '../services/motoService';
import Cabecalho from '../components/Cabecalho';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

const TelaChecklist = () => {
  const [motos, setMotos] = useState([]);
  const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [marcados, setMarcados] = useState({});
  const [historico, setHistorico] = useState([]);
  const [aba, setAba] = useState('checklist'); // 'checklist' ou 'historico'
  const [carregando, setCarregando] = useState(false);

  const usuario = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    try {
      const [m, h] = await Promise.all([
        buscarMotos(usuario.uid),
        buscarChecklists(usuario.uid),
      ]);
      setMotos(m);
      setHistorico(h);
      if (m.length > 0 && !motoSelecionada) {
        setMotoSelecionada(m[0]);
      }
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel carregar os dados.');
    }
  };

  // alterna o estado de marcado de um item
  const toggleItem = async (chave) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMarcados((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  // calcula a porcentagem de itens concluidos
  const porcentagem = () => {
    const total = ITENS_CHECKLIST.length;
    const marcadosCount = Object.values(marcados).filter(Boolean).length;
    return Math.round((marcadosCount / total) * 100);
  };

  // salva o checklist atual no banco de dados
  const handleSalvar = async () => {
    if (!motoSelecionada) {
      Alert.alert('Atencao', 'Selecione uma moto para o checklist.');
      return;
    }
    setCarregando(true);
    try {
      await salvarChecklist(usuario.uid, motoSelecionada.id, marcados);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Checklist salvo com sucesso!', [
        { text: 'OK', onPress: () => { setMarcados({}); carregarDados(); } },
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel salvar o checklist.');
    } finally {
      setCarregando(false);
    }
  };

  const pct = porcentagem();

  return (
    <View style={estilos.container}>
      <Cabecalho titulo="Checklist Semanal" />

      {/* abas de navegacao */}
      <View style={estilos.abas}>
        <TouchableOpacity
          style={[estilos.aba, aba === 'checklist' && estilos.abaSelecionada]}
          onPress={() => setAba('checklist')}
        >
          <Text style={[estilos.abaTexto, aba === 'checklist' && estilos.abaTextoSelecionado]}>
            Novo check
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.aba, aba === 'historico' && estilos.abaSelecionada]}
          onPress={() => setAba('historico')}
        >
          <Text style={[estilos.abaTexto, aba === 'historico' && estilos.abaTextoSelecionado]}>
            Historico
          </Text>
        </TouchableOpacity>
      </View>

      {aba === 'checklist' ? (
        <ScrollView contentContainerStyle={estilos.scroll}>
          {/* selecao de moto */}
          {motos.length > 0 ? (
            <View>
              <Text style={estilos.secaoTitulo}>Moto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.motosScroll}>
                {motos.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[estilos.motoPastilha, motoSelecionada?.id === m.id && estilos.motoPastilhaSelecionada]}
                    onPress={() => setMotoSelecionada(m)}
                  >
                    <Text style={[estilos.motoPastilhaTexto, motoSelecionada?.id === m.id && estilos.motoPastilhaTextoSelecionado]}>
                      {m.marca} {m.modelo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Cartao>
              <Text style={estilos.semMoto}>Cadastre uma moto antes de fazer o checklist.</Text>
            </Cartao>
          )}

          {/* barra de progresso */}
          <View style={estilos.progresso}>
            <View style={estilos.progressoTopo}>
              <Text style={estilos.progressoLabel}>Progresso do checklist</Text>
              <Text style={estilos.progressoPct}>{pct}%</Text>
            </View>
            <View style={estilos.barraFundo}>
              <View style={[estilos.barra, { width: `${pct}%` }]} />
            </View>
          </View>

          {/* lista de itens */}
          <Text style={estilos.secaoTitulo}>Itens de verificacao</Text>
          {ITENS_CHECKLIST.map((item) => {
            const marcado = marcados[item.chave] || false;
            return (
              <TouchableOpacity
                key={item.chave}
                style={[estilos.item, marcado && estilos.itemMarcado]}
                onPress={() => toggleItem(item.chave)}
                activeOpacity={0.7}
              >
                <View style={[estilos.checkbox, marcado && estilos.checkboxMarcado]}>
                  {marcado && <Text style={estilos.checkmark}>X</Text>}
                </View>
                <Text style={[estilos.itemLabel, marcado && estilos.itemLabelMarcado]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Botao
            titulo="Salvar checklist"
            onPress={handleSalvar}
            carregando={carregando}
            estilo={estilos.botaoSalvar}
          />
        </ScrollView>
      ) : (
        // historico de checklists salvos
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.scroll}
          renderItem={({ item }) => {
            const total = ITENS_CHECKLIST.length;
            const aprovados = Object.values(item.itens || {}).filter(Boolean).length;
            return (
              <Cartao>
                <View style={estilos.historicoTopo}>
                  <Text style={estilos.historicoData}>
                    {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={[estilos.historicoScore, aprovados === total && estilos.historicoScoreOk]}>
                    {aprovados}/{total}
                  </Text>
                </View>
                <View style={estilos.historicoItens}>
                  {ITENS_CHECKLIST.map((i) => (
                    <View key={i.chave} style={estilos.historicoItem}>
                      <Text style={[estilos.historicoItemPonto, item.itens?.[i.chave] && estilos.historicoItemPontoOk]}>
                        {item.itens?.[i.chave] ? 'OK' : '--'}
                      </Text>
                      <Text style={estilos.historicoItemLabel}>{i.label}</Text>
                    </View>
                  ))}
                </View>
              </Cartao>
            );
          }}
          ListEmptyComponent={
            <View style={estilos.vazio}>
              <Text style={estilos.vazioTitulo}>Nenhum checklist salvo</Text>
              <Text style={estilos.vazioTexto}>Complete o checklist semanal e salve para ver o historico.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  abas: { flexDirection: 'row', backgroundColor: CORES.branco, borderBottomWidth: 1, borderBottomColor: CORES.cinzaBorda },
  aba: { flex: 1, paddingVertical: ESPACAMENTO.md, alignItems: 'center' },
  abaSelecionada: { borderBottomWidth: 2, borderBottomColor: CORES.preto },
  abaTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  abaTextoSelecionado: { color: CORES.preto, fontWeight: '700' },
  scroll: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  secaoTitulo: { fontSize: FONTE.xs, fontWeight: '700', color: CORES.cinzaClaro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACAMENTO.sm, marginTop: ESPACAMENTO.sm },
  motosScroll: { marginBottom: ESPACAMENTO.md },
  motoPastilha: { paddingHorizontal: ESPACAMENTO.md, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, borderWidth: 1.5, borderColor: CORES.cinzaBorda, marginRight: ESPACAMENTO.xs, backgroundColor: CORES.branco },
  motoPastilhaSelecionada: { backgroundColor: CORES.preto, borderColor: CORES.preto },
  motoPastilhaTexto: { fontSize: FONTE.sm, color: CORES.cinzaMedio },
  motoPastilhaTextoSelecionado: { color: CORES.branco, fontWeight: '600' },
  semMoto: { fontSize: FONTE.sm, color: CORES.cinzaClaro, textAlign: 'center' },
  progresso: { backgroundColor: CORES.branco, borderRadius: BORDA.lg, padding: ESPACAMENTO.md, marginBottom: ESPACAMENTO.md, borderWidth: 1, borderColor: CORES.cinzaBorda },
  progressoTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ESPACAMENTO.sm },
  progressoLabel: { fontSize: FONTE.sm, color: CORES.cinzaTexto },
  progressoPct: { fontSize: FONTE.md, fontWeight: '800', color: CORES.preto },
  barraFundo: { height: 6, backgroundColor: CORES.cinzaFundo, borderRadius: BORDA.full, overflow: 'hidden' },
  barra: { height: '100%', backgroundColor: CORES.preto, borderRadius: BORDA.full },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    borderRadius: BORDA.md,
    padding: ESPACAMENTO.md,
    marginBottom: ESPACAMENTO.xs,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
  },
  itemMarcado: { borderColor: CORES.preto },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDA.sm,
    borderWidth: 2,
    borderColor: CORES.cinzaBorda,
    marginRight: ESPACAMENTO.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: CORES.preto, borderColor: CORES.preto },
  checkmark: { color: CORES.branco, fontSize: FONTE.xs, fontWeight: '800' },
  itemLabel: { fontSize: FONTE.md, color: CORES.cinzaTexto },
  itemLabelMarcado: { color: CORES.preto, fontWeight: '600' },
  botaoSalvar: { marginTop: ESPACAMENTO.lg },
  historicoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACAMENTO.sm },
  historicoData: { fontSize: FONTE.sm, color: CORES.cinzaTexto, textTransform: 'capitalize' },
  historicoScore: { fontSize: FONTE.md, fontWeight: '700', color: CORES.cinzaClaro },
  historicoScoreOk: { color: CORES.sucesso },
  historicoItens: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACAMENTO.xs },
  historicoItem: { flexDirection: 'row', alignItems: 'center', gap: ESPACAMENTO.xs },
  historicoItemPonto: { fontSize: FONTE.xs, fontWeight: '700', color: CORES.cinzaBorda },
  historicoItemPontoOk: { color: CORES.sucesso },
  historicoItemLabel: { fontSize: FONTE.xs, color: CORES.cinzaClaro },
  vazio: { alignItems: 'center', padding: ESPACAMENTO.xxl },
  vazioTitulo: { fontSize: FONTE.lg, fontWeight: '700', color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  vazioTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro, textAlign: 'center' },
});

export default TelaChecklist;
