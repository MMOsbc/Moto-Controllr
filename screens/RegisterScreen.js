// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { registrar } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import ValidatedInput from '../components/ValidatedInput';
import { validarEmail, validarObrigatorio, validarTelefone, mascaraTelefone } from '../utils/validators';
// tela de registro para o usuario criar uma nova conta, com campos para nome, email, senha, confirmacao de senha e telefone, com validacao dos campos e tratamento para quando o registro estiver em andamento, desabilitando o botao e mostrando um indicador de carregamento
// variavel para armazenar como string as mensagens de erro de validacao dos campos, inicialmente vazias
const errosIniciais = { nome: '', email: '', senha: '', confirmarSenha: '', telefone: '' };
// funcao para dados de cadastro 
export default function RegisterScreen({ navigation }) {
  const { entrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState(errosIniciais);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  // valida os campos se foram prenchidos certos 
  function validarCampo(campo, valor, extra) {
    switch (campo) {
      case 'nome': return validarObrigatorio(valor, 'Nome').erro;
      case 'email': return validarEmail(valor).erro;
      case 'senha': if (!valor) return 'Senha e obrigatoria'; if (valor.length < 6) return 'Minimo 6 caracteres'; return '';
      case 'confirmarSenha': if (!valor) return 'Confirme a senha'; if (valor !== extra) return 'As senhas nao coincidem'; return '';
      case 'telefone': return valor.trim() ? validarTelefone(valor).erro : '';
      default: return '';
    }
  }
 // atualiza o formulario conforme vai sendo preenchdo 
  function atualizar(campo, valor, setter, extra) {
    setter(valor);
    if (tentouEnviar) setErros(prev => ({ ...prev, [campo]: validarCampo(campo, valor, extra) }));
  }
  // valida se os campos estao corretos 
  function validarFormulario() {
    const novosErros = {
      nome: validarCampo('nome', nome), email: validarCampo('email', email),
      senha: validarCampo('senha', senha), confirmarSenha: validarCampo('confirmarSenha', confirmarSenha, senha),
      telefone: validarCampo('telefone', telefone),
    };
    setErros(novosErros);
    return Object.values(novosErros).every(e => !e);
  }
 // funcao para realizar o registro, valida se os campos estao corretos, chama a funcao de registro do auth e trata o resultado, apresentando mensagens de erro ou sucesso conforme o caso
  async function handleRegistro() {
    setTentouEnviar(true);
    if (!validarFormulario()) return;
    setCarregando(true);
    const resultado = await registrar({ nome, email, senha, telefone: telefone || undefined });
    setCarregando(false);
    if (resultado.sucesso) { await entrar(resultado.usuario); }
    else { Alert.alert('Erro', resultado.erro); }
  }
// funcao para formatar o telefone enquanto o usuario digita, garantindo que fique no formato (XX) XXXXX-XXXX, e valida o telefone caso o usuario ja tenha tentado enviar o formulario, apresentando a mensagem de erro correspondente
  function handleTelefone(texto) {
    const mascarado = mascaraTelefone(texto);
    setTelefone(mascarado);
    if (tentouEnviar) setErros(prev => ({ ...prev, telefone: validarCampo('telefone', mascarado) }));
  }
  // apresenta o logo, campos de nome, email, senha, confirmacao de senha e telefone, botao para realizar registro e link para a tela de login, com tratamento para quando o registro estiver em andamento, desabilitando o botao e mostrando um indicador de carregamento
  return (
    <KeyboardAvoidingView style={es.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={es.scroll} keyboardShouldPersistTaps="handled">
        <View style={es.header}>
          <View style={es.logoBox}><Text style={es.logoLetra}>M</Text></View>
          <Text style={es.titulo}>Criar Conta</Text>
          <Text style={es.subtitulo}>Junte-se ao MotoControllr</Text>
        </View>

        <View style={es.card}>
          <ValidatedInput label="Nome completo" obrigatorio placeholder="Seu nome" value={nome} onChangeText={v => atualizar('nome', v, setNome)} autoCapitalize="words" erro={erros.nome} />
          <ValidatedInput label="E-mail" obrigatorio placeholder="seu@email.com" value={email} onChangeText={v => atualizar('email', v.trim(), setEmail)} keyboardType="email-address" autoCapitalize="none" erro={erros.email} />
          <ValidatedInput label="Telefone (opcional)" placeholder="(11) 91234-5678" value={telefone} onChangeText={handleTelefone} keyboardType="phone-pad" maxLength={15} erro={erros.telefone} />
          <ValidatedInput label="Senha (minimo 6 caracteres)" obrigatorio placeholder="Crie uma senha" value={senha} onChangeText={v => atualizar('senha', v, setSenha)} secureTextEntry={!senhaVisivel} erro={erros.senha} />
          <ValidatedInput label="Confirmar senha" obrigatorio placeholder="Repita a senha" value={confirmarSenha} onChangeText={v => atualizar('confirmarSenha', v, setConfirmarSenha, senha)} secureTextEntry={!senhaVisivel} erro={erros.confirmarSenha} />

          <TouchableOpacity style={es.toggleSenha} onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Text style={es.toggleSenhaTexto}>{senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[es.botaoCadastrar, carregando && { opacity: 0.7 }]} onPress={handleRegistro} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={es.textoBotaoCadastrar}>Criar conta</Text>}
          </TouchableOpacity>
        </View>

        <View style={es.rodape}>
          <Text style={es.textoRodape}>Ja tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={es.linkLogin}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const es = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoLetra: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold' },
  titulo: { color: '#111111', fontSize: 26, fontWeight: '800' },
  subtitulo: { color: '#888888', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#F5F5F5', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  toggleSenha: { alignSelf: 'flex-end', marginTop: 8 },
  toggleSenhaTexto: { color: '#888888', fontSize: 12, fontWeight: '600' },
  botaoCadastrar: { backgroundColor: '#111111', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  textoBotaoCadastrar: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  textoRodape: { color: '#888888', fontSize: 14 },
  linkLogin: { color: '#111111', fontWeight: '700', fontSize: 14 },
});
