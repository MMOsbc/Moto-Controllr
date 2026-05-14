// screens/GastosScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Vibration, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { salvarDados, carregarDados } from '../services/storage';
import ItemCard from '../components/ItemCard';
import MotoSelect from '../components/MotoSelect';
import ValidatedInput from '../components/ValidatedInput';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { validarObrigatorio, validarValorMonetario, validarDataBR, mascaraDataBR, formatarMoeda, parseMoeda } from '../utils/validators';
// categorias de gastos para o usuario selecionar  na pagina de gastos genericos
const CATEGORIAS = ['Peca', 'Servico', 'Acessorio', 'Multa', 'Seguro', 'Outro'];
const errosIniciais = { descricao: '', valor: '', data: '', motoId: '' };
// tela para registrar gastos genericos relacionados a moto, como compra de pecas, multas, seguro, etc
export default function GastosScreen() {
  const { motoAtiva } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Peca'); const [data, setData] = useState('');
  const [motoSelecionada, setMotoSelecionada] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [totalGastos, setTotalGastos] = useState(0);
  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
// carrega os gastos do db e seleciona a moto ativa do usuario para ja mostrar os gastos relacionados a ela, caso queira registrar um gasto para outra moto pode selecionar no formulario
  useFocusEffect(useCallback(() => { carregarGastos(); if (motoAtiva && !motoSelecionada) setMotoSelecionada(motoAtiva); }, [motoAtiva]));
  useEffect(() => { const soma = gastos.reduce((acc, item) => acc + parseMoeda(item.valor), 0); setTotalGastos(soma); }, [gastos]);
// pega do db os gastos relacionados a moto selecionada ou moto ativa
  async function carregarGastos() { const dados = await carregarDados('gastos', motoAtiva?.id || null); setGastos(dados); }
// funcao para adicionar um gasto, valida os campos obrigatorios e o formato dos dados, salva no db e apresenta mensagem de sucesso
  
function handleValor(texto) { 
    const f = formatarMoeda(texto); 
    setValor(f); 
    if (tentouEnviar) 
      setErros(prev => ({ ...prev, valor: validarValorMonetario(f).erro })); 
    }
// validacao de data no formato brasileiro e aplicacao da mascara para facilitar a digitacao
  function handleData(texto) {
     const m = mascaraDataBR(texto); setData(m);
     if (tentouEnviar)
       setErros(prev => ({ ...prev, data: m ? validarDataBR(m).erro : '' }));
       }
// validacao de descricao para garantir que o campo nao fique vazio
  function handleDescricao(texto) {
    setDescricao(texto);
    if (tentouEnviar)
       setErros(prev => ({ ...prev, descricao: validarObrigatorio(texto, 'Descricao').erro }));
       }
// funcao para selecionar a moto relacionada ao gasto, caso o usuario queira registrar um gasto para uma moto diferente da ativa
  function handleMotoSelecionada(moto) {
     setMotoSelecionada(moto);
     if (tentouEnviar)
       setErros(prev => ({ ...prev, motoId: moto ? '' : 'Selecione a moto' }));
     }
// funcao para validar o formulario, garante que os campos obrigatorios estejam preenchidos e no formato correto antes de permitir o registro do gasto
  function validarFormulario() {
    const novosErros = { descricao: validarObrigatorio(descricao, 'Descricao').erro, valor: validarValorMonetario(valor).erro, data: data.trim() ? validarDataBR(data).erro : '', motoId: motoSelecionada ? '' : 'Selecione a moto' };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
// funcao para adicionar o gasto, salva no db e apresenta mensagem de sucesso, caso haja erros de validacao apresenta as mensagens correspondentes
  async function adicionarGasto() {
    setTentouEnviar(true);
    if (!validarFormulario()) return;
    const valorNumerico = parseMoeda(valor);
    const motoId = motoSelecionada?.id || motoAtiva?.id || null;
    const novoGasto = { id: Date.now().toString(), descricao: descricao.trim(), valor: String(valorNumerico), valorFormatado: valor, categoria, data: data || new Date().toLocaleDateString('pt-BR'), motoId, motoLabel: motoSelecionada ? `${motoSelecionada.modelo || motoSelecionada.nome} - ${motoSelecionada.placa || ''}` : '' };
    const novaLista = [...gastos, novoGasto];
    setGastos(novaLista);
    await salvarDados('gastos', novaLista, motoId);
    Vibration.vibrate(200);
    Alert.alert('Sucesso', 'Gasto registrado!');
    limparForm();
  }
// funcao para remover um gasto, apresenta alerta de confirmacao antes de excluir, e vibra o celular quando o gasto for removido
  async function removerGasto(id) {
    Alert.alert('Confirmar', 'Deseja remover este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const novaLista = gastos.filter(item => item.id !== id); setGastos(novaLista); await salvarDados('gastos', novaLista, motoAtiva?.id || null); Vibration.vibrate(300); } },
    ]);
  }
// funcao para limpar o formulario apos adicionar um gasto ou quando o usuario clicar para abrir o formulario, reseta os campos, erros e a tentativa de envio para o estado inicial
  function limparForm() {
    setDescricao('');
    setValor('');
    setData('');
    setCategoria('Peca'); 
    setMostrarForm(false); 
    setErros(errosIniciais); 
    setTentouEnviar(false); 
  }
// funcao para renderizar cada item da lista de gastos, utiliza o componente ItemCard para exibir as informacoes do gasto e a opcao de remover
  function renderizarItem({ item }) {
    return (<ItemCard sigla="G" titulo={item.descricao} subtitulo={`${item.categoria} · ${item.data}${item.motoLabel ? '\n' + item.motoLabel : ''}`} valor={item.valorFormatado || `R$ ${parseFloat(item.valor).toFixed(2).replace('.', ',')}`} onRemover={() => removerGasto(item.id)} />);
  }
// inclui o total gasto, botao para adicionar gasto, formulario para registrar um novo gasto e a lista de gastos registrados, com tratamento para quando a lista estiver vazia
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={es.container}>
        <View style={es.cardTotal}>
          <Text style={es.labelTotal}>TOTAL DE GASTOS</Text>
          <Text style={es.valorTotal}>{formatarMoeda(String(Math.round(totalGastos * 100)))}</Text>
        </View>

        <TouchableOpacity style={es.botaoAdicionar} onPress={() => { limparForm(); setMostrarForm(!mostrarForm); }}>
          <Text style={es.textoBotaoAdicionar}>{mostrarForm ? 'Fechar Formulario' : '+ Adicionar Gasto'}</Text>
        </TouchableOpacity>

        {mostrarForm && (
          <ScrollView style={es.formulario} keyboardShouldPersistTaps="handled">
            <Text style={es.tituloForm}>Novo Gasto</Text>
            <Text style={es.label}>Moto <Text style={{ color: '#111' }}>*</Text></Text>
            <MotoSelect motoSelecionadaId={motoSelecionada?.id} onSelecionar={handleMotoSelecionada} erro={erros.motoId} obrigatorio />

            <Text style={es.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={es.categorias}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity key={cat} style={[es.categoriaBotao, categoria === cat && es.categoriaAtiva]} onPress={() => setCategoria(cat)}>
                  <Text style={[es.categoriaTexto, categoria === cat && es.categoriaTextoAtivo]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ValidatedInput label="Descricao" obrigatorio placeholder="Ex: Pastilha de freio..." value={descricao} onChangeText={handleDescricao} erro={erros.descricao} />
            <ValidatedInput label="Valor (R$)" obrigatorio placeholder="Ex: R$ 89,90" value={valor} onChangeText={handleValor} keyboardType="numeric" erro={erros.valor} />
            <ValidatedInput label="Data" placeholder="DD/MM/AAAA" value={data} onChangeText={handleData} keyboardType="numeric" maxLength={10} erro={erros.data} />
            <TouchableOpacity style={es.botaoSalvar} onPress={adicionarGasto}><Text style={es.textoBotaoSalvar}>Salvar</Text></TouchableOpacity>
          </ScrollView>
        )}

        <Text style={es.tituloLista}>Gastos ({gastos.length})</Text>
        <FlatList data={gastos} keyExtractor={item => item.id} renderItem={renderizarItem}
          ListEmptyComponent={<View style={es.vazio}><Text style={es.vazioTexto}>Nenhum gasto registrado.</Text></View>}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  cardTotal: { backgroundColor: '#111111', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  labelTotal: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', opacity: 0.6, letterSpacing: 1.5 },
  valorTotal: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  botaoAdicionar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  formulario: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 480, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloForm: { color: '#111111', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  categorias: { marginTop: 4, marginBottom: 4 },
  categoriaBotao: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  categoriaAtiva: { backgroundColor: '#111111', borderColor: '#111111' },
  categoriaTexto: { color: '#888888', fontSize: 13 },
  categoriaTextoAtivo: { color: '#FFFFFF', fontWeight: '700' },
  botaoSalvar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  textoBotaoSalvar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  tituloLista: { color: '#111111', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#888888', fontSize: 14 },
});
