// componente de cabecalho das telas com titulo e botao opcional
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CORES, ESPACAMENTO, FONTE } from '../utils/tema';

const Cabecalho = ({ titulo, subtitulo, aoVoltar, acaoDireita }) => {
  return (
    <View style={estilos.container}>
      <View style={estilos.linha}>
        {aoVoltar ? (
          <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltar}>
            <Text style={estilos.setaVoltar}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={estilos.espacador} />
        )}
        <View style={estilos.centro}>
          <Text style={estilos.titulo}>{titulo}</Text>
        </View>
        {acaoDireita ? (
          <View style={estilos.acaoDireita}>{acaoDireita}</View>
        ) : (
          <View style={estilos.espacador} />
        )}
      </View>
      {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    paddingHorizontal: ESPACAMENTO.md,
    paddingVertical: ESPACAMENTO.md,
    backgroundColor: CORES.branco,
    borderBottomWidth: 1,
    borderBottomColor: CORES.cinzaBorda,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setaVoltar: {
    fontSize: FONTE.xl,
    color: CORES.preto,
    fontWeight: '300',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    fontSize: FONTE.lg,
    fontWeight: '700',
    color: CORES.preto,
    letterSpacing: 0.3,
  },
  subtitulo: {
    fontSize: FONTE.sm,
    color: CORES.cinzaClaro,
    textAlign: 'center',
    marginTop: ESPACAMENTO.xs,
  },
  acaoDireita: {
    width: 40,
    alignItems: 'flex-end',
  },
  espacador: {
    width: 40,
  },
});

export default Cabecalho;
