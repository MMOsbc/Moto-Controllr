// components/ItemCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ItemCard({ titulo, subtitulo, valor, onRemover, sigla }) {
  return (
    <View style={es.card}>
      <View style={es.esquerda}>
        <View style={es.siglaBox}>
          <Text style={es.siglaTexto}>{sigla || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={es.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={es.subtitulo}>{subtitulo}</Text> : null}
        </View>
      </View>
      <View style={es.direita}>
        {valor ? <Text style={es.valor}>{valor}</Text> : null}
        {onRemover ? (
          <TouchableOpacity onPress={onRemover} style={es.botaoRemover}>
            <Text style={es.textoRemover}>X</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const es = StyleSheet.create({
  card: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 2, borderLeftColor: '#CCCCCC', borderWidth: 1, borderColor: '#E0E0E0' },
  esquerda: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  siglaBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  siglaTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  titulo: { color: '#111111', fontWeight: '700', fontSize: 15 },
  subtitulo: { color: '#888888', fontSize: 12, marginTop: 2 },
  direita: { alignItems: 'flex-end' },
  valor: { color: '#111111', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  botaoRemover: { backgroundColor: '#444444', borderRadius: 13, width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  textoRemover: { color: '#FFFFFF', fontWeight: '800', fontSize: 10 },
});
