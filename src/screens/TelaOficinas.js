// tela de oficinas proximas com integracao de gps e mapa
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Cabecalho from '../components/Cabecalho';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';

// dados de exemplo para demonstracao - em producao usar google places api
const OFICINAS_EXEMPLO = [
  { id: '1', nome: 'Moto Center SP', endereco: 'Av. Paulista, 1000', telefone: '(11) 9999-1111', distancia: '0.8 km', especialidade: 'Motos em geral' },
  { id: '2', nome: 'Honda Premium Service', endereco: 'Rua Augusta, 500', telefone: '(11) 9999-2222', distancia: '1.2 km', especialidade: 'Honda, Yamaha' },
  { id: '3', nome: 'Bike Fix', endereco: 'Rua Oscar Freire, 300', telefone: '(11) 9999-3333', distancia: '2.1 km', especialidade: 'Revisao e freios' },
  { id: '4', nome: 'Moto Express', endereco: 'Rua Consolacao, 800', telefone: '(11) 9999-4444', distancia: '2.5 km', especialidade: 'Eletrica e motor' },
  { id: '5', nome: 'Oficina do Motard', endereco: 'Av. Reboucas, 1500', telefone: '(11) 9999-5555', distancia: '3.0 km', especialidade: 'Todas as marcas' },
];

const TelaOficinas = () => {
  const [localizacao, setLocalizacao] = useState(null);
  const [carregandoGPS, setCarregandoGPS] = useState(false);
  const [oficinas, setOficinas] = useState(OFICINAS_EXEMPLO);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  // solicita permissao de localizacao ao montar a tela
  useEffect(() => {
    obterLocalizacao();
  }, []);

  // obtém a localizacao atual do dispositivo via gps
  const obterLocalizacao = async () => {
    setCarregandoGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissaoNegada(true);
        Alert.alert(
          'Permissao necessaria',
          'Habilite o acesso a localizacao para encontrar oficinas proximas.'
        );
        setCarregandoGPS(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocalizacao(pos.coords);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // em producao: buscar oficinas via google places api com as coordenadas
      // por enquanto usa dados de exemplo ordenados por distancia simulada
      setOficinas(OFICINAS_EXEMPLO);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel obter a localizacao. Verifique o GPS.');
    } finally {
      setCarregandoGPS(false);
    }
  };

  // abre o google maps com rota ate a oficina
  const abrirRota = async (oficina) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const enderecoCodificado = encodeURIComponent(oficina.endereco);
    let url;

    if (localizacao) {
      // rota com origem na localizacao atual
      url = Platform.select({
        ios: `maps://app?saddr=${localizacao.latitude},${localizacao.longitude}&daddr=${enderecoCodificado}`,
        android: `google.navigation:q=${enderecoCodificado}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${enderecoCodificado}`,
      });
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;
    }

    const podeAbrir = await Linking.canOpenURL(url);
    if (podeAbrir) {
      await Linking.openURL(url);
    } else {
      // fallback para google maps web
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`);
    }
  };

  // liga para a oficina
  const ligar = async (telefone) => {
    const url = `tel:${telefone.replace(/\D/g, '')}`;
    const podeAbrir = await Linking.canOpenURL(url);
    if (podeAbrir) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Indisponivel', 'Nao foi possivel iniciar a ligacao.');
    }
  };

  return (
    <View style={estilos.container}>
      <Cabecalho titulo="Oficinas Proximas" />
      <ScrollView contentContainerStyle={estilos.scroll}>

        {/* painel de localizacao atual */}
        <View style={estilos.painelGPS}>
          {carregandoGPS ? (
            <View style={estilos.gpsCarregando}>
              <ActivityIndicator color={CORES.branco} size="small" />
              <Text style={estilos.gpsCarregandoTexto}>Obtendo localizacao...</Text>
            </View>
          ) : localizacao ? (
            <View>
              <Text style={estilos.gpsLabel}>Sua localizacao</Text>
              <Text style={estilos.gpsCoordenadas}>
                {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity style={estilos.botaoAtualizar} onPress={obterLocalizacao}>
                <Text style={estilos.botaoAtualizarTexto}>Atualizar localizacao</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={estilos.gpsLabel}>
                {permissaoNegada ? 'Permissao de localizacao negada' : 'Localizacao nao obtida'}
              </Text>
              <TouchableOpacity style={estilos.botaoAtualizar} onPress={obterLocalizacao}>
                <Text style={estilos.botaoAtualizarTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* link para abrir mapa completo no google maps */}
        <TouchableOpacity
          style={estilos.botaoMapa}
          onPress={() => {
            const query = localizacao
              ? `https://www.google.com/maps/search/oficina+de+moto/@${localizacao.latitude},${localizacao.longitude},15z`
              : 'https://www.google.com/maps/search/oficina+de+moto';
            Linking.openURL(query);
          }}
        >
          <Text style={estilos.botaoMapaTexto}>Ver no Google Maps</Text>
        </TouchableOpacity>

        {/* lista de oficinas */}
        <Text style={estilos.secaoTitulo}>Oficinas encontradas ({oficinas.length})</Text>
        {oficinas.map((oficina) => (
          <Cartao key={oficina.id} elevado>
            <View style={estilos.oficinaTopo}>
              <View style={estilos.oficinaInfo}>
                <Text style={estilos.oficinaNome}>{oficina.nome}</Text>
                <Text style={estilos.oficinaEndereco}>{oficina.endereco}</Text>
                <Text style={estilos.oficinaEspecialidade}>{oficina.especialidade}</Text>
              </View>
              <View style={estilos.distanciaContainer}>
                <Text style={estilos.distanciaTexto}>{oficina.distancia}</Text>
              </View>
            </View>
            <View style={estilos.oficinaBotoes}>
              <TouchableOpacity
                style={estilos.botaoOficina}
                onPress={() => ligar(oficina.telefone)}
              >
                <Text style={estilos.botaoOficinaTexto}>Ligar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botaoOficina, estilos.botaoRota]}
                onPress={() => abrirRota(oficina)}
              >
                <Text style={estilos.botaoRotaTexto}>Como chegar</Text>
              </TouchableOpacity>
            </View>
          </Cartao>
        ))}

        <Text style={estilos.aviso}>
          As distancias sao aproximadas. Para resultados precisos, habilite o GPS.
        </Text>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  scroll: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  painelGPS: {
    backgroundColor: CORES.preto,
    borderRadius: BORDA.lg,
    padding: ESPACAMENTO.md,
    marginBottom: ESPACAMENTO.md,
  },
  gpsCarregando: { flexDirection: 'row', alignItems: 'center', gap: ESPACAMENTO.sm },
  gpsCarregandoTexto: { color: CORES.cinzaClaro, fontSize: FONTE.sm },
  gpsLabel: { color: CORES.cinzaClaro, fontSize: FONTE.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: ESPACAMENTO.xs },
  gpsCoordenadas: { color: CORES.branco, fontSize: FONTE.md, fontWeight: '600', fontVariant: ['tabular-nums'], marginBottom: ESPACAMENTO.sm },
  botaoAtualizar: { alignSelf: 'flex-start', borderWidth: 1, borderColor: CORES.cinzaMedio, paddingHorizontal: ESPACAMENTO.md, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full },
  botaoAtualizarTexto: { color: CORES.branco, fontSize: FONTE.sm },
  botaoMapa: {
    backgroundColor: CORES.branco,
    borderRadius: BORDA.md,
    borderWidth: 1.5,
    borderColor: CORES.preto,
    padding: ESPACAMENTO.md,
    alignItems: 'center',
    marginBottom: ESPACAMENTO.md,
  },
  botaoMapaTexto: { fontSize: FONTE.md, fontWeight: '600', color: CORES.preto },
  secaoTitulo: { fontSize: FONTE.xs, fontWeight: '700', color: CORES.cinzaClaro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACAMENTO.sm },
  oficinaTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ESPACAMENTO.sm },
  oficinaInfo: { flex: 1, marginRight: ESPACAMENTO.sm },
  oficinaNome: { fontSize: FONTE.md, fontWeight: '700', color: CORES.preto, marginBottom: 2 },
  oficinaEndereco: { fontSize: FONTE.sm, color: CORES.cinzaTexto, marginBottom: 2 },
  oficinaEspecialidade: { fontSize: FONTE.xs, color: CORES.cinzaClaro },
  distanciaContainer: { backgroundColor: CORES.cinzaFundo, paddingHorizontal: ESPACAMENTO.sm, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, alignSelf: 'flex-start' },
  distanciaTexto: { fontSize: FONTE.sm, fontWeight: '600', color: CORES.cinzaMedio },
  oficinaBotoes: { flexDirection: 'row', gap: ESPACAMENTO.xs },
  botaoOficina: { flex: 1, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, borderWidth: 1, borderColor: CORES.cinzaBorda, alignItems: 'center' },
  botaoRota: { backgroundColor: CORES.preto, borderColor: CORES.preto },
  botaoOficinaTexto: { fontSize: FONTE.sm, color: CORES.preto, fontWeight: '500' },
  botaoRotaTexto: { fontSize: FONTE.sm, color: CORES.branco, fontWeight: '600' },
  aviso: { fontSize: FONTE.xs, color: CORES.cinzaClaro, textAlign: 'center', marginTop: ESPACAMENTO.md, fontStyle: 'italic' },
});

export default TelaOficinas;
