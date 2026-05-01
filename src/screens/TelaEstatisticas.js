// tela de estatisticas - graficos e resumos de gastos e desempenho
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { buscarAbastecimentos } from '../services/abastecimentoService';
import { buscarManutencoes } from '../services/manutencaoService';
import { buscarMotos } from '../services/motoService';
import Cabecalho from '../components/Cabecalho';
import Cartao from '../components/Cartao';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';
import { auth } from '../firebase/config';

const { width } = Dimensions.get('window');
const LARGURA_GRAFICO = width - ESPACAMENTO.md * 4;

// nomes abreviados dos meses
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TelaEstatisticas = () => {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [motos, setMotos] = useState([]);
  const [atualizando, setAtualizando] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState(6); // ultimos 6 meses

  const usuario = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    try {
      const [ab, man, mot] = await Promise.all([
        buscarAbastecimentos(usuario.uid),
        buscarManutencoes(usuario.uid),
        buscarMotos(usuario.uid),
      ]);
      setAbastecimentos(ab);
      setManutencoes(man);
      setMotos(mot);
    } catch (e) {
      console.log('erro ao carregar estatisticas');
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  };

  // agrupa gastos por mes para exibir no grafico
  const dadosPorMes = () => {
    const agora = new Date();
    const meses = [];

    for (let i = periodoSelecionado - 1; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mesAno = `${data.getMonth()}-${data.getFullYear()}`;

      const gastoAb = abastecimentos
        .filter((a) => {
          const d = new Date(a.criadoEm);
          return d.getMonth() === data.getMonth() && d.getFullYear() === data.getFullYear();
        })
        .reduce((acc, a) => acc + (parseFloat(a.valorTotal) || 0), 0);

      const gastoMan = manutencoes
        .filter((m) => {
          const d = new Date(m.criadoEm);
          return d.getMonth() === data.getMonth() && d.getFullYear() === data.getFullYear();
        })
        .reduce((acc, m) => acc + (parseFloat(m.custo) || 0), 0);

      meses.push({
        label: MESES[data.getMonth()],
        abastecimento: gastoAb,
        manutencao: gastoMan,
        total: gastoAb + gastoMan,
      });
    }
    return meses;
  };

  const dados = dadosPorMes();
  const maxValor = Math.max(...dados.map((d) => d.total), 1);

  // totais gerais
  const totalAbastecimento = abastecimentos.reduce((acc, a) => acc + (parseFloat(a.valorTotal) || 0), 0);
  const totalManutencao = manutencoes.reduce((acc, m) => acc + (parseFloat(m.custo) || 0), 0);

  // consumo medio global
  const consumoMedio = () => {
    const comConsumo = abastecimentos.filter((a) => a.consumo);
    if (comConsumo.length === 0) return null;
    return (comConsumo.reduce((acc, a) => acc + parseFloat(a.consumo), 0) / comConsumo.length).toFixed(2);
  };

  const media = consumoMedio();

  return (
    <View style={estilos.container}>
      <Cabecalho titulo="Estatisticas" />
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} />}
      >
        {/* cards de resumo geral */}
        <View style={estilos.resumos}>
          <View style={estilos.resumoCard}>
            <Text style={estilos.resumoNumero}>{motos.length}</Text>
            <Text style={estilos.resumoLabel}>Motos</Text>
          </View>
          <View style={estilos.resumoCard}>
            <Text style={estilos.resumoNumero}>{manutencoes.length}</Text>
            <Text style={estilos.resumoLabel}>Manutencoes</Text>
          </View>
          <View style={estilos.resumoCard}>
            <Text style={estilos.resumoNumero}>{abastecimentos.length}</Text>
            <Text style={estilos.resumoLabel}>Abastec.</Text>
          </View>
          {media && (
            <View style={estilos.resumoCard}>
              <Text style={estilos.resumoNumero}>{media}</Text>
              <Text style={estilos.resumoLabel}>km/L</Text>
            </View>
          )}
        </View>

        {/* totais gerais */}
        <Cartao elevado>
          <Text style={estilos.cardTitulo}>Gastos totais</Text>
          <View style={estilos.totalLinha}>
            <Text style={estilos.totalLabel}>Abastecimentos</Text>
            <Text style={estilos.totalValor}>R$ {totalAbastecimento.toFixed(2)}</Text>
          </View>
          <View style={[estilos.totalLinha, estilos.totalDivisor]}>
            <Text style={estilos.totalLabel}>Manutencoes</Text>
            <Text style={estilos.totalValor}>R$ {totalManutencao.toFixed(2)}</Text>
          </View>
          <View style={[estilos.totalLinha, estilos.totalDivisor]}>
            <Text style={[estilos.totalLabel, { fontWeight: '700', color: CORES.preto }]}>Total geral</Text>
            <Text style={[estilos.totalValor, estilos.totalGeralValor]}>
              R$ {(totalAbastecimento + totalManutencao).toFixed(2)}
            </Text>
          </View>
        </Cartao>

        {/* grafico de barras por mes */}
        <Cartao>
          <View style={estilos.graficoHeader}>
            <Text style={estilos.cardTitulo}>Gastos mensais</Text>
            <View style={estilos.periodoBotoes}>
              {[3, 6, 12].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[estilos.periodoBtn, periodoSelecionado === p && estilos.periodoBtnAtivo]}
                  onPress={() => setPeriodoSelecionado(p)}
                >
                  <Text style={[estilos.periodoBtnTexto, periodoSelecionado === p && estilos.periodoBtnTextoAtivo]}>
                    {p}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* barras do grafico */}
          <View style={estilos.grafico}>
            {dados.map((d, i) => {
              const alturaTotal = (d.total / maxValor) * 120;
              const alturaAb = (d.abastecimento / maxValor) * 120;
              const alturaMan = (d.manutencao / maxValor) * 120;

              return (
                <View key={i} style={estilos.coluna}>
                  <Text style={estilos.valorBarra}>
                    {d.total > 0 ? `${(d.total / 100).toFixed(0)}` : ''}
                  </Text>
                  <View style={estilos.barraContainer}>
                    {/* barra de manutencao */}
                    {alturaMan > 0 && (
                      <View style={[estilos.barraSegmento, estilos.barraMan, { height: alturaMan }]} />
                    )}
                    {/* barra de abastecimento */}
                    {alturaAb > 0 && (
                      <View style={[estilos.barraSegmento, estilos.barraAb, { height: alturaAb }]} />
                    )}
                    {/* barra vazia */}
                    {alturaTotal === 0 && (
                      <View style={[estilos.barraSegmento, estilos.barraVazia, { height: 4 }]} />
                    )}
                  </View>
                  <Text style={estilos.labelMes}>{d.label}</Text>
                </View>
              );
            })}
          </View>

          {/* legenda do grafico */}
          <View style={estilos.legenda}>
            <View style={estilos.legendaItem}>
              <View style={[estilos.legendaCor, estilos.legendaCorAb]} />
              <Text style={estilos.legendaTexto}>Abastecimento</Text>
            </View>
            <View style={estilos.legendaItem}>
              <View style={[estilos.legendaCor, estilos.legendaCorMan]} />
              <Text style={estilos.legendaTexto}>Manutencao</Text>
            </View>
          </View>
        </Cartao>

        {/* distribuicao proporcional de gastos */}
        {(totalAbastecimento + totalManutencao) > 0 && (
          <Cartao>
            <Text style={estilos.cardTitulo}>Distribuicao de gastos</Text>
            <View style={estilos.barraDistribuicao}>
              <View
                style={[
                  estilos.barraDistribuicaoAb,
                  { flex: totalAbastecimento / (totalAbastecimento + totalManutencao) },
                ]}
              />
              <View
                style={[
                  estilos.barraDistribuicaoMan,
                  { flex: totalManutencao / (totalAbastecimento + totalManutencao) },
                ]}
              />
            </View>
            <View style={estilos.distribuicaoLabels}>
              <Text style={estilos.distribuicaoLabel}>
                Abast. {((totalAbastecimento / (totalAbastecimento + totalManutencao)) * 100).toFixed(0)}%
              </Text>
              <Text style={estilos.distribuicaoLabel}>
                Manut. {((totalManutencao / (totalAbastecimento + totalManutencao)) * 100).toFixed(0)}%
              </Text>
            </View>
          </Cartao>
        )}

        {/* consumo por abastecimento */}
        {abastecimentos.filter((a) => a.consumo).length > 0 && (
          <Cartao>
            <Text style={estilos.cardTitulo}>Historico de consumo (km/L)</Text>
            <View style={estilos.consumoLista}>
              {abastecimentos.filter((a) => a.consumo).slice(0, 8).map((a, i) => (
                <View key={i} style={estilos.consumoItem}>
                  <Text style={estilos.consumoData}>
                    {new Date(a.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </Text>
                  <View style={estilos.consumoBarra}>
                    <View
                      style={[
                        estilos.consumoBarraFill,
                        { width: `${Math.min((parseFloat(a.consumo) / 25) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={estilos.consumoValor}>{a.consumo} km/L</Text>
                </View>
              ))}
            </View>
          </Cartao>
        )}
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.cinzaFundo },
  scroll: { padding: ESPACAMENTO.md, paddingBottom: ESPACAMENTO.xxl },
  resumos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACAMENTO.sm, marginBottom: ESPACAMENTO.md },
  resumoCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: CORES.branco,
    borderRadius: BORDA.md,
    padding: ESPACAMENTO.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
  },
  resumoNumero: { fontSize: FONTE.xl, fontWeight: '800', color: CORES.preto },
  resumoLabel: { fontSize: FONTE.xs, color: CORES.cinzaClaro, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  cardTitulo: { fontSize: FONTE.sm, fontWeight: '700', color: CORES.cinzaMedio, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: ESPACAMENTO.md },
  totalLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ESPACAMENTO.xs },
  totalDivisor: { borderTopWidth: 1, borderTopColor: CORES.cinzaBorda, marginTop: ESPACAMENTO.xs },
  totalLabel: { fontSize: FONTE.md, color: CORES.cinzaTexto },
  totalValor: { fontSize: FONTE.md, color: CORES.preto, fontWeight: '600' },
  totalGeralValor: { fontSize: FONTE.lg, fontWeight: '800' },
  graficoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACAMENTO.md },
  periodoBotoes: { flexDirection: 'row', gap: ESPACAMENTO.xs },
  periodoBtn: { paddingHorizontal: ESPACAMENTO.sm, paddingVertical: ESPACAMENTO.xs, borderRadius: BORDA.full, borderWidth: 1, borderColor: CORES.cinzaBorda },
  periodoBtnAtivo: { backgroundColor: CORES.preto, borderColor: CORES.preto },
  periodoBtnTexto: { fontSize: FONTE.xs, color: CORES.cinzaClaro, fontWeight: '600' },
  periodoBtnTextoAtivo: { color: CORES.branco },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 150, marginBottom: ESPACAMENTO.sm },
  coluna: { alignItems: 'center', flex: 1 },
  valorBarra: { fontSize: 9, color: CORES.cinzaClaro, marginBottom: 2 },
  barraContainer: { flexDirection: 'column-reverse', alignItems: 'center', width: '70%' },
  barraSegmento: { width: '100%', borderRadius: 2 },
  barraAb: { backgroundColor: CORES.preto },
  barraMan: { backgroundColor: CORES.cinzaClaro },
  barraVazia: { backgroundColor: CORES.cinzaBorda },
  labelMes: { fontSize: FONTE.xs, color: CORES.cinzaClaro, marginTop: ESPACAMENTO.xs },
  legenda: { flexDirection: 'row', justifyContent: 'center', gap: ESPACAMENTO.lg, marginTop: ESPACAMENTO.sm },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: ESPACAMENTO.xs },
  legendaCor: { width: 10, height: 10, borderRadius: 2 },
  legendaCorAb: { backgroundColor: CORES.preto },
  legendaCorMan: { backgroundColor: CORES.cinzaClaro },
  legendaTexto: { fontSize: FONTE.xs, color: CORES.cinzaTexto },
  barraDistribuicao: { flexDirection: 'row', height: 16, borderRadius: BORDA.full, overflow: 'hidden', marginBottom: ESPACAMENTO.xs },
  barraDistribuicaoAb: { backgroundColor: CORES.preto },
  barraDistribuicaoMan: { backgroundColor: CORES.cinzaClaro },
  distribuicaoLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  distribuicaoLabel: { fontSize: FONTE.xs, color: CORES.cinzaClaro },
  consumoLista: { gap: ESPACAMENTO.xs },
  consumoItem: { flexDirection: 'row', alignItems: 'center', gap: ESPACAMENTO.sm },
  consumoData: { fontSize: FONTE.xs, color: CORES.cinzaClaro, width: 40, textTransform: 'capitalize' },
  consumoBarra: { flex: 1, height: 6, backgroundColor: CORES.cinzaFundo, borderRadius: BORDA.full, overflow: 'hidden' },
  consumoBarraFill: { height: '100%', backgroundColor: CORES.preto, borderRadius: BORDA.full },
  consumoValor: { fontSize: FONTE.xs, color: CORES.preto, fontWeight: '600', width: 60, textAlign: 'right' },
});

export default TelaEstatisticas;
