// screens/LoginScreen.js
// tela de login com email e senha
// usa firebase authentication para autenticar o usuario

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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import colors from '../services/colors';

export default function LoginScreen({ navigation }) {
  // campos do formulario de login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // controla o spinner de carregamento durante a autenticacao
  const [carregando, setCarregando] = useState(false);

  // realiza o login com email e senha no firebase auth
  async function fazerLogin() {
    // validacao basica dos campos
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha o email e a senha.');
      return;
    }

    setCarregando(true);

    try {
      // chama o firebase para autenticar o usuario
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // o onAuthStateChanged no App.js detecta o login automaticamente
    } catch (erro) {
      // trata os erros mais comuns do firebase auth
      let mensagem = 'Nao foi possivel fazer login.';
      if (
        erro.code === 'auth/user-not-found' ||
        erro.code === 'auth/wrong-password' ||
        erro.code === 'auth/invalid-credential'
      ) {
        mensagem = 'Email ou senha incorretos.';
      } else if (erro.code === 'auth/invalid-email') {
        mensagem = 'Email invalido.';
      } else if (erro.code === 'auth/too-many-requests') {
        mensagem = 'Muitas tentativas. Tente novamente mais tarde.';
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

        {/* titulo do app */}
        <View style={styles.topo}>
          <Text style={styles.titulo}>MOTO CONTROLR</Text>
          <Text style={styles.subtitulo}>Gerencie suas motocicletas</Text>
        </View>

        {/* formulario de login */}
        <View style={styles.formulario}>
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
            placeholder="Sua senha"
            placeholderTextColor={colors.placeholder}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          {/* botao principal de entrar */}
          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesativado]}
            onPress={fazerLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* link para tela de cadastro */}
          <TouchableOpacity
            style={styles.linkCadastro}
            onPress={() => navigation.navigate('Cadastro')}
          >
            <Text style={styles.linkTexto}>Nao tem conta? Criar conta</Text>
          </TouchableOpacity>
        </View>

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
    justifyContent: 'center',
    padding: 24,
  },
  topo: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titulo: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  formulario: {
    width: '100%',
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
  linkCadastro: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  linkTexto: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
