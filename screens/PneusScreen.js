// screens/PneusScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Vibration, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { salvarDados, carregarDados } from '../services/storage';
import ItemCard from '../components/ItemCard';
import MotoSelect from '../components/MotoSelect';
import ValidatedInput from '../components/ValidatedInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { validarObrigatorio, validarValorMonetario, validarDataBR, mascaraDataBR, formatarMoeda, parseMoeda } from '../utils/validators';
// tipos de pneus para serem selecionados na troca
const TIPOS_PNEU = ['Dianteiro', 'Traseiro', 'Ambos'];
// variaveis para armazenar os dados de troca de pneus deixados limpos para serem usados na validacao e registro de uma nova troca de pneu
const errosIniciais = { tipo: '', marca: '', valor: '', km: '', data: '', motoId: '' };
// funcao para validar se os kms inseridos foram colocados corretos, nao sendo negativos, vazios ou vazio
function validarKm(valor) {
  if (!valor || valor.trim() === '') return '';
  const num = parseInt(valor.replace(/\D/g, ''), 10);
  if (isNaN(num)) return 'Quilometragem invalida';
  if (num < 0) return 'Quilometragem nao pode ser negativa';
  if (num > 999999) return 'Quilometragem muito alta';
  return '';
}
// tela para registrar as trocas de pneus realizadas, o usuario pode selecionar o tipo do pneu, marca/modelo, valor gasto, quilometragem na troca, data da troca e a moto relacionada a troca, caso tenha mais de uma cadastrada
export default function PneusScreen() {
  const { motoAtiva } = useAuth();
  const [pneus, setPneus] = useState([]);
  const [tipo, setTipo] = useState('Dianteiro');
  const [marca, setMarca] = useState('');
  const [valor, setValor] = useState('');
  const [km, setKm] = useState('');
  const [data, setData] = useState('');
  const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
// carrega as trocas de pneus do db e seleciona a moto ativa do usuario para ja mostrar as trocas relacionadas a ela, caso queira registrar uma troca para outra moto pode selecionar no formulario
  useFocusEffect(useCallback(() => {
    carregarPneus();
    if (motoAtiva && !motoSelecionada) setMotoSelecionada(motoAtiva);
  }, [motoAtiva]));

  function alternarFormulario() {
    if (mostrarForm) {
      limparForm();
      return;
    }

    setMarca('');
    setValor('');
    setKm('');
    setData('');
    setTipo('Dianteiro');
    setErros(errosIniciais);
    setTentouEnviar(false);
    setMotoSelecionada(motoAtiva || null);
    setMostrarForm(true);
  }
// pega do db as trocas de pneus relacionadas a moto ativa ou a moto selecionada
  async function carregarPneus() {
    const dados = await carregarDados('pneus', motoAtiva?.id || null);
    setPneus(dados);
  }

  // Handlers com validação em tempo real
  function handleMarca(texto) {
    setMarca(texto);
    if (tentouEnviar)
       setErros(prev => ({ ...prev, marca: validarObrigatorio(texto, 'Marca').erro }));
  }
// garante que o valor esteja em formato de moeda
  function handleValor(texto) {
    const f = formatarMoeda(texto);
    setValor(f);
    if (tentouEnviar)
       setErros(prev => ({ ...prev, valor: f ? validarValorMonetario(f).erro : '' }));
  }
// garante que a placa esteja no formato certo 
  function handleKm(texto) {
    const apenasNumeros = texto.replace(/\D/g, '');
    setKm(apenasNumeros);
    if (tentouEnviar) setErros(prev => ({ ...prev, km: validarKm(apenasNumeros) }));
  }
// garante que a data esteja no formato certo 00/00/0000
  function handleData(texto) {
    const m = mascaraDataBR(texto);
    setData(m);
    if (tentouEnviar)
       setErros(prev => ({ ...prev, data: m ? validarDataBR(m).erro : '' }));
  }
// selecao da moto, o usuario pode selecionar uma moto diferente da que esta ativa
  function handleMotoSelecionada(moto) {
    setMotoSelecionada(moto);
    if (tentouEnviar)
       setErros(prev => ({ ...prev, motoId: moto ? '' : 'Selecione a moto' }));
  }
// valida se todos campos obrigatorios foram preenchidos corretamente no formato desejado
  function validarFormulario() {
    const novosErros = {
      marca: validarObrigatorio(marca, 'Marca').erro,
      valor: valor ? validarValorMonetario(valor).erro : '',
      km: validarKm(km),
      data: data.trim() ? validarDataBR(data).erro : '',
      motoId: motoSelecionada ? '' : 'Selecione a moto',
    };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
// funcao para adicionar a troca de pneu, salva no db e apresenta mensagem de sucesso, caso haja erros de validacao apresenta as mensagens correspondentes
  async function adicionarPneu() {
    setTentouEnviar(true);
    if (!validarFormulario()) {
      Alert.alert('Campos invalidos', 'Corrija os erros antes de salvar.');
      return;
    }
   // formata o valor para numero e prepara os dados para salvar no db, incluindo a moto relacionada a troca de pneu, caso haja mais de uma moto cadastrada
    const valorNumerico = parseMoeda(valor);
    const motoId = motoSelecionada?.id || motoAtiva?.id || null;
   // cria um novo objeto de pneu com os dados inseridos e os relaciona a moto selecionada, caso haja mais de uma moto cadastrada, e salva no db, apresentando mensagem de sucesso e limpando o formulario para uma nova troca de pneu ser registrada
    const novoPneu = {
      id: Date.now().toString(),
      tipo,
      marca: marca.trim(),
      valor: String(valorNumerico),
      valorFormatado: valor || 'R$ 0,00',
      km: km || '0',
      data: data || new Date().toLocaleDateString('pt-BR'),
      descricao: `${tipo} - ${marca.trim()}`,
      motoId,
      motoLabel: motoSelecionada
        ? `${motoSelecionada.modelo || motoSelecionada.nome} - ${motoSelecionada.placa || ''}`
        : '',
    };
    // atualiza a lista de pneus com a nova troca, salva no db e apresenta mensagem de sucesso, limpando o formulario para uma nova troca de pneu ser registrada
    const novaLista = [...pneus, novoPneu];
    setPneus(novaLista);
    await salvarDados('pneus', novaLista, motoId);
    Vibration.vibrate(200);
    Alert.alert('Sucesso', 'Troca de pneu registrada!');
    limparForm();
  }
 // funcao para remover a troca de pneu, apresenta alerta de confirmacao e caso confirmado remove do db e da lista, apresentando vibracao quando concluido
  async function removerPneu(id) {
    Alert.alert('Confirmar', 'Deseja remover este registro de pneu?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          const novaLista = pneus.filter(item => item.id !== id);
          setPneus(novaLista);
          await salvarDados('pneus', novaLista, motoAtiva?.id || null);
          Vibration.vibrate(300);
        }
      },
    ]);
  }
// limpa os campos para preencher do zero
  function limparForm() {
    setMarca(''); setValor(''); setKm(''); setData(''); setTipo('Dianteiro');
    setErros(errosIniciais); setTentouEnviar(false); setMostrarForm(false);
  }
 // arrega as trocas de pneus do db e seleciona a moto ativa do usuario para ja mostrar as trocas relacionadas
  function renderizarItem({ item }) {
    return (
      <ItemCard
        sigla="Pn"
        titulo={`${item.tipo} - ${item.marca}`}
        subtitulo={`${item.data} · ${item.km} km${item.motoLabel ? '\n' + item.motoLabel : ''}`}
        valor={item.valorFormatado || `R$ ${parseFloat(item.valor || 0).toFixed(2).replace('.', ',')}`}
        onRemover={() => removerPneu(item.id)}
      />
    );
  }
 // inclui o botao para adicionar troca de pneu, formulario para registrar uma nova troca de pneu e a lista de trocas de pneus registradas, com tratamento para quando a lista estiver vazia
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={es.container}>
        <TouchableOpacity style={es.botaoAdicionar} onPress={alternarFormulario}>
          <Text style={es.textoBotaoAdicionar}>{mostrarForm ? 'Fechar Formulario' : '+ Registrar Troca de Pneu'}</Text>
        </TouchableOpacity>
        {/* mostra o formulario para registrar a troca de pneu quando o botao for pressionado, com campos para tipo do pneu, marca/modelo, valor gasto, quilometragem na troca, data da troca e a moto relacionada a troca, caso tenha mais de uma cadastrada */}
        {mostrarForm && (
          <ScrollView style={es.formulario} keyboardShouldPersistTaps="handled">
            <Text style={es.tituloForm}>Nova Troca de Pneu</Text>

            {/* Moto */}
            <Text style={es.label}>Moto <Text style={{ color: '#111' }}>*</Text></Text>
            <MotoSelect
              motoSelecionadaId={motoSelecionada?.id}
              onSelecionar={handleMotoSelecionada}
              erro={erros.motoId}
              obrigatorio
            />

            {/* Tipo de pneu */}
            <Text style={es.label}>Tipo de Pneu <Text style={{ color: '#111' }}>*</Text></Text>
            <View style={es.seletorContainer}>
              {TIPOS_PNEU.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[es.seletorBotao, tipo === t && es.seletorAtivo]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[es.seletorTexto, tipo === t && es.seletorTextoAtivo]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Marca */}
            <ValidatedInput
              label="Marca / Modelo"
              obrigatorio
              placeholder="Ex: Pirelli Scorpion, Michelin Pilot..."
              value={marca}
              onChangeText={handleMarca}
              erro={erros.marca}
              autoCapitalize="words"
            />

            {/* Valor */}
            <ValidatedInput
              label="Valor (R$)"
              placeholder="Ex: R$ 350,00"
              value={valor}
              onChangeText={handleValor}
              keyboardType="numeric"
              erro={erros.valor}
            />

            {/* Quilometragem */}
            <ValidatedInput
              label="Quilometragem na troca"
              placeholder="Ex: 15000"
              value={km}
              onChangeText={handleKm}
              keyboardType="numeric"
              maxLength={6}
              erro={erros.km}
            />

            {/* Data */}
            <ValidatedInput
              label="Data da troca"
              placeholder="DD/MM/AAAA"
              value={data}
              onChangeText={handleData}
              keyboardType="numeric"
              maxLength={10}
              erro={erros.data}
            />

            {/* Preview do registro */}
            {marca.trim() !== '' && (
              <View style={es.preview}>
                <Text style={es.previewTitulo}>Preview do registro</Text>
                <Text style={es.previewTexto}>Tipo: {tipo}</Text>
                <Text style={es.previewTexto}>Marca: {marca}</Text>
                {valor ? <Text style={es.previewTexto}>Valor: {valor}</Text> : null}
                {km ? <Text style={es.previewTexto}>KM: {km}</Text> : null}
                {data ? <Text style={es.previewTexto}>Data: {data}</Text> : null}
              </View>
            )}

            <TouchableOpacity style={es.botaoSalvar} onPress={adicionarPneu}>
              <Text style={es.textoBotaoSalvar}>Salvar Troca</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        )}

        <Text style={es.tituloLista}>Historico de Trocas ({pneus.length})</Text>
        <FlatList
          data={pneus}
          keyExtractor={item => item.id}
          renderItem={renderizarItem}
          ListEmptyComponent={
            <View style={es.vazio}>
              <Text style={es.vazioTexto}>Nenhuma troca de pneu registrada.</Text>
              <Text style={es.vazioTexto}>Adicione sua primeira troca!</Text>
            </View>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  botaoAdicionar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  formulario: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 540, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloForm: { color: '#111111', fontWeight: '700', fontSize: 16, marginBottom: 8 },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  seletorContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  seletorBotao: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  seletorAtivo: { backgroundColor: '#111111', borderColor: '#111111' },
  seletorTexto: { color: '#888888', fontSize: 13 },
  seletorTextoAtivo: { color: '#FFFFFF', fontWeight: '700' },
  preview: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  previewTitulo: { color: '#888888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  previewTexto: { color: '#111111', fontSize: 13, marginBottom: 3 },
  botaoSalvar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },
  textoBotaoSalvar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  tituloLista: { color: '#111111', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#888888', fontSize: 14, textAlign: 'center' },
});
