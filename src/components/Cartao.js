// componente de cartao reutilizavel para exibir informacoes
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CORES, ESPACAMENTO, BORDA } from '../utils/tema';

const Cartao = ({ children, estilo, elevado = false }) => {
  return (
    <View style={[estilos.cartao, elevado && estilos.elevado, estilo]}>
      {children}
    </View>
  );
};

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: CORES.branco,
    borderRadius: BORDA.lg,
    padding: ESPACAMENTO.md,
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
    marginBottom: ESPACAMENTO.md,
  },
  elevado: {
    shadowColor: CORES.preto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default Cartao;
