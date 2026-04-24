// screens/DashboardScreen.js
// tela de resumo geral com totais e ultimos registros
// tambem exibe o botao de sair da conta

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { carregarItens } from '../services/storage';
import colors from '../services/colors';

export default function DashboardScreen({ usuario }) {
  // totais calculados a partir dos dados do firebase
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalAbastecimentos, setTotalAbastecimentos] = useState(0);
  const [totalMotos, setTotalMotos] = useState(0);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // carrega o resumo ao montar a tela
  useEffect(() => {
    carregarResumo();
  }, []);

  // busca dados de todas as colecoes e calcula totais
  async function carregarResumo() {
    setCarregando(true);

    // carrega todas as colecoes em paralelo para o uid do usuario
    const [gastos, abastecimentos, manutencoes, pneus, motos] =
      await Promise.all([
        carregarItens('gastos', usuario.uid),
        carregarItens('abastecimentos', usuario.uid),
        carregarItens('manutencoes', usuario.uid),
        carregarItens('pneus', usuario.uid),
        carregarItens('motos', usuario.uid),
      ]);

    // soma total de gastos gerais
    setTotalGastos(
      gastos.reduce((acc, i) => acc + parseFloat(i.valor || 0), 0)
    );
    // soma total de abastecimentos
    setTotalAbastecimentos(
      abastecimentos.reduce((acc, i) => acc + parseFloat(i.valor || 0), 0)
    );
    // total de motos cadastradas
    setTotalMotos(motos.length);

    // mescla todos os registros e pega os 3 mais recentes
    const todos = [
      ...gastos.map((i) => ({ ...i, tipo: 'Gasto' })),
      ...abastecimentos.map((i) => ({ ...i, tipo: 'Abastecimento' })),
      ...manutencoes.map((i) => ({ ...i, tipo: 'Manutencao' })),
      ...pneus.map((i) => ({ ...i, tipo: 'Pneu' })),
    ];
    setUltimosRegistros(
      todos.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0)).slice(0, 3)
    );

    setCarregando(false);
  }

  // faz logout do firebase auth
  async function fazerLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        onPress: async () => {
          await signOut(auth);
          // o onAuthStateChanged no App.js redireciona para o login
        },
      },
    ]);
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={carregando} onRefresh={carregarResumo} />
      }
    >
      {/* cabecalho com boas-vindas e botao de sair */}
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.bemVindo}>
            Ola, {usuario.displayName || 'Usuario'}
          </Text>
          <Text style={styles.bemVindoSub}>Puxe para atualizar</Text>
        </View>
        <TouchableOpacity style={styles.btnSair} onPress={fazerLogout}>
          <Text style={styles.btnSairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* linha divisora */}
      <View style={styles.divisor} />

      {/* cards de totais */}
      <View style={styles.cardsGrid}>
        <View style={styles.card}>
          <Text style={styles.cardValor}>{totalMotos}</Text>
          <Text style={styles.cardLabel}>Motos</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValor}>
            R$ {(totalGastos + totalAbastecimentos).toFixed(2)}
          </Text>
          <Text style={styles.cardLabel}>Total investido</Text>
        </View>
      </View>

      <View style={styles.cardsGrid}>
        <View style={styles.card}>
          <Text style={styles.cardValor}>R$ {totalGastos.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Gastos gerais</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValor}>
            R$ {totalAbastecimentos.toFixed(2)}
          </Text>
          <Text style={styles.cardLabel}>Abastecimentos</Text>
        </View>
      </View>

      {/* ultimos 3 registros */}
      <Text style={styles.secaoTitulo}>Ultimos registros</Text>

      {ultimosRegistros.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioTexto}>Nenhum registro encontrado.</Text>
          <Text style={styles.vazioSub}>Adicione dados nas outras abas.</Text>
        </View>
      ) : (
        ultimosRegistros.map((item, index) => (
          <View key={index} style={styles.registroCard}>
            <Text style={styles.registroTipo}>{item.tipo}</Text>
            <Text style={styles.registroDescricao}>
              {item.descricao || item.tipo}
            </Text>
            {item.valor ? (
              <Text style={styles.registroValor}>
                R$ {parseFloat(item.valor).toFixed(2)}
              </Text>
            ) : null}
            <Text style={styles.registroData}>{item.data || ''}</Text>
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  bemVindo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bemVindoSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  btnSair: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnSairTexto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  divisor: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardValor: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secaoTitulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  registroCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  registroTipo: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  registroDescricao: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  registroValor: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  registroData: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  vazio: {
    alignItems: 'center',
    padding: 32,
  },
  vazioTexto: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  vazioSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
