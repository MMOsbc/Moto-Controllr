// screens/CadastroScreen.js
// tela de criacao de nova conta com email e senha
// usa firebase authentication para registrar o usuario

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import colors from '../services/colors';

export default function CadastroScreen({ navigation }) {
  // campos do formulario de cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // cria a conta no firebase authentication
  async function criarConta() {
    // validacoes dos campos antes de enviar ao firebase
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Atencao', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Atencao', 'As senhas nao conferem.');
      return;
    }

    setCarregando(true);

    try {
      // cria o usuario no firebase auth
      const resultado = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );
      // salva o nome no perfil do usuario
      await updateProfile(resultado.user, { displayName: nome.trim() });
      // o onAuthStateChanged no App.js detecta o cadastro automaticamente
    } catch (erro) {console.log('ERRO COMPLETO:', erro);
  Alert.alert('Erro', erro.code + '\n' + erro.message);
      if (erro.code === 'auth/email-already-in-use') {
        mensagem = 'Este email ja esta em uso.';
      } else if (erro.code === 'auth/invalid-email') {
        mensagem = 'Email invalido.';
      } else if (erro.code === 'auth/weak-password') {
        mensagem = 'Senha muito fraca. Use pelo menos 6 caracteres.';
      }
      Alert.alert('Erro', mensagem);
    }

    setCarregando(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.titulo}>Nova conta</Text>
        <Text style={styles.subtitulo}>Preencha os dados para se cadastrar</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor={colors.placeholder}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimo 6 caracteres"
          placeholderTextColor={colors.placeholder}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Repita a senha"
          placeholderTextColor={colors.placeholder}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
        />

        {/* botao de criar conta */}
        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesativado]}
          onPress={criarConta}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={styles.botaoTexto}>Criar conta</Text>
          )}
        </TouchableOpacity>

        {/* volta para o login */}
        <TouchableOpacity
          style={styles.linkVoltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkTexto}>Ja tenho conta. Fazer login</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
  },
  titulo: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 28,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  botao: {
    backgroundColor: colors.button,
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  botaoDesativado: {
    opacity: 0.5,
  },
  botaoTexto: {
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  linkVoltar: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  linkTexto: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
