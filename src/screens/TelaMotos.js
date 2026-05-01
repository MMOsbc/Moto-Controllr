// tela de listagem de motocicletas com acoes de editar e remover
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { buscarMotos, removerMoto } from '../services/motoService';
import Cabecalho from '../components/Cabecalho';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

const TelaMotos = ({ navigation }) => {
  const [motos, setMotos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const usuario = auth.currentUser;

  // recarrega a lista sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      carregarMotos();
    }, [])
  );

  const carregarMotos = async () => {
    try {
      const dados = await buscarMotos(usuario.uid);
      setMotos(dados);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel carregar as motocicletas.');
    } finally {
      setCarregando(false);
    }
  };

  // confirma e executa a remocao de uma moto
  const confirmarRemocao = (id, modelo) => {
    Alert.alert(
      'Remover motocicleta',
      `Deseja remover ${modelo}? Esta acao nao pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerMoto(id);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              carregarMotos();
            } catch (e) {
              Alert.alert('Erro', 'Nao foi possivel remover a moto.');
            }
          },
        },
      ]
    );
  };

  // renderiza cada item da lista de motos
  const renderizarMoto = ({ item }) => (
    <TouchableOpacity
      style={estilos.cartao}
      onPress={() => navigation.navigate('FormMoto', { moto: item })}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: item.imagem || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=200&fit=crop',
        }}
        style={estilos.imagemMoto}
        resizeMode="cover"
      />
      <View style={estilos.info}>
        <View style={estilos.infoTopo}>
          <View>
            <Text style={estilos.modelo}>{item.marca} {item.modelo}</Text>
            <Text style={estilos.ano}>{item.ano} — {item.cor}</Text>
          </View>
          <View style={estilos.placaTag}>
            <Text style={estilos.placaTexto}>{item.placa}</Text>
          </View>
        </View>
        <View style={estilos.rodape}>
          <Text style={estilos.km}>{parseInt(item.quilometragem || 0).toLocaleString('pt-BR')} km</Text>
          <View style={estilos.acoes}>
            <TouchableOpacity
              style={estilos.botaoAcao}
              onPress={() => navigation.navigate('FormMoto', { moto: item })}
            >
              <Text style={estilos.botaoAcaoTexto}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botaoAcao, estilos.botaoRemover]}
              onPress={() => confirmarRemocao(item.id, `${item.marca} ${item.modelo}`)}
            >
              <Text style={[estilos.botaoAcaoTexto, estilos.textoRemover]}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={estilos.container}>
      <Cabecalho
        titulo="Motocicletas"
        acaoDireita={
          <TouchableOpacity onPress={() => navigation.navigate('FormMoto')}>
            <Text style={estilos.botaoAdicionar}>+</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={motos}
        keyExtractor={(item) => item.id}
        renderItem={renderizarMoto}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          !carregando ? (
            <View style={estilos.vazio}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
                style={estilos.imagemVazio}
                resizeMode="cover"
              />
              <Text style={estilos.vazioTitulo}>Nenhuma moto cadastrada</Text>
              <Text style={estilos.vazioTexto}>Toque no + para adicionar sua primeira motocicleta.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  botaoAdicionar: { fontSize: 28, color: CORES.preto, fontWeight: '300', lineHeight: 32 },
  lista: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  cartao: {
    backgroundColor: CORES.branco,
    borderRadius: BORDA.lg,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
    marginBottom: ESPACAMENTO.md,
    overflow: 'hidden',
  },
  imagemMoto: { width: '100%', height: 180 },
  info: { padding: ESPACAMENTO.md },
  infoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACAMENTO.sm },
  modelo: { fontSize: FONTE.lg, fontWeight: '700', color: CORES.preto },
  ano: { fontSize: FONTE.sm, color: CORES.cinzaClaro, marginTop: 2 },
  placaTag: {
    backgroundColor: CORES.preto,
    paddingHorizontal: ESPACAMENTO.sm,
    paddingVertical: ESPACAMENTO.xs,
    borderRadius: BORDA.sm,
  },
  placaTexto: { color: CORES.branco, fontSize: FONTE.sm, fontWeight: '700', letterSpacing: 1 },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  km: { fontSize: FONTE.sm, color: CORES.cinzaTexto, fontWeight: '500' },
  acoes: { flexDirection: 'row', gap: ESPACAMENTO.xs },
  botaoAcao: {
    paddingHorizontal: ESPACAMENTO.md,
    paddingVertical: ESPACAMENTO.xs,
    borderRadius: BORDA.full,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
  },
  botaoRemover: { borderColor: CORES.erro },
  botaoAcaoTexto: { fontSize: FONTE.sm, color: CORES.preto, fontWeight: '500' },
  textoRemover: { color: CORES.erro },
  vazio: { alignItems: 'center', paddingTop: ESPACAMENTO.xxl },
  imagemVazio: { width: 200, height: 150, borderRadius: BORDA.md, marginBottom: ESPACAMENTO.lg },
  vazioTitulo: { fontSize: FONTE.lg, fontWeight: '700', color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  vazioTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro, textAlign: 'center' },
});

export default TelaMotos;
