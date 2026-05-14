// screens/MotosScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,
  Vibration, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { listarMotos, adicionarMoto, removerMoto, definirMotoAtiva, obterMotoAtivaId, atualizarMoto } from '../services/motos';
import { useAuth } from '../context/AuthContext';
import ValidatedInput from '../components/ValidatedInput';
import MarcaSelect from '../components/MarcaSelect';
import { validarObrigatorio, validarPlaca, mascaraPlaca } from '../utils/validators';
// variavel para armazenar os erros de validacao dos campos do formulario de cadastro de moto
const errosIniciais = { nome: '', marca: '', modelo: '', placa: '' };
// tela para gerenciar as motos cadastradas pelo usuario, o usuario pode adicionar novas motos, remover motos existentes, selecionar qual moto esta ativa para registrar os gastos e manutencoes relacionados a ela, e atualizar a foto da moto, caso tenha sido incluida no cadastro ou posteriormente
export default function MotosScreen() {
  const { usuario, atualizarMotoAtiva } = useAuth();
  const [motos, setMotos] = useState([]);
  const [motoAtivaId, setMotoAtivaId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [motoEditandoId, setMotoEditandoId] = useState(null);

  // Campos do formulario de descricao da moto
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [fotoUri, setFotoUri] = useState(null); // local da foto selecionada para moto

  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
// carrega as motos do db e seleciona a moto ativa do usuario para ja mostrar as motos relacionadas a ela, caso queira registrar uma manutencao para outra moto pode selecionar no formulario
  useFocusEffect(useCallback(() => { carregarMotos(); }, []));

  async function carregarMotos() {
    if (!usuario) return;
    const lista = await listarMotos(usuario.id);
    setMotos(lista);
    const ativaId = await obterMotoAtivaId(usuario.id);
    setMotoAtivaId(ativaId);
  }

  // ─── Seletor de foto ───────────────────────────────────────────
  async function escolherFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Permita o acesso a galeria para adicionar uma foto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      setFotoUri(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
    }
  }
// tirar a foto na hora para adicionar a foto da moto, caso o usuario queira adicionar uma foto diferente da galeria ou nao tenha uma foto salva no celular, como a foto foi convertida para base64 ela pode ser salva diretamente no db e exibida no app sem precisar de armazenamento local
  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Permita o acesso a camera para tirar uma foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      setFotoUri(`data:image/jpeg;base64,${resultado.assets[0].base64}`);
    }
  }
// apresenta as opcoes para adicionar ou atualizar a foto da moto, permitindo escolher entre tirar uma foto na hora ou selecionar uma foto da galeria, e tambem oferece a opcao de remover a foto caso ja exista uma foto associada a moto
  function abrirOpcoesFoto() {
    Alert.alert('Foto da Moto', 'Como deseja adicionar a foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar Foto', onPress: tirarFoto },
      { text: 'Escolher da Galeria', onPress: escolherFoto },
      fotoUri ? { text: 'Remover Foto', style: 'destructive', onPress: () => setFotoUri(null) } : null,
    ].filter(Boolean));
  }

  // ─── Atualizar foto de moto ja cadastrada ─────────────────────
  async function atualizarFotoMoto(moto) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Permita o acesso a galeria.');
      return;
    }
    Alert.alert('Foto da Moto', `Atualizar foto de "${moto.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Tirar Foto', onPress: async () => {
          const { status: cs } = await ImagePicker.requestCameraPermissionsAsync();
          if (cs !== 'granted') return;
          const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
          if (!r.canceled && r.assets[0]) {
            await salvarFotoMoto(moto, `data:image/jpeg;base64,${r.assets[0].base64}`);
          }
        }
      },
      {
        text: 'Galeria', onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
          if (!r.canceled && r.assets[0]) {
            await salvarFotoMoto(moto, `data:image/jpeg;base64,${r.assets[0].base64}`);
          }
        }
      },
      moto.foto ? { text: 'Remover Foto', style: 'destructive', onPress: () => salvarFotoMoto(moto, null) } : null,
    ].filter(Boolean));
  }

  async function salvarFotoMoto(moto, novaFoto) {
    await atualizarMoto(usuario.id, moto.id, { foto: novaFoto });
    await carregarMotos();
    await atualizarMotoAtiva();
    Vibration.vibrate(100);
  }

  // validar as informacoes passadas da moto 
  function validarCampo(campo, valor) {
    switch (campo) {
      case 'nome': return validarObrigatorio(valor, 'Nome').erro;
      case 'marca': return validarObrigatorio(valor, 'Marca').erro;
      case 'modelo': return validarObrigatorio(valor, 'Modelo').erro;
      case 'placa': return valor.trim() ? validarPlaca(valor).erro : '';
      default: return '';
    }
  }

  function atualizarCampo(campo, valor, setter) {
    setter(valor);
    if (tentouEnviar) setErros(prev => ({ ...prev, [campo]: validarCampo(campo, valor) }));
  }
// atualizar placa da moto por erro ou por mudanca 
  function atualizarPlaca(texto) {
    const formatado = mascaraPlaca(texto);
    setPlaca(formatado);
    if (tentouEnviar) setErros(prev => ({ ...prev, placa: validarCampo('placa', formatado) }));
  }
  function preencherFormularioMoto(moto) {
    setMotoEditandoId(moto.id);
    setMostrarForm(true);
    setNome(moto.nome || '');
    setMarca(moto.marca || '');
    setModelo(moto.modelo || '');
    setAno(moto.ano || '');
    setPlaca(moto.placa || '');
    setCor(moto.cor || '');
    setKmAtual(moto.kmAtual || '');
    setFotoUri(moto.foto || null);
    setErros(errosIniciais);
    setTentouEnviar(false);
  }

  function cancelarEdicao() {
    limparForm();
  }
// validacao das infos enviadas sobre a moto 
  function validarFormulario() {
    const novosErros = {
      nome: validarCampo('nome', nome),
      marca: validarCampo('marca', marca),
      modelo: validarCampo('modelo', modelo),
      placa: validarCampo('placa', placa),
    };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
// funcao para registrar ou atualizar a moto no bd e apresentar status
  async function handleSalvarMoto() {
    setTentouEnviar(true);
    if (!validarFormulario()) return;
    const dadosMoto = { nome, marca, modelo, ano, placa, cor, kmAtual, foto: fotoUri };
    const resultado = motoEditandoId
      ? await atualizarMoto(usuario.id, motoEditandoId, dadosMoto)
      : await adicionarMoto(usuario.id, dadosMoto);

    if (!resultado.sucesso) {
      Alert.alert('Erro', resultado.erro || 'Não foi possível salvar a moto.');
      return;
    }

    Vibration.vibrate(200);
    Alert.alert(
      motoEditandoId ? 'Moto atualizada!' : 'Moto adicionada!',
      motoEditandoId
        ? `"${nome}" foi atualizada com sucesso.`
        : `"${nome}" foi adicionada com sucesso.`
    );
    limparForm();
    await carregarMotos();
    await atualizarMotoAtiva();
  }
// remocao da moto e acionamento de vibracao quando concluido
  async function handleRemoverMoto(moto) {
    Alert.alert('Remover moto', `Deseja remover "${moto.nome}"?\nTodos os registros serao excluidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          await removerMoto(usuario.id, moto.id);
          Vibration.vibrate(300);
          await carregarMotos();
          await atualizarMotoAtiva();
        }
      },
    ]);
  }
// troca a moto ativa por outra, exemplo sair de moto a e selecionar que a padrao é a b
  async function handleTrocarMoto(motoId) {
    await definirMotoAtiva(usuario.id, motoId);
    setMotoAtivaId(motoId);
    await atualizarMotoAtiva();
    Vibration.vibrate(100);
  }
// reseta campos preenchidos para adicionar outra moto
  function limparForm() {
    setNome(''); setMarca(''); setModelo(''); setAno('');
    setPlaca(''); setCor(''); setKmAtual(''); setFotoUri(null);
    setErros(errosIniciais); setTentouEnviar(false); setMostrarForm(false); setMotoEditandoId(null);
  }

  // ─── Icone da moto (foto ou inicial) ──────────────────────────
  function IconeMoto({ moto, tamanho = 48 }) {
    if (moto.foto) {
      return (
        <Image
          source={{ uri: moto.foto }}
          style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.25, backgroundColor: '#E0E0E0' }}
        />
      );
    }
    return (
      <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.25, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: tamanho * 0.35 }}>
          {(moto.modelo || moto.nome || 'M')[0].toUpperCase()}
        </Text>
      </View>
    );
  }
// apresentar as motos ja cadastradas 
  function renderizarMoto({ item }) {
    const ativa = item.id === motoAtivaId;
    return (
      <View style={[es.cardMoto, ativa && es.cardMotoAtiva]}>
        {/* Icone / foto */}
        <TouchableOpacity onPress={() => atualizarFotoMoto(item)} style={es.fotoContainer}>
          <IconeMoto moto={item} tamanho={52} />
          <View style={es.fotoEditarBadge}>
            <Text style={es.fotoEditarTexto}>+</Text>
          </View>
        </TouchableOpacity>

        {/* Dados */}
        <View style={es.motoDados}>
          <View style={es.motoNomeRow}>
            <Text style={es.motoNome}>{item.nome}</Text>
            {ativa && <View style={es.badgeAtiva}><Text style={es.badgeAtivaTexto}>ATIVA</Text></View>}
          </View>
          {(item.marca || item.modelo) && (
            <Text style={es.motoDetalhe}>{[item.marca, item.modelo].filter(Boolean).join(' · ')}</Text>
          )}
          {(item.ano || item.placa) && (
            <Text style={es.motoDetalhe}>{[item.ano, item.placa].filter(Boolean).join(' · ')}</Text>
          )}
          {item.kmAtual && item.kmAtual !== '0' && (
            <Text style={es.motoDetalhe}>{item.kmAtual} km</Text>
          )}
        </View>

        {/* Botoes */}
        <View style={es.motoBotoes}>
          {!ativa && (
            <TouchableOpacity style={es.botaoSelecionar} onPress={() => handleTrocarMoto(item.id)}>
              <Text style={es.botaoSelecionarTexto}>Usar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={es.botaoEditarMoto} onPress={() => preencherFormularioMoto(item)}>
            <Text style={es.botaoEditarTexto}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={es.botaoRemoverMoto} onPress={() => handleRemoverMoto(item)}>
            <Text style={es.botaoRemoverTexto}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
// inclui o botao para adicionar moto, formulario para registrar uma nova moto e a lista de motos registradas, com tratamento para quando a lista estiver vazia
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={es.container}>
        <TouchableOpacity
          style={es.botaoAdicionar}
          onPress={() => {
            if (mostrarForm && !motoEditandoId) {
              limparForm();
              return;
            }
            limparForm();
            setMostrarForm(!mostrarForm);
          }}
        >
          <Text style={es.textoBotaoAdicionar}>{mostrarForm && !motoEditandoId ? 'Cancelar' : '+ Adicionar Moto'}</Text>
        </TouchableOpacity>

        {mostrarForm && (
          <ScrollView style={es.formulario} keyboardShouldPersistTaps="handled">
            <Text style={es.tituloForm}>{motoEditandoId ? 'Editar Moto' : 'Nova Moto'}</Text>

            {/* Seletor de foto */}
            <View style={es.fotoFormContainer}>
              <TouchableOpacity style={es.fotoFormBotao} onPress={abrirOpcoesFoto}>
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={es.fotoFormPreview} />
                ) : (
                  <View style={es.fotoFormPlaceholder}>
                    <Text style={es.fotoFormIcone}>+</Text>
                    <Text style={es.fotoFormTexto}>Adicionar Foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              {fotoUri && (
                <TouchableOpacity onPress={() => setFotoUri(null)} style={es.fotoRemover}>
                  <Text style={es.fotoRemoverTexto}>Remover foto</Text>
                </TouchableOpacity>
              )}
            </View>

            <ValidatedInput label="Nome / Apelido" obrigatorio placeholder="Ex: Minha CB 300" value={nome} onChangeText={v => atualizarCampo('nome', v, setNome)} erro={erros.nome} />
            <Text style={es.label}>Marca <Text style={{ color: '#111' }}>*</Text></Text>
            <MarcaSelect marcaSelecionada={marca} onSelecionar={v => atualizarCampo('marca', v, setMarca)} erro={erros.marca} />
            <ValidatedInput label="Modelo" obrigatorio placeholder="Ex: CB 300R, MT-07..." value={modelo} onChangeText={v => atualizarCampo('modelo', v, setModelo)} erro={erros.modelo} />
            <View style={es.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ValidatedInput label="Ano" placeholder="Ex: 2022" value={ano} onChangeText={setAno} keyboardType="numeric" maxLength={4} />
              </View>
              <View style={{ flex: 1 }}>
                <ValidatedInput label="Cor" placeholder="Ex: Preta" value={cor} onChangeText={setCor} />
              </View>
            </View>
            <View style={es.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ValidatedInput label="Placa" placeholder="Ex: ABC1D23" value={placa} onChangeText={atualizarPlaca} autoCapitalize="characters" maxLength={7} erro={erros.placa} />
              </View>
              <View style={{ flex: 1 }}>
                <ValidatedInput label="KM atual" placeholder="Ex: 15000" value={kmAtual} onChangeText={setKmAtual} keyboardType="numeric" />
              </View>
            </View>

            <TouchableOpacity style={es.botaoSalvar} onPress={handleSalvarMoto}>
              <Text style={es.textoBotaoSalvar}>{motoEditandoId ? 'Salvar Alterações' : 'Salvar Moto'}</Text>
            </TouchableOpacity>
            {motoEditandoId && (
              <TouchableOpacity style={es.botaoCancelarEdicao} onPress={cancelarEdicao}>
                <Text style={es.textoBotaoCancelarEdicao}>Cancelar edição</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
        )}

        <Text style={es.tituloLista}>Minhas Motos ({motos.length})</Text>
        <FlatList
          data={motos}
          keyExtractor={item => item.id}
          renderItem={renderizarMoto}
          ListEmptyComponent={
            <View style={es.vazio}>
              <Text style={es.vazioTexto}>Nenhuma moto cadastrada.</Text>
              <Text style={es.vazioTexto}>Adicione sua primeira moto!</Text>
            </View>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  botaoAdicionar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 14 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  formulario: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, marginBottom: 16, maxHeight: 540, borderWidth: 1, borderColor: '#E0E0E0' },
  tituloForm: { color: '#111111', fontWeight: '700', fontSize: 16, marginBottom: 12 },

  // Foto no formulário
  fotoFormContainer: { alignItems: 'center', marginBottom: 16 },
  fotoFormBotao: { width: 100, height: 100, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  fotoFormPreview: { width: 100, height: 100, borderRadius: 20 },
  fotoFormPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  fotoFormIcone: { fontSize: 28, color: '#AAAAAA', fontWeight: '300' },
  fotoFormTexto: { color: '#AAAAAA', fontSize: 11, fontWeight: '500' },
  fotoRemover: { marginTop: 8 },
  fotoRemoverTexto: { color: '#888888', fontSize: 12, textDecorationLine: 'underline' },

  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  inputRow: { flexDirection: 'row' },
  botaoSalvar: { backgroundColor: '#111111', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  textoBotaoSalvar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  tituloLista: { color: '#111111', fontWeight: '700', fontSize: 15, marginBottom: 12 },

  // Card da moto
  cardMoto: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  cardMotoAtiva: { borderColor: '#111111', borderWidth: 2 },

  // Foto na listagem
  fotoContainer: { position: 'relative' },
  fotoEditarBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  fotoEditarTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', lineHeight: 14 },

  motoDados: { flex: 1 },
  motoNomeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  motoNome: { color: '#111111', fontWeight: '700', fontSize: 15 },
  badgeAtiva: { backgroundColor: '#111111', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeAtivaTexto: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  motoDetalhe: { color: '#888888', fontSize: 12, marginTop: 2 },

  motoBotoes: { alignItems: 'flex-end', gap: 8 },
  botaoSelecionar: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#111111' },
  botaoSelecionarTexto: { color: '#111111', fontWeight: '700', fontSize: 12 },
  botaoEditarMoto: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#888888' },
  botaoEditarTexto: { color: '#444444', fontWeight: '700', fontSize: 12 },
  botaoRemoverMoto: { backgroundColor: '#444444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  botaoRemoverTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  botaoCancelarEdicao: { marginTop: 10, alignItems: 'center' },
  textoBotaoCancelarEdicao: { color: '#888888', fontSize: 12, textDecorationLine: 'underline' },

  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#888888', fontSize: 14, textAlign: 'center' },
});
