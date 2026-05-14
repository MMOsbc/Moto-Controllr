// screens/DashboardScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation, DrawerActions } from '@react-navigation/native';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { carregarDados } from '../services/storage';
import { useAuth } from '../context/AuthContext';
// tela inicial do app, vai mostrar os graficos, gastos e acesso aos outros modulos
const LARGURA = Dimensions.get('window').width - 32;
const C = { branco: '#FFFFFF', cinzaClaro: '#F5F5F5', borda: '#E0E0E0', medio: '#888888', escuro: '#444444', preto: '#111111' };

// grafico de pizza distribuicao de gastos
const CORES_PIZZA = ['#111111', '#a95656', '#333fb1', '#bcf044', '#9ff0fe'];

function IconeMenu() {
  return (
    <View style={{ gap: 5, padding: 4 }}>
      <View style={{ width: 22, height: 2, backgroundColor: C.preto, borderRadius: 2 }} />
      <View style={{ width: 16, height: 2, backgroundColor: C.preto, borderRadius: 2 }} />
      <View style={{ width: 22, height: 2, backgroundColor: C.preto, borderRadius: 2 }} />
    </View>
  );
}

// ─── Gráfico de pizza: gastos por categoria ───────────────────────────────────
function GraficoPizza({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <View style={es.grafVazio}>
        <Text style={es.grafVazioTexto}>Sem dados suficientes</Text>
      </View>
    );
  }

  const total = dados.reduce((s, d) => s + d.y, 0);

  return (
    <View style={es.grafContainer}>
      <VictoryPie
        data={dados}
        width={LARGURA}
        height={220}
        colorScale={CORES_PIZZA}
        innerRadius={55}
        padAngle={2}
        labels={({ datum }) => `${Math.round((datum.y / total) * 100)}%`}
        labelRadius={({ innerRadius }) => innerRadius + 32}
        style={{
          labels: { fill: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
        }}
        animate={{ duration: 600, easing: 'exp' }}
      />
      {/* Legenda manual */}
      <View style={es.legenda}>
        {dados.map((item, i) => (
          <View key={i} style={es.legendaItem}>
            <View style={[es.legendaCor, { backgroundColor: CORES_PIZZA[i % CORES_PIZZA.length] }]} />
            <Text style={es.legendaTexto}>{item.x}</Text>
            <Text style={es.legendaValor}>R$ {item.y.toFixed(2).replace('.', ',')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Gráfico de barras: gastos por mês ───────────────────────────────────────
function GraficoBarras({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <View style={es.grafVazio}>
        <Text style={es.grafVazioTexto}>Sem dados suficientes</Text>
      </View>
    );
  }

  return (
    <View style={es.grafContainer}>
      <VictoryChart
        width={LARGURA}
        height={200}
        domainPadding={{ x: 16 }}
        padding={{ top: 20, bottom: 40, left: 52, right: 16 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fill: '#888888', fontSize: 10 },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fill: '#888888', fontSize: 9 },
            grid: { stroke: '#F0F0F0', strokeDasharray: '4' },
          }}
        />
        <VictoryBar
          data={dados}
          style={{ data: { fill: '#111111', borderRadius: 4 } }}
          cornerRadius={{ top: 4 }}
          animate={{ duration: 600, easing: 'exp' }}
          labels={({ datum }) => datum.y > 0 ? `${(datum.y / 1000).toFixed(1)}k` : ''}
          labelComponent={<VictoryLabel style={{ fill: '#888888', fontSize: 8 }} dy={-6} />}
        />
      </VictoryChart>
    </View>
  );
}

// ─── Gráfico de linha de tendência de abastecimento ───────────────────────────
function GraficoLinha({ dados }) {
  if (!dados || dados.length < 2) {
    return (
      <View style={es.grafVazio}>
        <Text style={es.grafVazioTexto}>Adicione ao menos 2 abastecimentos</Text>
      </View>
    );
  }

  return (
    <View style={es.grafContainer}>
      <VictoryChart
        width={LARGURA}
        height={180}
        padding={{ top: 16, bottom: 40, left: 52, right: 16 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fill: '#888888', fontSize: 9 },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={v => `R$${v.toFixed(0)}`}
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fill: '#888888', fontSize: 9 },
            grid: { stroke: '#F0F0F0', strokeDasharray: '4' },
          }}
        />
        <VictoryBar
          data={dados}
          style={{ data: { fill: '#444444' } }}
          cornerRadius={{ top: 3 }}
          animate={{ duration: 500 }}
        />
      </VictoryChart>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { usuario, motoAtiva } = useAuth();
  const navigation = useNavigation();

  const [totalGastos, setTotalGastos] = useState(0);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);
  const [atualizando, setAtualizando] = useState(false);

  // Dados dos gráficos
  const [dadosPizza, setDadosPizza] = useState([]);
  const [dadosBarras, setDadosBarras] = useState([]);
  const [dadosAbastecimento, setDadosAbastecimento] = useState([]);

  useFocusEffect(useCallback(() => { carregarResumo(); }, [motoAtiva]));

  function parsarData(dataStr) {
    if (!dataStr) return null;
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
    return null;
  }

  function nomeMes(num) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[num] || '';
  }

  async function carregarResumo() {
    setAtualizando(true);
    const motoId = motoAtiva?.id || null;

    const [manutencoes, abastecimentos, pneus, gastos] = await Promise.all([
      carregarDados('manutencoes', motoId),
      carregarDados('abastecimentos', motoId),
      carregarDados('pneus', motoId),
      carregarDados('gastos', motoId),
    ]);

    // total gasto para moto selecionada atual
    let soma = 0;
    [...manutencoes, ...abastecimentos, ...pneus, ...gastos].forEach(item => {
      soma += parseFloat(item.valor || 0);
    });
    setTotalGastos(soma);

    // ultimos registros de todas categorias
    const todos = [
      ...manutencoes.map(i => ({ ...i, modulo: 'Manutencao' })),
      ...abastecimentos.map(i => ({ ...i, modulo: 'Abastecimento' })),
      ...pneus.map(i => ({ ...i, modulo: 'Pneus' })),
      ...gastos.map(i => ({ ...i, modulo: 'Gasto' })),
    ];
    setUltimosRegistros(todos.slice(-3).reverse());

    // ── Gráfico de pizza: gastos por categoria ──
    const somaManutencao = manutencoes.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
    const somaAbastecimento = abastecimentos.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
    const somaPneus = pneus.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
    const somaGastos = gastos.reduce((s, i) => s + parseFloat(i.valor || 0), 0);

    const pizza = [
      { x: 'Manutencao', y: somaManutencao },
      { x: 'Abastec.', y: somaAbastecimento },
      { x: 'Pneus', y: somaPneus },
      { x: 'Outros', y: somaGastos },
    ].filter(d => d.y > 0);
    setDadosPizza(pizza);

    // ── Gráfico de barras: gastos por mês (últimos 6 meses) ──
    const agora = new Date();
    const mesesMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      mesesMap[chave] = { x: nomeMes(d.getMonth()), y: 0, ordem: 6 - i };
    }

    [...manutencoes, ...abastecimentos, ...pneus, ...gastos].forEach(item => {
      const d = parsarData(item.data);
      if (!d) return;
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      if (mesesMap[chave]) mesesMap[chave].y += parseFloat(item.valor || 0);
    });

    const barras = Object.values(mesesMap).sort((a, b) => a.ordem - b.ordem);
    setDadosBarras(barras);

    // ── Gráfico de abastecimento: preço por litro ao longo do tempo ──
    const abastOrdenados = [...abastecimentos]
      .filter(a => a.valorLitro)
      .sort((a, b) => {
        const da = parsarData(a.data), db = parsarData(b.data);
        return (da || 0) - (db || 0);
      })
      .slice(-8)
      .map((a, i) => ({ x: a.data?.slice(0, 5) || `#${i + 1}`, y: parseFloat(a.valorLitro || 0) }));
    setDadosAbastecimento(abastOrdenados);

    setAtualizando(false);
  }

  function abrirMenu() {
    navigation.dispatch(DrawerActions.openDrawer());
  }

  const temDados = dadosPizza.length > 0 || dadosBarras.some(d => d.y > 0);

  return (
    <View style={es.wrapper}>
      <View style={es.header}>
        <TouchableOpacity onPress={abrirMenu} style={es.botaoMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconeMenu />
        </TouchableOpacity>
        <Text style={es.headerTitulo}>Inicio</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={es.container}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={carregarResumo} tintColor={C.preto} />}
      >
        {/* Saudação */}
        <View style={es.saudacao}>
          {usuario && <Text style={es.saudacaoTexto}>Ola, {usuario.nome.split(' ')[0]}</Text>}
          <Text style={es.saudacaoSub}>Bem-vindo ao MotoManager</Text>
        </View>

        {/* Moto ativa */}
        {motoAtiva ? (
          <View style={es.cardMotoAtiva}>
            <Text style={es.labelMoto}>MOTO ATIVA</Text>
            <Text style={es.nomeMoto}>{motoAtiva.nome}</Text>
            {(motoAtiva.marca || motoAtiva.modelo) && (
              <Text style={es.detalheMoto}>{[motoAtiva.marca, motoAtiva.modelo, motoAtiva.ano].filter(Boolean).join(' · ')}</Text>
            )}
            {motoAtiva.placa ? <Text style={es.detalheMoto}>{motoAtiva.placa}</Text> : null}
          </View>
        ) : (
          <View style={es.semMoto}>
            <Text style={es.semMotoTexto}>Nenhuma moto cadastrada.</Text>
            <Text style={es.semMotoTexto}>Va ate "Motos" e adicione a sua!</Text>
          </View>
        )}

        {/* Total */}
        <View style={es.cardTotal}>
          <Text style={es.labelTotal}>TOTAL GASTO</Text>
          <Text style={es.valorTotal}>R$ {totalGastos.toFixed(2).replace('.', ',')}</Text>
          <Text style={es.dica}>{motoAtiva ? motoAtiva.nome : 'Puxe para atualizar'}</Text>
        </View>

        {/* ── GRÁFICOS ─────────────────────────────────────── */}
        {!temDados ? (
          <View style={es.semDadosGraf}>
            <Text style={es.semDadosTexto}>Adicione registros para ver os graficos</Text>
          </View>
        ) : (
          <>
            {/* Gastos por mês */}
            <Text style={es.secaoTitulo}>Gastos por Mes</Text>
            <View style={es.cardGrafico}>
              <GraficoBarras dados={dadosBarras} />
            </View>

            {/* Distribuição por categoria */}
            {dadosPizza.length > 0 && (
              <>
                <Text style={es.secaoTitulo}>Distribuicao por Categoria</Text>
                <View style={es.cardGrafico}>
                  <GraficoPizza dados={dadosPizza} />
                </View>
              </>
            )}

            {/* Preço do litro ao longo do tempo */}
            {dadosAbastecimento.length >= 2 && (
              <>
                <Text style={es.secaoTitulo}>Preco do Litro (Abastecimentos)</Text>
                <View style={es.cardGrafico}>
                  <GraficoLinha dados={dadosAbastecimento} />
                </View>
              </>
            )}
          </>
        )}

        {/* Últimos registros */}
        <Text style={es.secaoTitulo}>Ultimos Registros</Text>
        {ultimosRegistros.length === 0 ? (
          <View style={es.vazio}>
            <Text style={es.vazioTexto}>Nenhum registro ainda.</Text>
          </View>
        ) : (
          ultimosRegistros.map((item, index) => (
            <View key={index} style={es.cardRegistro}>
              <View style={es.registroEsquerda}>
                <Text style={es.registroModulo}>{item.modulo}</Text>
                <Text style={es.registroTitulo}>{item.descricao || item.tipo || 'Sem descricao'}</Text>
                <Text style={es.registroData}>{item.data || ''}</Text>
              </View>
              {item.valor ? <Text style={es.registroValor}>R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</Text> : null}
            </View>
          ))
        )}

        {/* Módulos */}
        <Text style={es.secaoTitulo}>Modulos</Text>
        <View style={es.gridModulos}>
          {['Manutencao', 'Abastecimento', 'Pneus', 'Gastos', 'Checklist'].map((mod, i) => (
            <TouchableOpacity key={i} style={es.cardModulo} onPress={() => navigation.navigate(mod)}>
              <Text style={es.moduloNome}>{mod}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const es = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  botaoMenu: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  headerTitulo: { color: '#111111', fontSize: 17, fontWeight: '700' },
  container: { flex: 1, padding: 16 },
  saudacao: { marginBottom: 16 },
  saudacaoTexto: { color: '#111111', fontSize: 22, fontWeight: '800' },
  saudacaoSub: { color: '#888888', fontSize: 13, marginTop: 2 },

  cardMotoAtiva: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#111111' },
  labelMoto: { color: '#888888', fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 1.5 },
  nomeMoto: { color: '#111111', fontSize: 20, fontWeight: '700' },
  detalheMoto: { color: '#888888', fontSize: 12, marginTop: 3 },
  semMoto: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  semMotoTexto: { color: '#888888', fontSize: 13, textAlign: 'center' },

  cardTotal: { backgroundColor: '#111111', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  labelTotal: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', opacity: 0.7, letterSpacing: 1.5 },
  valorTotal: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 8 },
  dica: { color: '#FFFFFF', opacity: 0.5, fontSize: 12, marginTop: 6 },

  // Gráficos
  secaoTitulo: { color: '#111111', fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  cardGrafico: { backgroundColor: '#F5F5F5', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' },
  grafContainer: { paddingVertical: 8 },
  grafVazio: { alignItems: 'center', padding: 30 },
  grafVazioTexto: { color: '#AAAAAA', fontSize: 13 },
  semDadosGraf: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  semDadosTexto: { color: '#AAAAAA', fontSize: 13, textAlign: 'center' },

  // Legenda pizza
  legenda: { paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendaCor: { width: 12, height: 12, borderRadius: 3 },
  legendaTexto: { color: '#444444', fontSize: 13, flex: 1 },
  legendaValor: { color: '#111111', fontSize: 13, fontWeight: '700' },

  // Últimos registros
  vazio: { alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5', borderRadius: 12, marginBottom: 20 },
  vazioTexto: { color: '#888888', fontSize: 14, textAlign: 'center' },
  cardRegistro: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 2, borderLeftColor: '#CCCCCC' },
  registroEsquerda: { flex: 1 },
  registroModulo: { color: '#888888', fontSize: 10, fontWeight: '700', marginBottom: 2, letterSpacing: 1 },
  registroTitulo: { color: '#111111', fontSize: 14, fontWeight: '600' },
  registroData: { color: '#888888', fontSize: 11, marginTop: 2 },
  registroValor: { color: '#111111', fontWeight: '700', fontSize: 15 },

  // Módulos
  gridModulos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardModulo: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center', width: '30%', borderWidth: 1, borderColor: '#E0E0E0' },
  moduloNome: { color: '#444444', fontSize: 12, textAlign: 'center', fontWeight: '500' },
});
