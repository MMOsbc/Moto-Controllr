// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';
// tela de login para o usuario acessar sua conta ou registrar uma nova
export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
// funcao para realizar o login, valida se os campos estao preenchidos, chama a funcao de login do auth e trata o resultado, apresentando mensagens de erro ou sucesso conforme o caso
  async function handleLogin() {
    if (!email.trim() || !senha.trim()) { Alert.alert('Atencao', 'Preencha e-mail e senha.'); return; }
    setCarregando(true);
    const resultado = await login({ email, senha });
    setCarregando(false);
    if (resultado.sucesso) { await entrar(resultado.usuario); }
    else { Alert.alert('Erro', resultado.erro); }
  }
// apresenta o logo, campos de email e senha, botao para realizar login e link para a tela de registro, com tratamento para quando o login estiver em andamento, desabilitando o botao e mostrando um indicador de carregamento
  return (
    <KeyboardAvoidingView style={es.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={es.scroll} keyboardShouldPersistTaps="handled">
        <View style={es.header}>
          <View style={es.logoBox}><Text style={es.logoLetra}>M</Text></View>
          <Text style={es.titulo}>MotoManager</Text>
          <Text style={es.subtitulo}>Controle completo da sua moto</Text>
        </View>

        <View style={es.card}>
          <Text style={es.cardTitulo}>Entrar na conta</Text>

          <Text style={es.label}>E-mail</Text>
          <TextInput style={es.input} placeholder="seu@email.com" placeholderTextColor="#AAAAAA" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          <Text style={es.label}>Senha</Text>
          <View style={es.inputSenhaContainer}>
            <TextInput style={es.inputSenha} placeholder="Sua senha" placeholderTextColor="#AAAAAA" value={senha} onChangeText={setSenha} secureTextEntry={!senhaVisivel} />
            <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)} style={es.botaoOlho}>
              <Text style={es.olhoTexto}>{senhaVisivel ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[es.botaoEntrar, carregando && { opacity: 0.7 }]} onPress={handleLogin} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={es.textoBotaoEntrar}>Entrar</Text>}
          </TouchableOpacity>
        </View>

        <View style={es.rodape}>
          <Text style={es.textoRodape}>Nao tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
            <Text style={es.linkCadastro}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoLetra: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
  titulo: { color: '#111111', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitulo: { color: '#888888', fontSize: 14, marginTop: 6 },
  card: { backgroundColor: '#F5F5F5', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  cardTitulo: { color: '#111111', fontSize: 17, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, color: '#111111', fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  inputSenhaContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  inputSenha: { flex: 1, padding: 14, color: '#111111', fontSize: 15 },
  botaoOlho: { padding: 12 },
  olhoTexto: { color: '#888888', fontSize: 12, fontWeight: '600' },
  botaoEntrar: { backgroundColor: '#111111', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  textoBotaoEntrar: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  textoRodape: { color: '#888888', fontSize: 14 },
  linkCadastro: { color: '#111111', fontWeight: '700', fontSize: 14 },
});
