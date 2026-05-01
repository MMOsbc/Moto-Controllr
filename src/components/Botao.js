// componente de botao reutilizavel com variantes visuais
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CORES, ESPACAMENTO, FONTE, BORDA } from '../utils/tema';

const Botao = ({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  estilo,
}) => {
  // define os estilos com base na variante selecionada
  const estiloContainer = [
    estilos.base,
    variante === 'primario' && estilos.primario,
    variante === 'secundario' && estilos.secundario,
    variante === 'perigo' && estilos.perigo,
    variante === 'fantasma' && estilos.fantasma,
    (desabilitado || carregando) && estilos.desabilitado,
    estilo,
  ];

  const estiloTexto = [
    estilos.texto,
    variante === 'secundario' && estilos.textoSecundario,
    variante === 'fantasma' && estilos.textoFantasma,
    variante === 'perigo' && estilos.textoPerigo,
  ];

  return (
    <TouchableOpacity
      style={estiloContainer}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.7}
    >
      {carregando ? (
        <ActivityIndicator
          color={variante === 'primario' ? CORES.branco : CORES.preto}
          size="small"
        />
      ) : (
        <Text style={estiloTexto}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  base: {
    paddingVertical: ESPACAMENTO.md,
    paddingHorizontal: ESPACAMENTO.lg,
    borderRadius: BORDA.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primario: {
    backgroundColor: CORES.preto,
  },
  secundario: {
    backgroundColor: CORES.branco,
    borderWidth: 1.5,
    borderColor: CORES.preto,
  },
  perigo: {
    backgroundColor: CORES.branco,
    borderWidth: 1.5,
    borderColor: CORES.erro,
  },
  fantasma: {
    backgroundColor: 'transparent',
  },
  desabilitado: {
    opacity: 0.4,
  },
  texto: {
    color: CORES.branco,
    fontSize: FONTE.md,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textoSecundario: {
    color: CORES.preto,
  },
  textoFantasma: {
    color: CORES.cinzaMedio,
  },
  textoPerigo: {
    color: CORES.erro,
  },
});

export default Botao;
