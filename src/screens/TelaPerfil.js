// tela de perfil do usuario com opcoes de conta
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { logoutUsuario } from '../services/authService';
import Cabecalho from '../components/Cabecalho';
import Cartao from '../components/Cartao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

const TelaPerfil = () => {
  const [carregando, setCarregando] = useState(false);
  const usuario = auth.currentUser;

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setCarregando(true);
            try {
              await logoutUsuario();
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {
              Alert.alert('Erro', 'Nao foi possivel sair. Tente novamente.');
            } finally {
              setCarregando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={estilos.container}>
      <Cabecalho titulo="Perfil" />
      <ScrollView contentContainerStyle={estilos.scroll}>

        {/* avatar e dados do usuario */}
        <View style={estilos.avatarSection}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarLetra}>
              {(usuario?.displayName || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={estilos.nome}>{usuario?.displayName || 'Usuario'}</Text>
          <Text style={estilos.email}>{usuario?.email}</Text>
        </View>

        {/* informacoes da conta */}
        <Text style={estilos.secaoTitulo}>Informacoes da conta</Text>
        <Cartao>
          <View style={estilos.infoLinha}>
            <Text style={estilos.infoLabel}>Nome</Text>
            <Text style={estilos.infoValor}>{usuario?.displayName || '---'}</Text>
          </View>
          <View style={[estilos.infoLinha, estilos.infoDivisor]}>
            <Text style={estilos.infoLabel}>Email</Text>
            <Text style={estilos.infoValor}>{usuario?.email}</Text>
          </View>
          <View style={[estilos.infoLinha, estilos.infoDivisor]}>
            <Text style={estilos.infoLabel}>UID</Text>
            <Text style={[estilos.infoValor, estilos.uid]} numberOfLines={1} ellipsizeMode="middle">
              {usuario?.uid}
            </Text>
          </View>
        </Cartao>

        {/* sobre o aplicativo */}
        <Text style={estilos.secaoTitulo}>Sobre o aplicativo</Text>
        <Cartao>
          {[
            { label: 'Aplicativo', valor: 'MotoGest' },
            { label: 'Versao', valor: '1.0.0' },
            { label: 'Banco de dados', valor: 'Firebase Firestore' },
            { label: 'Framework', valor: 'React Native + Expo' },
          ].map((item, i) => (
            <View key={i} style={[estilos.infoLinha, i > 0 && estilos.infoDivisor]}>
              <Text style={estilos.infoLabel}>{item.label}</Text>
              <Text style={estilos.infoValor}>{item.valor}</Text>
            </View>
          ))}
        </Cartao>

        {/* botao de logout */}
        <TouchableOpacity
          style={estilos.botaoSair}
          onPress={handleLogout}
          disabled={carregando}
        >
          <Text style={estilos.botaoSairTexto}>
            {carregando ? 'Saindo...' : 'Sair da conta'}
          </Text>
        </TouchableOpacity>

        <Text style={estilos.rodape}>MotoGest — Desenvolvido com React Native e Expo</Text>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  scroll: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  avatarSection: { alignItems: 'center', paddingVertical: ESPACAMENTO.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BORDA.full,
    backgroundColor: CORES.preto,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ESPACAMENTO.md,
  },
  avatarLetra: { color: CORES.branco, fontSize: FONTE.xxl, fontWeight: '800' },
  nome: { fontSize: FONTE.xl, fontWeight: '700', color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  email: { fontSize: FONTE.sm, color: CORES.cinzaClaro },
  secaoTitulo: { fontSize: FONTE.xs, fontWeight: '700', color: CORES.cinzaClaro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACAMENTO.sm, marginTop: ESPACAMENTO.sm },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ESPACAMENTO.sm, alignItems: 'center' },
  infoDivisor: { borderTopWidth: 1, borderTopColor: CORES.cinzaBorda },
  infoLabel: { fontSize: FONTE.sm, color: CORES.cinzaClaro },
  infoValor: { fontSize: FONTE.sm, color: CORES.preto, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  uid: { fontSize: FONTE.xs, fontFamily: 'monospace' },
  botaoSair: {
    marginTop: ESPACAMENTO.lg,
    borderWidth: 1.5,
    borderColor: CORES.erro,
    borderRadius: BORDA.md,
    padding: ESPACAMENTO.md,
    alignItems: 'center',
  },
  botaoSairTexto: { color: CORES.erro, fontSize: FONTE.md, fontWeight: '600' },
  rodape: { textAlign: 'center', fontSize: FONTE.xs, color: CORES.cinzaBorda, marginTop: ESPACAMENTO.xl },
});

export default TelaPerfil;
