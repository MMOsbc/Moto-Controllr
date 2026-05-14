// screens/ManutencaoScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Vibration, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { salvarDados, carregarDados } from '../services/storage';
import ItemCard from '../components/ItemCard';
import MotoSelect from '../components/MotoSelect';
import ValidatedInput from '../components/ValidatedInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { validarObrigatorio, validarValorMonetario, validarDataBR, mascaraDataBR, formatarMoeda, parseMoeda } from '../utils/validators';
// tela para registrar manutencoes realizadas na moto, como troca de oleo, revisao, troca de pecas, etc, o usuario pode selecionar a moto relacionada a manutencao caso tenha mais de uma cadastrada
const errosIniciais = { descricao: '', valor: '', data: '', motoId: '' };
// variaveis para armazenar os dados de manutencao
export default function ManutencaoScreen() {
  const { motoAtiva } = useAuth();
  const [manutencoes, setManutencoes] = useState([]);
  const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState('');
  const [data, setData] = useState(''); const [km, setKm] = useState('');
  const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
// carrega as manutencoes do db e seleciona a moto ativa do usuario para ja mostrar as manutencoes relacionadas a ela, caso queira registrar uma manutencao para outra moto pode selecionar no formulario
  useFocusEffect(useCallback(() => { carregarManutencoes(); if (motoAtiva && !motoSelecionada) setMotoSelecionada(motoAtiva); }, [motoAtiva]));
// pega do db as manutencoes relacionadas a moto ativa ou a moto selecionada
  async function carregarManutencoes() { const dados = await carregarDados('manutencoes', motoAtiva?.id || null); setManutencoes(dados); }
// funcao para adicionar a manutencao, salva no db e apresenta mensagem de sucesso, caso haja erros de validacao apresenta as mensagens correspondentes 
  function handleValor(texto) {
     const f = formatarMoeda(texto);
     setValor(f);
     if (tentouEnviar)
       setErros(prev => ({ ...prev, valor: f ? validarValorMonetario(f).erro : '' }));
       }

// garante que a data esteja no formato certo 00/00/0000
  function handleData(texto) {
     const m = mascaraDataBR(texto);
     setData(m);
     if (tentouEnviar)
       setErros(prev => ({ ...prev, data: m ? validarDataBR(m).erro : '' }));
       }
// valida descricao 
  function handleDescricao(texto) {
     setDescricao(texto);
      if (tentouEnviar)
         setErros(prev => ({ ...prev, descricao: validarObrigatorio(texto, 'Descricao').erro }));
         }
// selecao da moto, o usuario pode selecionar uma moto diferente da que esta ativa
  function handleMotoSelecionada(moto) {
     setMotoSelecionada(moto);
     if (tentouEnviar)
       setErros(prev => ({ ...prev, motoId: moto ? '' : 'Selecione a moto' }));
       }
// valida se todos campos obrigatorios foram preenchidos corretamente no formato desejado
  function validarFormulario() {
    const novosErros = { descricao: validarObrigatorio(descricao, 'Descricao').erro, valor: valor ? validarValorMonetario(valor).erro : '', data: data.trim() ? validarDataBR(data).erro : '', motoId: motoSelecionada ? '' : 'Selecione a moto' };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
// funcao para adicionar a manutencao, salva no db e apresenta mensagem de sucesso, caso haja erros de validacao apresenta as mensagens correspondentes
  async function adicionarManutencao() {
    setTentouEnviar(true);
    if (!validarFormulario()) return;
    const motoId = motoSelecionada?.id || motoAtiva?.id || null;
    const novaManutencao = { id: Date.now().toString(), descricao: descricao.trim(), valor: String(parseMoeda(valor)), valorFormatado: valor || 'R$ 0,00', data: data || new Date().toLocaleDateString('pt-BR'), km: km || '0', motoId, motoLabel: motoSelecionada ? `${motoSelecionada.modelo || motoSelecionada.nome} - ${motoSelecionada.placa || ''}` : '' };
    const novaLista = [...manutencoes, novaManutencao];
    setManutencoes(novaLista);
    await salvarDados('manutencoes', novaLista, motoId);
    Vibration.vibrate(200);
    Alert.alert('Sucesso', 'Manutencao registrada!');
    limparForm();
  }
// funcao para remover uma manutencao, apresenta alerta de confirmacao antes de excluir, e vibra o celular quando a manutencao for removida
  async function removerManutencao(id) {
    Alert.alert('Confirmar', 'Deseja remover esta manutencao?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const novaLista = manutencoes.filter(item => item.id !== id); setManutencoes(novaLista); await salvarDados('manutencoes', novaLista, motoAtiva?.id || null); Vibration.vibrate(300); } },
    ]);
  }
// funcao para limpar o formulario apos adicionar uma manutencao ou quando clicar para abrir o formulario, reseta os campos e os erros para os valores iniciais
  function limparForm() {
     setDescricao('');
     setValor('');
     setData('');
     setKm('');
     setMostrarForm(false);
     setErros(errosIniciais);
     setTentouEnviar(false);
     }
// funcao para renderizar cada item da lista de manutencoes, utilizando o componente ItemCard e passando as informacoes formatadas, como descricao, data, km e moto relacionada, e a funcao de remover a manutencao ao clicar no botao de excluir
  function renderizarItem({ item }) {
    return (
      <ItemCard
        sigla="Mt"
        titulo={item.descricao}
        subtitulo={`${item.data} · ${item.km} km${item.motoLabel ? '\n' + item.motoLabel : ''}`}
        valor={item.valorFormatado || `R$ ${parseFloat(item.valor).toFixed(2).replace('.', ',')}`}
        onRemover={() => removerManutencao(item.id)}
      />
    );
  }
// inclui o botao para adicionar manutencao, formulario para registrar uma nova manutencao e a lista de manutencoes registradas, com tratamento para quando a lista estiver vazia
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={es.container}>
        <TouchableOpacity style={es.botaoAdicionar} onPress={() => { limparForm(); setMostrarForm(!mostrarForm); }}>
          <Text style={es.textoBotaoAdicionar}>{mostrarForm ? 'Fechar Formulario' : '+ Adicionar Manutencao'}</Text>
        </TouchableOpacity>

        {mostrarForm && (
          <ScrollView style={es.formulario} keyboardShouldPersistTaps="handled">
            <Text style={es.tituloForm}>Nova Manutencao</Text>
            <Text style={es.label}>Moto <Text style={{ color: '#111' }}>*</Text></Text>
            <MotoSelect motoSelecionadaId={motoSelecionada?.id} onSelecionar={handleMotoSelecionada} erro={erros.motoId} obrigatorio />
            <ValidatedInput label="Descricao" obrigatorio placeholder="Ex: Troca de oleo, revisao..." value={descricao} onChangeText={handleDescricao} erro={erros.descricao} />
            <ValidatedInput label="Valor (R$)" placeholder="Ex: R$ 150,00" value={valor} onChangeText={handleValor} keyboardType="numeric" erro={erros.valor} />
            <ValidatedInput label="Data" placeholder="DD/MM/AAAA" value={data} onChangeText={handleData} keyboardType="numeric" maxLength={10} erro={erros.data} />
            <ValidatedInput label="Quilometragem" placeholder="Ex: 15000" value={km} onChangeText={setKm} keyboardType="numeric" />
            <TouchableOpacity style={es.botaoSalvar} onPress={adicionarManutencao}><Text style={es.textoBotaoSalvar}>Salvar</Text></TouchableOpacity>
          </ScrollView>
        )}

        <Text style={es.tituloLista}>Registros ({manutencoes.length})</Text>
        <FlatList data={manutencoes} keyExtractor={item => item.id} renderItem={renderizarItem}
          ListEmptyComponent={<View style={es.vazio}><Text style={es.vazioTexto}>Nenhuma manutencao registrada.</Text></View>}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  botaoAdicionar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  formulario: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 480, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloForm: { color: '#111111', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  botaoSalvar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  textoBotaoSalvar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  tituloLista: { color: '#111111', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#888888', fontSize: 14 },
});
