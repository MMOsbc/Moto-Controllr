// screens/ChecklistScreen.js
// pagina do checklist da moto para
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Alert, TouchableOpacity, Vibration, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { salvarDados, carregarDados } from '../services/storage';
import MotoSelect from '../components/MotoSelect';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
// variaveis dos itens do check list para ele selecionar futuramente, de começo e dado como nao selecionado nada com false
const ITENS_PADRAO = [
  { id: '1', texto: 'Verificar nivel do oleo', marcado: false },
  { id: '2', texto: 'Checar pressao dos pneus', marcado: false },
  { id: '3', texto: 'Testar freios', marcado: false },
  { id: '4', texto: 'Verificar nivel de combustivel', marcado: false },
  { id: '5', texto: 'Checar corrente (lubrificacao)', marcado: false },
  { id: '6', texto: 'Verificar farois e lanternas', marcado: false },
  { id: '7', texto: 'Checar retrovisores', marcado: false },
  { id: '8', texto: 'Verificar documentos', marcado: false },
];
// estrutura do contador de tempo para o proximo checklist 
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
// usando o id da moto para armazenar o checklist
function chaveMetaSemanal(motoId) {
  return `@motoapp:checklist_semanal:${motoId || 'geral'}`;
}
// funcao para reiniciar o tempo da proxima verificacao
function formatarTempoRestante(ms) {
  if (ms <= 0) return { texto: 'Vencido', urgente: true };
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (dias > 0) return { texto: `${dias}d ${horas}h ${minutos}m`, urgente: dias < 2 };
  if (horas > 0) return { texto: `${horas}h ${minutos}m`, urgente: true };
  return { texto: `${minutos}m`, urgente: true };
}
// formato do timer check list
function formatarDataHora(timestamp) {
  if (!timestamp) return '---';
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChecklistScreen() {
  const { motoAtiva } = useAuth();

  // selecao da moto para o checklist atual, pois pode ser diferente da moto que esta ativa
  const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [erroMoto, setErroMoto] = useState('');

  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');

  // verificacoes feitas, ultima conclusao, tempo para o proximo, checklist anteriores 
  const [ultimoConcluido, setUltimoConcluido] = useState(null);
  const [proximoChecklist, setProximoChecklist] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [tempoRestante, setTempoRestante] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const intervalRef = useRef(null);

  // pegar a moto ativa como pre-selecionada para o checklist 
  useFocusEffect(useCallback(() => {
    if (motoAtiva && !motoSelecionada) {
      setMotoSelecionada(motoAtiva);
    }
  }, [motoAtiva]));

  // recarrega caso a moto seja trocada
  useEffect(() => {
    if (motoSelecionada) {
      carregarChecklist(motoSelecionada.id);
      carregarMetaSemanal(motoSelecionada.id);
    }
  }, [motoSelecionada]);

  // cronometro atualizando o tempo para o proximo checklist
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (proximoChecklist) setTempoRestante(proximoChecklist - Date.now());
    }, 60000);
    if (proximoChecklist) setTempoRestante(proximoChecklist - Date.now());
    return () => clearInterval(intervalRef.current);
  }, [proximoChecklist]);
// carrega os itens do checklist de acordo com o bd e a moto atual
  async function carregarChecklist(motoId) {
    const dados = await carregarDados('checklist', motoId);
    if (dados.length === 0) {
      setItens(ITENS_PADRAO);
      await salvarDados('checklist', ITENS_PADRAO, motoId);
    } else {
      setItens(dados);
    }
  }
// carrega os ultimos checklists e se ele esta cumprindo a meta de realizar a cada sete dias
  async function carregarMetaSemanal(motoId) {
    try {
      const chave = chaveMetaSemanal(motoId);
      const json = await AsyncStorage.getItem(chave);
      if (json) {
        const meta = JSON.parse(json);
        setUltimoConcluido(meta.ultimoConcluido || null);
        setHistorico(meta.historico || []);
        if (meta.ultimoConcluido) {
          const proximo = meta.ultimoConcluido + SETE_DIAS_MS;
          setProximoChecklist(proximo);
          setTempoRestante(proximo - Date.now());
        } else {
          setProximoChecklist(null);
          setTempoRestante(null);
          setUltimoConcluido(null);
        }
      } else {
        // moo sem checklist anteriors
        setProximoChecklist(null);
        setTempoRestante(null);
        setUltimoConcluido(null);
        setHistorico([]);
      }
    } catch (e) {
      console.error('Erro ao carregar checklist', e);
    }
  }
// salva o ultimo checklist feito e em caso de erro apresenta ao usuario
  async function salvarMetaSemanal(motoId, novoUltimo, novoHistorico) {
    try {
      const chave = chaveMetaSemanal(motoId);
      await AsyncStorage.setItem(chave, JSON.stringify({
        ultimoConcluido: novoUltimo,
        historico: novoHistorico,
      }));
    } catch (e) {
      console.error('Erro ao salvar checklist semanal',e);
    }
  }

  function handleMotoSelecionada(moto) {
    setMotoSelecionada(moto);
    setErroMoto('');
  }
// altera os itens selecionados para verificado ou nao e salva no bd
  async function alternarItem(id) {
    const novaLista = itens.map(item =>
      item.id === id ? { ...item, marcado: !item.marcado } : item
    );
    setItens(novaLista);
    await salvarDados('checklist', novaLista, motoSelecionada?.id || null);
    Vibration.vibrate(100);
  }
// adicionar item diferente do checklist atual para ser chegado pelo usuario e salvar no bd
  async function adicionarItem() {
    if (!novoItem.trim()) { Alert.alert('Atencao', 'Digite o nome do item!'); return; }
    const item = { id: Date.now().toString(), texto: novoItem.trim(), marcado: false };
    const novaLista = [...itens, item];
    setItens(novaLista);
    await salvarDados('checklist', novaLista, motoSelecionada?.id || null);
    Vibration.vibrate(200);
    setNovoItem('');
  }
// remove item da lista de checklist 
  async function removerItem(id) {
    Alert.alert('Confirmar', 'Deseja remover este item?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          const novaLista = itens.filter(item => item.id !== id);
          setItens(novaLista);
          await salvarDados('checklist', novaLista, motoSelecionada?.id || null);
          Vibration.vibrate(300);
        }
      },
    ]);
  }
 // selecao da moto para concluir o checklist 
  async function concluirChecklist() {
    if (!motoSelecionada) {
      setErroMoto('Selecione a moto antes de concluir');
      Alert.alert('Atencao', 'Selecione a moto para este checklist!');
      return;
    }
   // validacao para o usuario marcar o que foi checado, caso nao foi feito nada nao vai salvar
    const itensMarcados = itens.filter(i => i.marcado).length;
    if (itensMarcados === 0) {
      Alert.alert('Atencao', 'Marque pelo menos um item antes de concluir!');
      return;
    }
    // conclusao do checklist
    const pendentes = itens.filter(i => !i.marcado).length;
    const motoLabel = motoSelecionada.modelo || motoSelecionada.nome || 'Moto';
    const mensagem = pendentes > 0
      ? `Moto: ${motoLabel}\n\n${itensMarcados} de ${itens.length} itens verificados.\n${pendentes} item(s) pendente(s).\n\nDeseja concluir mesmo assim?`
      : `Moto: ${motoLabel}\n\nTodos os ${itens.length} itens verificados!\n\nDeseja concluir o checklist semanal?`;
// vai concluir o check list, atualizar no bd, resetar o tempo e vibrar o celular para avisar que foi salvo
    Alert.alert('Concluir Checklist', mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir', onPress: async () => {
          const agora = Date.now();
          const novoRegistro = {
            timestamp: agora,
            totalItens: itens.length,
            itensMarcados,
            pendentes,
            concluido: pendentes === 0,
            motoId: motoSelecionada.id,
            motoLabel,
          };
          const novoHistorico = [novoRegistro, ...historico].slice(0, 10);
          const proximo = agora + SETE_DIAS_MS;

          setUltimoConcluido(agora);
          setProximoChecklist(proximo);
          setTempoRestante(proximo - Date.now());
          setHistorico(novoHistorico);

          await salvarMetaSemanal(motoSelecionada.id, agora, novoHistorico);

          // desmarca os itens para o prox checklist
          const listaReset = itens.map(i => ({ ...i, marcado: false }));
          setItens(listaReset);
          await salvarDados('checklist', listaReset, motoSelecionada.id);
// vibra o sel avisando que foi salvo e apresenta mensagem 
          Vibration.vibrate([0, 200, 100, 200]);
          Alert.alert(
            pendentes === 0 ? 'Checklist concluido!' : 'Checklist salvo com pendencias',
            `Moto: ${motoLabel}\nProximo checklist em 7 dias.\n${formatarDataHora(proximo)}`
          );
        }
      },
    ]);
  }
// desmarcacao de todos os itens para o prox checklist 
  async function resetarChecklist() {
    Alert.alert('Resetar', 'Desmarcar todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetar', onPress: async () => {
          const novaLista = itens.map(item => ({ ...item, marcado: false }));
          setItens(novaLista);
          await salvarDados('checklist', novaLista, motoSelecionada?.id || null);
          Vibration.vibrate([0, 100, 100, 100]);
        }
      },
    ]);
  }
// calculando a quantidade de itens marcados em porcentagem 
  const itensMarcados = itens.filter(i => i.marcado).length;
  const itensPendentes = itens.filter(i => !i.marcado).length;
  const progresso = itens.length > 0 ? (itensMarcados / itens.length) * 100 : 0;

  const checklistVencido = tempoRestante !== null && tempoRestante <= 0;
  const checklistPendente = ultimoConcluido === null;
  const temAlerta = checklistVencido || checklistPendente;
  const cronometro = tempoRestante !== null ? formatarTempoRestante(tempoRestante) : null;

  return (
    <ScrollView style={es.container} keyboardShouldPersistTaps="handled">

      {/* Seletor de moto */}
      <View style={es.secaoMoto}>
        <Text style={es.secaoMotoLabel}>Moto do Checklist <Text style={{ color: '#111' }}>*</Text></Text>
        <MotoSelect
          motoSelecionadaId={motoSelecionada?.id}
          onSelecionar={handleMotoSelecionada}
          erro={erroMoto}
          obrigatorio
        />
        {motoSelecionada && (
          <Text style={es.motoSelecionadaTexto}>
            Checklist de: {motoSelecionada.modelo || motoSelecionada.nome}
            {motoSelecionada.placa ? ` · ${motoSelecionada.placa}` : ''}
          </Text>
        )}
      </View>

      {/* Alerta de pendencia */}
      {motoSelecionada && temAlerta && (
        <View style={es.alerta}>
          <Text style={es.alertaTitulo}>
            {checklistPendente ? 'Checklist nunca realizado!' : 'Checklist semanal vencido!'}
          </Text>
          <Text style={es.alertaTexto}>
            {checklistPendente
              ? `Realize o primeiro checklist para "${motoSelecionada.modelo || motoSelecionada.nome}".`
              : 'Ja passou 7 dias desde o ultimo checklist. Realize agora!'}
          </Text>
        </View>
      )}

      {/* Cronometro semanal */}
      {motoSelecionada && (
        <View style={[es.cardCronometro, temAlerta && es.cardCronometroAlerta]}>
          <View style={es.cronometroTopo}>
            <Text style={es.cronometroLabel}>PROXIMO CHECKLIST EM</Text>
            {ultimoConcluido && (
              <Text style={es.cronometroUltimo}>Ultimo: {formatarDataHora(ultimoConcluido)}</Text>
            )}
          </View>

          {cronometro ? (
            <Text style={[es.cronometroValor, cronometro.urgente && es.cronometroUrgente]}>
              {cronometro.texto}
            </Text>
          ) : (
            <Text style={es.cronometroNenhum}>Nenhum realizado ainda</Text>
          )}

          {ultimoConcluido && tempoRestante !== null && (
            <View style={es.barraSemanaBg}>
              <View style={[
                es.barraSemanFill,
                { width: `${Math.max(0, Math.min(100, ((SETE_DIAS_MS - Math.max(0, tempoRestante)) / SETE_DIAS_MS) * 100))}%` },
                checklistVencido && { backgroundColor: '#888888' }
              ]} />
            </View>
          )}
        </View>
      )}

      {/* Progresso */}
      <View style={es.progressoContainer}>
        <View style={es.progressoInfo}>
          <Text style={es.progressoTexto}>{itensMarcados}/{itens.length} itens verificados</Text>
          <Text style={es.progressoPorcentagem}>{Math.round(progresso)}%</Text>
        </View>
        <View style={es.barraBg}>
          <View style={[es.barraFill, { width: `${progresso}%` }]} />
        </View>
        {itensPendentes > 0 && itensMarcados > 0 && (
          <Text style={es.pendentesTexto}>{itensPendentes} item(s) pendente(s)</Text>
        )}
      </View>

      {/* Adicionar item */}
      <View style={es.addContainer}>
        <TextInput
          style={es.inputAdd}
          placeholder="Novo item do checklist..."
          placeholderTextColor="#AAAAAA"
          value={novoItem}
          onChangeText={setNovoItem}
          onSubmitEditing={adicionarItem}
        />
        <TouchableOpacity style={es.botaoAdd} onPress={adicionarItem}>
          <Text style={es.textoBotaoAdd}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={es.dica}>Toque para marcar · Segure para remover</Text>

      {/* Lista */}
      {itens.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[es.itemChecklist, item.marcado && es.itemMarcado]}
          onPress={() => alternarItem(item.id)}
          onLongPress={() => removerItem(item.id)}
        >
          <View style={[es.checkbox, item.marcado && es.checkboxMarcado]}>
            {item.marcado && <Text style={es.checkmark}>OK</Text>}
          </View>
          <Text style={[es.itemTexto, item.marcado && es.itemTextoMarcado]}>{item.texto}</Text>
        </TouchableOpacity>
      ))}

      {itens.length === 0 && (
        <View style={es.vazio}>
          <Text style={es.vazioTexto}>Checklist vazio. Adicione itens!</Text>
        </View>
      )}

      {/* Botoes */}
      <View style={es.botoesContainer}>
        <TouchableOpacity style={es.botaoConcluir} onPress={concluirChecklist}>
          <Text style={es.textoBotaoConcluir}>Concluir Checklist Semanal</Text>
        </TouchableOpacity>
        {itensMarcados > 0 && (
          <TouchableOpacity style={es.botaoReset} onPress={resetarChecklist}>
            <Text style={es.textoBotaoReset}>Desmarcar todos</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Historico */}
      {historico.length > 0 && (
        <View style={es.historicoContainer}>
          <TouchableOpacity style={es.historicoHeader} onPress={() => setMostrarHistorico(!mostrarHistorico)}>
            <Text style={es.historicoTitulo}>Historico ({historico.length})</Text>
            <Text style={es.historicoSeta}>{mostrarHistorico ? 'Fechar' : 'Ver'}</Text>
          </TouchableOpacity>

          {mostrarHistorico && historico.map((item, index) => (
            <View key={index} style={[es.histCard, item.concluido ? es.histCardOk : es.histCardPendente]}>
              <View style={{ flex: 1 }}>
                <Text style={es.histData}>{formatarDataHora(item.timestamp)}</Text>
                <Text style={es.histMoto}>{item.motoLabel || 'Moto'}</Text>
                <Text style={es.histDetalhe}>
                  {item.itensMarcados}/{item.totalItens} itens
                  {item.pendentes > 0 ? ` · ${item.pendentes} pendente(s)` : ''}
                </Text>
              </View>
              <View style={[es.histBadge, item.concluido ? es.histBadgeOk : es.histBadgePendente]}>
                <Text style={es.histBadgeTexto}>{item.concluido ? 'OK' : 'Parcial'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },

  secaoMoto: { marginBottom: 14 },
  secaoMotoLabel: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  motoSelecionadaTexto: { color: '#888888', fontSize: 12, marginTop: 6, marginLeft: 2 },

  alerta: { backgroundColor: '#111111', borderRadius: 12, padding: 16, marginBottom: 14 },
  alertaTitulo: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  alertaTexto: { color: '#CCCCCC', fontSize: 13, lineHeight: 18 },

  cardCronometro: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  cardCronometroAlerta: { borderColor: '#111111', borderWidth: 2 },
  cronometroTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cronometroLabel: { color: '#888888', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  cronometroUltimo: { color: '#888888', fontSize: 11 },
  cronometroValor: { color: '#111111', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  cronometroUrgente: { color: '#111111' },
  cronometroNenhum: { color: '#AAAAAA', fontSize: 18, fontWeight: '600', marginBottom: 10 },
  barraSemanaBg: { backgroundColor: '#E0E0E0', borderRadius: 10, height: 6, overflow: 'hidden', marginTop: 4 },
  barraSemanFill: { backgroundColor: '#111111', height: 6, borderRadius: 10 },

  progressoContainer: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  progressoInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressoTexto: { color: '#888888', fontSize: 13 },
  progressoPorcentagem: { color: '#111111', fontWeight: '700', fontSize: 13 },
  barraBg: { backgroundColor: '#E0E0E0', borderRadius: 10, height: 8, overflow: 'hidden' },
  barraFill: { backgroundColor: '#111111', height: 8, borderRadius: 10 },
  pendentesTexto: { color: '#888888', fontSize: 11, marginTop: 6 },

  addContainer: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  inputAdd: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, color: '#111111', fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  botaoAdd: { backgroundColor: '#111111', borderRadius: 10, width: 48, justifyContent: 'center', alignItems: 'center' },
  textoBotaoAdd: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  dica: { color: '#AAAAAA', fontSize: 11, marginBottom: 10, textAlign: 'center' },

  itemChecklist: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  itemMarcado: { opacity: 0.55, borderColor: '#CCCCCC' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#CCCCCC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxMarcado: { backgroundColor: '#111111', borderColor: '#111111' },
  checkmark: { color: '#FFFFFF', fontWeight: '800', fontSize: 9 },
  itemTexto: { color: '#111111', fontSize: 15, flex: 1 },
  itemTextoMarcado: { textDecorationLine: 'line-through', color: '#AAAAAA' },

  botoesContainer: { marginTop: 12, gap: 10 },
  botaoConcluir: { backgroundColor: '#111111', borderRadius: 12, padding: 16, alignItems: 'center' },
  textoBotaoConcluir: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  botaoReset: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  textoBotaoReset: { color: '#444444', fontWeight: '600', fontSize: 14 },

  historicoContainer: { marginTop: 20, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  historicoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historicoTitulo: { color: '#111111', fontWeight: '700', fontSize: 14 },
  historicoSeta: { color: '#888888', fontSize: 13 },
  histCard: { borderRadius: 10, padding: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histCardOk: { backgroundColor: '#EEEEEE' },
  histCardPendente: { backgroundColor: '#E8E8E8', borderLeftWidth: 3, borderLeftColor: '#AAAAAA' },
  histData: { color: '#111111', fontWeight: '600', fontSize: 13 },
  histMoto: { color: '#555555', fontSize: 12, marginTop: 1, fontWeight: '500' },
  histDetalhe: { color: '#888888', fontSize: 12, marginTop: 2 },
  histBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  histBadgeOk: { backgroundColor: '#111111' },
  histBadgePendente: { backgroundColor: '#888888' },
  histBadgeTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  vazio: { alignItems: 'center', paddingVertical: 30 },
  vazioTexto: { color: '#888888', fontSize: 14 },
});
