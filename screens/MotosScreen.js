// screens/MotosScreen.js
// tela de gerenciamento de motos do usuario
// permite cadastrar placa, modelo, ano e foto da galeria

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Vibration,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { salvarItem, carregarItens, deletarItem } from '../services/storage';
import colors from '../services/colors';

export default function MotosScreen({ usuario }) {
  // lista de motos do usuario carregadas do firebase
  const [motos, setMotos] = useState([]);

  // campos do formulario de cadastro de moto
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState('');
  const [fotoUri, setFotoUri] = useState(null);

  // controles de estado da ui
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // carrega as motos do usuario ao abrir a tela
  useEffect(() => {
    carregarMotos();
  }, []);

  // busca as motos do firebase filtrando pelo uid do usuario logado
  async function carregarMotos() {
    setCarregando(true);
    const dados = await carregarItens('motos', usuario.uid);
    setMotos(dados);
    setCarregando(false);
  }

  // abre a galeria do dispositivo para escolher uma foto
  async function selecionarFoto() {
    // solicita permissao para acessar a galeria
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        'Permissao negada',
        'Permita o acesso a galeria nas configuracoes do dispositivo.'
      );
      return;
    }

    // abre o seletor de imagem da galeria
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    // salva o uri da imagem selecionada no estado
    if (!resultado.canceled) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  // valida e salva uma nova moto no firebase
  async function adicionarMoto() {
    if (!modelo.trim() || !placa.trim() || !ano.trim()) {
      Alert.alert('Atencao', 'Preencha modelo, placa e ano.');
      return;
    }
    if (ano.length !== 4 || isNaN(ano)) {
      Alert.alert('Atencao', 'Informe um ano valido com 4 digitos.');
      return;
    }

    setSalvando(true);

    // monta o objeto da moto com todos os campos
    const novaMoto = {
      modelo: modelo.trim(),
      placa: placa.trim().toUpperCase(),
      ano: ano.trim(),
      // salva o uri local da foto (string) ou string vazia se sem foto
      foto: fotoUri || '',
    };

    // envia para o firebase vinculado ao uid do usuario
    const id = await salvarItem('motos', novaMoto, usuario.uid);

    if (id) {
      setMotos([{ id, ...novaMoto, criadoEm: Date.now() }, ...motos]);
      Vibration.vibrate(100);
      Alert.alert('Sucesso', 'Moto cadastrada com sucesso!');
      // limpa o formulario apos salvar
      setModelo('');
      setPlaca('');
      setAno('');
      setFotoUri(null);
      setMostrarForm(false);
    } else {
      Alert.alert('Erro', 'Nao foi possivel salvar. Verifique a conexao.');
    }

    setSalvando(false);
  }

  // confirma e remove a moto do firebase
  async function excluirMoto(id) {
    Alert.alert('Excluir moto', 'Deseja remover esta moto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deletarItem('motos', id);
          setMotos(motos.filter((m) => m.id !== id));
          Vibration.vibrate([0, 50, 50, 50]);
        },
      },
    ]);
  }

  // renderiza cada card de moto na flatlist
  function renderMoto({ item }) {
    return (
      <View style={styles.card}>
        {/* foto da moto se existir, ou placeholder */}
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.fotoMoto} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <Text style={styles.fotoPlaceholderTexto}>Sem foto</Text>
          </View>
        )}

        {/* informacoes da moto */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardModelo}>{item.modelo}</Text>
          <Text style={styles.cardDetalhe}>Placa: {item.placa}</Text>
          <Text style={styles.cardDetalhe}>Ano: {item.ano}</Text>
        </View>

        {/* botao de excluir */}
        <TouchableOpacity
          style={styles.btnExcluir}
          onPress={() => excluirMoto(item.id)}
        >
          <Text style={styles.btnExcluirTexto}>Excluir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* barra superior com contador e botao de adicionar */}
      <View style={styles.topBar}>
        <Text style={styles.contador}>{motos.length} moto(s) cadastrada(s)</Text>
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={() => setMostrarForm(!mostrarForm)}
        >
          <Text style={styles.botaoAdicionarTexto}>
            {mostrarForm ? 'Fechar' : 'Adicionar moto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* formulario de cadastro de nova moto */}
      {mostrarForm && (
        <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.formTitulo}>Nova moto</Text>

            <Text style={styles.label}>Modelo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Honda CB 300"
              placeholderTextColor={colors.placeholder}
              value={modelo}
              onChangeText={setModelo}
            />

            <Text style={styles.label}>Placa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: ABC1D23"
              placeholderTextColor={colors.placeholder}
              value={placa}
              onChangeText={setPlaca}
              autoCapitalize="characters"
              maxLength={8}
            />

            <Text style={styles.label}>Ano</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2022"
              placeholderTextColor={colors.placeholder}
              value={ano}
              onChangeText={setAno}
              keyboardType="numeric"
              maxLength={4}
            />

            {/* botao para selecionar foto da galeria */}
            <Text style={styles.label}>Foto da moto</Text>
            <TouchableOpacity style={styles.botaoFoto} onPress={selecionarFoto}>
              <Text style={styles.botaoFotoTexto}>
                {fotoUri ? 'Trocar foto' : 'Selecionar da galeria'}
              </Text>
            </TouchableOpacity>

            {/* preview da foto selecionada */}
            {fotoUri && (
              <Image source={{ uri: fotoUri }} style={styles.preview} />
            )}

            {/* botao de salvar */}
            <TouchableOpacity
              style={[styles.botaoSalvar, salvando && styles.botaoDesativado]}
              onPress={adicionarMoto}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={styles.botaoSalvarTexto}>Salvar moto</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* lista de motos cadastradas */}
      {!mostrarForm && (
        carregando ? (
          <ActivityIndicator
            color={colors.text}
            size="large"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={motos}
            keyExtractor={(item) => item.id}
            renderItem={renderMoto}
            ListEmptyComponent={
              <View style={styles.vazio}>
                <Text style={styles.vazioTitulo}>Nenhuma moto cadastrada</Text>
                <Text style={styles.vazioSub}>
                  Toque em Adicionar moto para comecar.
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contador: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  botaoAdicionar: {
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  botaoAdicionarTexto: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  formScroll: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formTitulo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 14,
    fontSize: 15,
    marginBottom: 18,
  },
  botaoFoto: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  botaoFotoTexto: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 18,
    resizeMode: 'cover',
  },
  botaoSalvar: {
    backgroundColor: colors.button,
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 30,
  },
  botaoDesativado: {
    opacity: 0.5,
  },
  botaoSalvarTexto: {
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fotoMoto: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  fotoPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fotoPlaceholderTexto: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cardInfo: {
    padding: 14,
  },
  cardModelo: {
    color: colors.text,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDetalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  btnExcluir: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  btnExcluirTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  vazio: {
    alignItems: 'center',
    padding: 48,
  },
  vazioTitulo: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  vazioSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
