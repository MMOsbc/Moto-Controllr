// tela de login - autenticacao do usuario
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { loginUsuario } from '../services/authService';
import Campo from '../components/Campo';
import Botao from '../components/Botao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';

const TelaLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // realiza o login do usuario com validacao basica
  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atencao', 'Preencha todos os campos.');
      return;
    }

    setCarregando(true);
    try {
      await loginUsuario(email.trim(), senha);
      // vibracao de sucesso ao fazer login
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Email ou senha invalidos. Verifique seus dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* logo e titulo do aplicativo */}
        <View style={estilos.cabecalho}>
          <View style={estilos.logoContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop' }}
              style={estilos.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={estilos.titulo}>MotoGest</Text>
          <Text style={estilos.subtitulo}>Gerenciamento de Motocicletas</Text>
        </View>

        {/* formulario de login */}
        <View style={estilos.formulario}>
          <Campo
            label="Email"
            valor={email}
            aoMudar={setEmail}
            placeholder="seu@email.com"
            tipo="email-address"
            autoCapitalize="none"
            obrigatorio
          />
          <Campo
            label="Senha"
            valor={senha}
            aoMudar={setSenha}
            placeholder="Sua senha"
            secureTextEntry
            obrigatorio
          />

          <Botao
            titulo="Entrar"
            onPress={handleLogin}
            carregando={carregando}
            estilo={estilos.botaoLogin}
          />

          <Botao
            titulo="Criar conta"
            onPress={() => navigation.navigate('Cadastro')}
            variante="secundario"
            estilo={estilos.botaoCadastro}
          />
        </View>

        <Text style={estilos.versao}>v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: CORES.branco,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ESPACAMENTO.lg,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: ESPACAMENTO.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDA.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: CORES.preto,
    marginBottom: ESPACAMENTO.md,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titulo: {
    fontSize: FONTE.titulo,
    fontWeight: '800',
    color: CORES.preto,
    letterSpacing: -1,
  },
  subtitulo: {
    fontSize: FONTE.sm,
    color: CORES.cinzaClaro,
    marginTop: ESPACAMENTO.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formulario: {
    marginBottom: ESPACAMENTO.xl,
  },
  botaoLogin: {
    marginTop: ESPACAMENTO.sm,
    marginBottom: ESPACAMENTO.sm,
  },
  botaoCadastro: {},
  versao: {
    textAlign: 'center',
    fontSize: FONTE.xs,
    color: CORES.cinzaBorda,
  },
});

export default TelaLogin;
