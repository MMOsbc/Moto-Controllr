// components/MarcaSelect.js
// selecao de marcas na pag de cadastro

import React, { useState } from 'react'; // formato da selecao
import {
  View,
  Text, 
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
// lista de marcas
export const MARCAS_MOTO = [
  { label: 'Honda', emoji: '🏍️' },
  { label: 'Yamaha', emoji: '🏍️' },
  { label: 'Suzuki', emoji: '🏍️' },
  { label: 'Kawasaki', emoji: '🏍️' },
  { label: 'BMW', emoji: '🏍️' },
  { label: 'Harley-Davidson', emoji: '🏍️' },
  { label: 'Dafra', emoji: '🏍️' },
  { label: 'Shineray', emoji: '🏍️' },
  { label: 'Triumph', emoji: '🏍️' },
  { label: 'Royal Enfield', emoji: '🏍️' },
  { label: 'KTM', emoji: '🏍️' },
  { label: 'Bajaj', emoji: '🏍️' },
  { label: 'Ducati', emoji: '🏍️' },
  { label: 'Haojue', emoji: '🏍️' },
  { label: 'Kasinski', emoji: '🏍️' },
  { label: 'Outra', emoji: '🏍️' },
];



// funcao para validar a marca selecionada
export default function MarcaSelect({ marcaSelecionada, onSelecionar, erro }) {
  const [modalVisivel, setModalVisivel] = useState(false);

  const temErro = !!erro;

  return (
    <View style={estilos.container}>
      <TouchableOpacity
        style={[estilos.selector, temErro && estilos.selectorErro]}
        onPress={() => setModalVisivel(true)}
        activeOpacity={0.8}
      >
        <Text style={marcaSelecionada ? estilos.selectorTexto : estilos.selectorPlaceholder}>
          {marcaSelecionada ? `🏍️  ${marcaSelecionada}` : 'Selecione a marca *'}
        </Text>
        <Text style={estilos.chevron}>▾</Text>
      </TouchableOpacity>

      {temErro && (
        <Text style={estilos.textoErro}>⚠ {erro}</Text>
      )}

      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableOpacity
          style={estilos.overlay}
          activeOpacity={1}
          onPress={() => setModalVisivel(false)}
        >
          <View style={estilos.modal}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Marca da Moto</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Text style={estilos.fechar}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={MARCAS_MOTO}
              keyExtractor={item => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    estilos.opcao,
                    item.label === marcaSelecionada && estilos.opcaoAtiva,
                  ]}
                  onPress={() => {
                    onSelecionar(item.label);
                    setModalVisivel(false);
                  }}
                >
                  <Text style={estilos.opcaoEmoji}>{item.emoji}</Text>
                  <Text style={[
                    estilos.opcaoTexto,
                    item.label === marcaSelecionada && estilos.opcaoTextoAtivo,
                  ]}>
                    {item.label}
                  </Text>
                  {item.label === marcaSelecionada && (
                    <Text style={estilos.check}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
// estilo css 
const estilos = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  selector: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  selectorErro: {
    borderColor: '#e94560',
    borderWidth: 1.5,
  },
  selectorTexto: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  chevron: {
    color: '#aaa',
    fontSize: 16,
    marginLeft: 8,
  },
  textoErro: {
    color: '#e94560',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  modalTitulo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fechar: {
    color: '#aaa',
    fontSize: 18,
    padding: 4,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  opcaoAtiva: {
    backgroundColor: '#0f3460',
  },
  opcaoEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  opcaoTexto: {
    color: '#ccc',
    fontSize: 15,
    flex: 1,
  },
  opcaoTextoAtivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  check: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
