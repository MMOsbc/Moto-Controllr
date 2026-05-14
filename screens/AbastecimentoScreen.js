// screens/AbastecimentoScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Vibration, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { salvarDados, carregarDados } from '../services/storage';
import ItemCard from '../components/ItemCard';
import MotoSelect from '../components/MotoSelect';
import ValidatedInput from '../components/ValidatedInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { validarObrigatorio, validarValorMonetario, validarDataBR, mascaraDataBR, formatarMoeda, parseMoeda } from '../utils/validators';

const errosIniciais = { litros: '', valorLitro: '', data: '', motoId: '' };

export default function AbastecimentoScreen() {
  // variaveis para armazenar os dados de abastecimento
  const { motoAtiva } = useAuth();
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [litros, setLitros] = useState(''); const [valorLitro, setValorLitro] = useState('');
  const [posto, setPosto] = useState(''); const [km, setKm] = useState('');
  const [data, setData] = useState(''); const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
// caso tenha moto seleciona ja pega do usuario ativo
  useFocusEffect(useCallback(() => { carregarAbastecimentos(); if (motoAtiva && !motoSelecionada) setMotoSelecionada(motoAtiva); }, [motoAtiva]));
// pega do db os abastecimentos 
  async function carregarAbastecimentos() { const dados = await carregarDados('abastecimentos', motoAtiva?.id || null); setAbastecimentos(dados); }
// calcula o valor dos litros selecionados com valor do litro
  function calcularTotal() { 
    const l = parseFloat(litros.replace(',', '.') || 0); const v = parseMoeda(valorLitro); 
    return (l * v).toFixed(2); 
  }
//garante que o input de valor esteja em moeda
  function handleValorLitro(texto) { 
    const f = formatarMoeda(texto); 
    setValorLitro(f); 
    if (tentouEnviar) 
      setErros(prev => ({ ...prev, valorLitro: f ? validarValorMonetario(f).erro : '' })); 
    }
  // garante que a data esteja no formato certo 00/00/0000
  function handleData(texto) { 
    const m = mascaraDataBR(texto); 
    setData(m); 
    if (tentouEnviar) 
      setErros(prev => ({ ...prev, data: m ? validarDataBR(m).erro : '' })); 
    }
// valida os litros inseridos 
  function handleLitros(texto) { 
    const limpo = texto.replace(/[^0-9.,]/g, ''); 
    setLitros(limpo); 
    if (tentouEnviar) setErros(prev => ({ ...prev, litros: validarObrigatorio(limpo, 'Litros').erro })); 
  }
  // selecao da moto, o usuario pode selecionar uma moto diferente da que esta ativa
  function handleMotoSelecionada(moto) { 
    setMotoSelecionada(moto); 
    if (tentouEnviar) setErros(prev => ({ ...prev, motoId: moto ? '' : 'Selecione a moto' })); 
  }
 // valida se todos campos obrigatorios foram preenchidos corretamente no formato desejado 
  function validarFormulario() {
    const novosErros = { litros: validarObrigatorio(litros, 'Litros').erro, valorLitro: valorLitro ? validarValorMonetario(valorLitro).erro : '', data: data.trim() ? validarDataBR(data).erro : '', motoId: motoSelecionada ? '' : 'Selecione a moto' };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
// registra no bd o abastecimento e os dados que foram inserido no formulario, e vibra o celular quando esta salvo e envia mensagem de sucesso
  async function adicionarAbastecimento() {
    setTentouEnviar(true);
    if (!validarFormulario()) return;
    const motoId = motoSelecionada?.id || motoAtiva?.id || null;
    const valorTotal = calcularTotal();
    const novoAbastecimento = { id: Date.now().toString(), litros, valorLitro: parseMoeda(valorLitro).toString(), valorLitroFormatado: valorLitro, valor: valorTotal, valorFormatado: formatarMoeda(String(Math.round(parseFloat(valorTotal) * 100))), posto: posto || 'Nao informado', km: km || '0', data: data || new Date().toLocaleDateString('pt-BR'), descricao: `${litros}L - ${posto || 'Posto'}`, motoId, motoLabel: motoSelecionada ? `${motoSelecionada.modelo || motoSelecionada.nome} - ${motoSelecionada.placa || ''}` : '' };
    const novaLista = [...abastecimentos, novoAbastecimento];
    setAbastecimentos(novaLista);
    await salvarDados('abastecimentos', novaLista, motoId);
    Vibration.vibrate(200);
    Alert.alert('Sucesso', 'Abastecimento registrado!');
    limparForm();
  }
 // funcao de remover do abastecimento, caso entender que foi adicionado errado e queria adicionar depois novamente
  async function removerAbastecimento(id) {
    Alert.alert('Confirmar', 'Deseja remover este abastecimento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const novaLista = abastecimentos.filter(item => item.id !== id); setAbastecimentos(novaLista); await salvarDados('abastecimentos', novaLista, motoAtiva?.id || null); Vibration.vibrate(300); } },
    ]);
  }
// limpa os campos para serem preencidos do zero
  function limparForm() { setLitros(''); setValorLitro(''); setPosto(''); setKm(''); setData(''); setMostrarForm(false); setErros(errosIniciais); setTentouEnviar(false); }

  const totalEstimado = litros && valorLitro ? calcularTotal() : null;
// mostra os abastecimento ja registrados na pag de abastecimento
  function renderizarItem({ item }) {
    return (<ItemCard sigla="Ab" titulo={`${item.litros}L · ${item.posto}`} subtitulo={`${item.data} · ${item.km} km${item.motoLabel ? '\n' + item.motoLabel : ''}`} valor={item.valorFormatado || `R$ ${parseFloat(item.valor).toFixed(2).replace('.', ',')}`} onRemover={() => removerAbastecimento(item.id)} />);
  }
// renderizacao da tela de abastecimento onde da para ele ver o total gasto ir para outras funcoes de editar e incluir abastecimento
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={es.container}>
        {mostrarForm && totalEstimado && parseFloat(totalEstimado) > 0 && (
          <View style={es.previewTotal}><Text style={es.previewTexto}>Total estimado: {formatarMoeda(String(Math.round(parseFloat(totalEstimado) * 100)))}</Text></View>
        )}
        <TouchableOpacity style={es.botaoAdicionar} onPress={() => { limparForm(); setMostrarForm(!mostrarForm); }}>
          <Text style={es.textoBotaoAdicionar}>{mostrarForm ? 'Fechar Formulario' : '+ Registrar Abastecimento'}</Text>
        </TouchableOpacity>

        {mostrarForm && (
          <ScrollView style={es.formulario} keyboardShouldPersistTaps="handled">
            <Text style={es.tituloForm}>Novo Abastecimento</Text>
            <Text style={es.label}>Moto <Text style={{ color: '#111' }}>*</Text></Text>
            <MotoSelect motoSelecionadaId={motoSelecionada?.id} onSelecionar={handleMotoSelecionada} erro={erros.motoId} obrigatorio />
            <ValidatedInput label="Litros" obrigatorio placeholder="Ex: 12,5" value={litros} onChangeText={handleLitros} keyboardType="decimal-pad" erro={erros.litros} />
            <ValidatedInput label="Preco por Litro (R$)" placeholder="Ex: R$ 6,49" value={valorLitro} onChangeText={handleValorLitro} keyboardType="numeric" erro={erros.valorLitro} />
            <ValidatedInput label="Posto" placeholder="Ex: Ipiranga, Shell..." value={posto} onChangeText={setPosto} />
            <ValidatedInput label="Quilometragem" placeholder="Ex: 15000" value={km} onChangeText={setKm} keyboardType="numeric" />
            <ValidatedInput label="Data" placeholder="DD/MM/AAAA" value={data} onChangeText={handleData} keyboardType="numeric" maxLength={10} erro={erros.data} />
            <TouchableOpacity style={es.botaoSalvar} onPress={adicionarAbastecimento}><Text style={es.textoBotaoSalvar}>Salvar</Text></TouchableOpacity>
          </ScrollView>
        )}

        <Text style={es.tituloLista}>Registros ({abastecimentos.length})</Text>
        <FlatList data={abastecimentos} keyExtractor={item => item.id} renderItem={renderizarItem}
          ListEmptyComponent={<View style={es.vazio}><Text style={es.vazioTexto}>Nenhum abastecimento registrado.</Text></View>}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  previewTotal: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  previewTexto: { color: '#111111', fontWeight: '700', fontSize: 14 },
  botaoAdicionar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  formulario: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 500, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloForm: { color: '#111111', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  botaoSalvar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  textoBotaoSalvar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  tituloLista: { color: '#111111', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#888888', fontSize: 14 },
});
