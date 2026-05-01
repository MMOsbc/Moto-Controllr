// tela principal - dashboard com resumo e indicadores
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { buscarMotos } from '../services/motoService';
import { buscarManutencoes } from '../services/manutencaoService';
import { buscarAbastecimentos } from '../services/abastecimentoService';
import { buscarChecklists } from '../services/checklistService';
import Cartao from '../components/Cartao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

const TelaDashboard = ({ navigation }) => {
  const [motos, setMotos] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [atualizando, setAtualizando] = useState(false);

  const usuario = auth.currentUser;

  // carrega todos os dados ao focar na tela
  const carregarDados = useCallback(async () => {
    if (!usuario) return;
    try {
      const [m, man, ab, ch] = await Promise.all([
        buscarMotos(usuario.uid),
        buscarManutencoes(usuario.uid),
        buscarAbastecimentos(usuario.uid),
        buscarChecklists(usuario.uid),
      ]);
      setMotos(m);
      setManutencoes(man);
      setAbastecimentos(ab);
      setChecklists(ch);
    } catch (e) {
      console.log('erro ao carregar dados do dashboard');
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  };

  // calcula gasto total do mes atual
  const gastoMes = abastecimentos
    .filter((a) => {
      const data = new Date(a.criadoEm);
      const agora = new Date();
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    })
    .reduce((acc, a) => acc + (parseFloat(a.valorTotal) || 0), 0);

  const gastoManutencao = manutencoes
    .filter((m) => {
      const data = new Date(m.criadoEm);
      const agora = new Date();
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    })
    .reduce((acc, m) => acc + (parseFloat(m.custo) || 0), 0);

  return (
    <ScrollView
      style={estilos.scroll}
      contentContainerStyle={estilos.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} />}
    >
      {/* cabecalho de boas vindas */}
      <View style={estilos.header}>
        <View>
          <Text style={estilos.saudacao}>Ola, {usuario?.displayName?.split(' ')[0] || 'Piloto'}</Text>
          <Text style={estilos.data}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={estilos.avatarContainer}>
          <Text style={estilos.avatarLetra}>
            {(usuario?.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
      </View>

      {/* imagem decorativa */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=300&fit=crop' }}
        style={estilos.imagemBanner}
        resizeMode="cover"
      />

      {/* indicadores rapidos */}
      <View style={estilos.indicadores}>
        <TouchableOpacity style={estilos.indicador} onPress={() => navigation.navigate('Motos')}>
          <Text style={estilos.indicadorNumero}>{motos.length}</Text>
          <Text style={estilos.indicadorLabel}>Motos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.indicador} onPress={() => navigation.navigate('Manutencoes')}>
          <Text style={estilos.indicadorNumero}>{manutencoes.length}</Text>
          <Text style={estilos.indicadorLabel}>Manutencoes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.indicador} onPress={() => navigation.navigate('Abastecimentos')}>
          <Text style={estilos.indicadorNumero}>{abastecimentos.length}</Text>
          <Text style={estilos.indicadorLabel}>Abast.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.indicador} onPress={() => navigation.navigate('Checklist')}>
          <Text style={estilos.indicadorNumero}>{checklists.length}</Text>
          <Text style={estilos.indicadorLabel}>Checks</Text>
        </TouchableOpacity>
      </View>

      {/* gastos do mes */}
      <Text style={estilos.secaoTitulo}>Gastos este mes</Text>
      <Cartao elevado>
        <View style={estilos.gastoLinha}>
          <Text style={estilos.gastoLabel}>Abastecimento</Text>
          <Text style={estilos.gastoValor}>R$ {gastoMes.toFixed(2)}</Text>
        </View>
        <View style={[estilos.gastoLinha, estilos.gastoDivisor]}>
          <Text style={estilos.gastoLabel}>Manutencao</Text>
          <Text style={estilos.gastoValor}>R$ {gastoManutencao.toFixed(2)}</Text>
        </View>
        <View style={estilos.gastoLinha}>
          <Text style={[estilos.gastoLabel, estilos.gastoTotalLabel]}>Total</Text>
          <Text style={[estilos.gastoValor, estilos.gastoTotalValor]}>
            R$ {(gastoMes + gastoManutencao).toFixed(2)}
          </Text>
        </View>
      </Cartao>

      {/* atalhos de acesso rapido */}
      <Text style={estilos.secaoTitulo}>Acesso rapido</Text>
      <View style={estilos.atalhos}>
        {[
          { label: 'Adicionar Moto', tela: 'FormMoto' },
          { label: 'Registrar Abastecimento', tela: 'FormAbastecimento' },
          { label: 'Registrar Manutencao', tela: 'FormManutencao' },
          { label: 'Fazer Checklist', tela: 'Checklist' },
        ].map((item) => (
          <TouchableOpacity
            key={item.tela}
            style={estilos.atalho}
            onPress={() => navigation.navigate(item.tela)}
          >
            <Text style={estilos.atalhoTexto}>{item.label}</Text>
            <Text style={estilos.atalhoSeta}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ultimas manutencoes */}
      {manutencoes.length > 0 && (
        <>
          <Text style={estilos.secaoTitulo}>Ultimas manutencoes</Text>
          {manutencoes.slice(0, 3).map((m) => (
            <Cartao key={m.id}>
              <Text style={estilos.manutencaoTipo}>{m.tipo}</Text>
              <Text style={estilos.manutencaoDesc}>{m.descricao}</Text>
              <View style={estilos.manutencaoRodape}>
                <Text style={estilos.manutencaoData}>
                  {new Date(m.criadoEm).toLocaleDateString('pt-BR')}
                </Text>
                {m.custo ? (
                  <Text style={estilos.manutencaoCusto}>R$ {parseFloat(m.custo).toFixed(2)}</Text>
                ) : null}
              </View>
            </Cartao>
          ))}
        </>
      )}

      {/* estado vazio - sem motos cadastradas */}
      {motos.length === 0 && (
        <Cartao estilo={estilos.vazio}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400&h=200&fit=crop' }}
            style={estilos.imagemVazio}
            resizeMode="cover"
          />
          <Text style={estilos.vazioTitulo}>Nenhuma moto cadastrada</Text>
          <Text style={estilos.vazioTexto}>
            Cadastre sua primeira motocicleta para comecar a gerenciar.
          </Text>
          <TouchableOpacity
            style={estilos.botaoVazio}
            onPress={() => navigation.navigate('FormMoto')}
          >
            <Text style={estilos.botaoVazioTexto}>Cadastrar moto</Text>
          </TouchableOpacity>
        </Cartao>
      )}
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: CORES.cinzaFundo },
  content: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACAMENTO.md,
  },
  saudacao: { fontSize: FONTE.xl, fontWeight: '700', color: CORES.preto },
  data: { fontSize: FONTE.sm, color: CORES.cinzaClaro, marginTop: 2, textTransform: 'capitalize' },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDA.full,
    backgroundColor: CORES.preto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetra: { color: CORES.branco, fontSize: FONTE.lg, fontWeight: '700' },
  imagemBanner: {
    width: '100%',
    height: 160,
    borderRadius: BORDA.lg,
    marginBottom: ESPACAMENTO.md,
  },
  indicadores: {
    flexDirection: 'row',
    backgroundColor: CORES.branco,
    borderRadius: BORDA.lg,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
    marginBottom: ESPACAMENTO.md,
    overflow: 'hidden',
  },
  indicador: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ESPACAMENTO.md,
    borderRightWidth: 1,
    borderRightColor: CORES.cinzaBorda,
  },
  indicadorNumero: { fontSize: FONTE.xl, fontWeight: '800', color: CORES.preto },
  indicadorLabel: { fontSize: FONTE.xs, color: CORES.cinzaClaro, marginTop: 2, textTransform: 'uppercase' },
  secaoTitulo: {
    fontSize: FONTE.sm,
    fontWeight: '700',
    color: CORES.cinzaClaro,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ESPACAMENTO.sm,
    marginTop: ESPACAMENTO.sm,
  },
  gastoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ESPACAMENTO.xs },
  gastoDivisor: { borderTopWidth: 1, borderTopColor: CORES.cinzaBorda, marginTop: ESPACAMENTO.xs },
  gastoLabel: { fontSize: FONTE.md, color: CORES.cinzaTexto },
  gastoValor: { fontSize: FONTE.md, color: CORES.preto, fontWeight: '600' },
  gastoTotalLabel: { fontWeight: '700', color: CORES.preto },
  gastoTotalValor: { fontWeight: '800', fontSize: FONTE.lg },
  atalhos: { marginBottom: ESPACAMENTO.sm },
  atalho: {
    backgroundColor: CORES.branco,
    borderRadius: BORDA.md,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
    paddingHorizontal: ESPACAMENTO.md,
    paddingVertical: ESPACAMENTO.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACAMENTO.sm,
  },
  atalhoTexto: { fontSize: FONTE.md, color: CORES.preto, fontWeight: '500' },
  atalhoSeta: { fontSize: FONTE.lg, color: CORES.cinzaClaro },
  manutencaoTipo: { fontSize: FONTE.xs, color: CORES.cinzaClaro, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  manutencaoDesc: { fontSize: FONTE.md, color: CORES.preto, fontWeight: '500' },
  manutencaoRodape: { flexDirection: 'row', justifyContent: 'space-between', marginTop: ESPACAMENTO.xs },
  manutencaoData: { fontSize: FONTE.sm, color: CORES.cinzaClaro },
  manutencaoCusto: { fontSize: FONTE.sm, color: CORES.preto, fontWeight: '600' },
  vazio: { alignItems: 'center', padding: ESPACAMENTO.lg },
  imagemVazio: { width: '100%', height: 150, borderRadius: BORDA.md, marginBottom: ESPACAMENTO.md },
  vazioTitulo: { fontSize: FONTE.lg, fontWeight: '700', color: CORES.preto, marginBottom: ESPACAMENTO.xs },
  vazioTexto: { fontSize: FONTE.sm, color: CORES.cinzaClaro, textAlign: 'center', marginBottom: ESPACAMENTO.md, lineHeight: 20 },
  botaoVazio: { backgroundColor: CORES.preto, paddingHorizontal: ESPACAMENTO.lg, paddingVertical: ESPACAMENTO.sm, borderRadius: BORDA.full },
  botaoVazioTexto: { color: CORES.branco, fontSize: FONTE.sm, fontWeight: '600' },
});

export default TelaDashboard;
