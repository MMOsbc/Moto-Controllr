// components/ItemCard.js
// card reutilizavel para exibir um registro com botao de excluir
// sem emoji, apenas texto e cores preto e branco

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../services/colors';

// props:
//   titulo    - texto principal
//   subtitulo - texto secundario
//   info      - valor ou dado de destaque
//   onExcluir - funcao chamada ao pressionar excluir
export default function ItemCard({ titulo, subtitulo, info, onExcluir }) {
  return (
    <View style={styles.card}>
      <View style={styles.conteudo}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
      {onExcluir && (
        <TouchableOpacity style={styles.btnExcluir} onPress={onExcluir}>
          <Text style={styles.btnExcluirTexto}>Excluir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginVertical: 5,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  conteudo: {
    flex: 1,
  },
  titulo: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  info: {
    color: colors.text,
    fontSize: 13,
    marginTop: 3,
    fontWeight: '600',
  },
  btnExcluir: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  btnExcluirTexto: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
