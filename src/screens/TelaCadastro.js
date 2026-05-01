// tela de cadastro de novo usuario
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { cadastrarUsuario } from '../services/authService';
import Campo from '../components/Campo';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import { CORES, ESPACAMENTO, FONTE } from '../utils/tema';

const TelaCadastro = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // valida e realiza o cadastro do novo usuario
  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas nao coincidem.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      await cadastrarUsuario(nome.trim(), email.trim(), senha);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Nao foi possivel criar a conta. Verifique o email.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Cabecalho
        titulo="Criar Conta"
        aoVoltar={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={estilos.descricao}>
          Crie sua conta para comecar a gerenciar suas motocicletas.
        </Text>

        <Campo label="Nome completo" valor={nome} aoMudar={setNome} placeholder="Seu nome" obrigatorio />
        <Campo label="Email" valor={email} aoMudar={setEmail} placeholder="seu@email.com" tipo="email-address" autoCapitalize="none" obrigatorio />
        <Campo label="Senha" valor={senha} aoMudar={setSenha} placeholder="Minimo 6 caracteres" secureTextEntry obrigatorio />
        <Campo label="Confirmar senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} placeholder="Repita a senha" secureTextEntry obrigatorio />

        <Botao titulo="Criar conta" onPress={handleCadastro} carregando={carregando} estilo={estilos.botao} />
        <Botao titulo="Ja tenho conta" onPress={() => navigation.goBack()} variante="fantasma" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const estilos = StyleSheet.create({
  flex: { flex: 1, backgroundColor: CORES.branco },
  scroll: { padding: ESPACAMENTO.lg },
  descricao: {
    fontSize: FONTE.md,
    color: CORES.cinzaTexto,
    marginBottom: ESPACAMENTO.lg,
    lineHeight: 22,
  },
  botao: { marginTop: ESPACAMENTO.sm, marginBottom: ESPACAMENTO.sm },
});

export default TelaCadastro;
