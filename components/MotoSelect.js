// components/MotoSelect.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image } from 'react-native';
import { listarMotos } from '../services/motos';
import { useAuth } from '../context/AuthContext';
// pega a foto da moto que foi incluida no cadastro
function IconeMotoSelect({ moto }) {
  if (moto.foto) {
    return <Image source={{ uri: moto.foto }} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 12 }} />;
  }
  return (
    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
        {(moto.modelo || moto.nome || 'M')[0].toUpperCase()}
      </Text>
    </View>
  );
}
// funcao da selecao da moto ja cadastrada
export default function MotoSelect({ motoSelecionadaId, onSelecionar, erro, obrigatorio }) {
  const { usuario } = useAuth();
  const [motos, setMotos] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [motoSelecionada, setMotoSelecionada] = useState(null);

  useEffect(() => { carregarMotos(); }, []);

  useEffect(() => {
    if (motoSelecionadaId && motos.length > 0) {
      const moto = motos.find(m => m.id === motoSelecionadaId);
      setMotoSelecionada(moto || null);
    }
  }, [motoSelecionadaId, motos]);

  async function carregarMotos() {
    if (!usuario) return;
    const lista = await listarMotos(usuario.id);
    setMotos(lista);
  }

  function formatarLabel(moto) {
    const modelo = moto.modelo || moto.nome || '---';
    const placa = moto.placa || 'Sem placa';
    return `${modelo} - ${placa}`;
  }

  function handleSelecionar(moto) {
    setMotoSelecionada(moto);
    onSelecionar(moto);
    setModalVisivel(false);
  }
  // apos selecionar a moto retorna as caracteristicas dela 
  return (               
    <View style={es.container}>
      <TouchableOpacity
        style={[es.selector, !!erro && es.selectorErro]}
        onPress={() => setModalVisivel(true)}
        activeOpacity={0.8}
      >
        {motoSelecionada && motoSelecionada.foto ? (
          <Image source={{ uri: motoSelecionada.foto }} style={{ width: 24, height: 24, borderRadius: 5, marginRight: 8 }} />
        ) : null}
        <Text style={motoSelecionada ? es.selectorTexto : es.selectorPlaceholder}>
          {motoSelecionada ? formatarLabel(motoSelecionada) : `Selecione a moto${obrigatorio ? ' *' : ''}`}
        </Text>
        <Text style={es.chevron}>▾</Text>
      </TouchableOpacity>

      {!!erro && <Text style={es.textoErro}>{erro}</Text>}

      <Modal visible={modalVisivel} transparent animationType="slide" onRequestClose={() => setModalVisivel(false)}>
        <TouchableOpacity style={es.overlay} activeOpacity={1} onPress={() => setModalVisivel(false)}>
          <View style={es.modal}>
            <View style={es.modalHeader}>
              <Text style={es.modalTitulo}>Selecionar Moto</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Text style={es.fechar}>X</Text>
              </TouchableOpacity>
            </View>

            {motos.length === 0 ? (
              <View style={es.semMotos}>
                <Text style={es.semMotosTexto}>Nenhuma moto cadastrada.{'\n'}Adicione uma moto primeiro!</Text>
              </View>
            ) : (
              <FlatList
                data={motos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[es.opcao, item.id === motoSelecionadaId && es.opcaoAtiva]}
                    onPress={() => handleSelecionar(item)}
                  >
                    <IconeMotoSelect moto={item} />
                    <View style={{ flex: 1 }}>
                      <Text style={es.opcaoModelo}>{item.modelo || item.nome || '---'}</Text>
                      <Text style={es.opcaoPlaca}>{item.placa || 'Sem placa'}{item.marca ? ` · ${item.marca}` : ''}</Text>
                    </View>
                    {item.id === motoSelecionadaId && <Text style={es.check}>OK</Text>}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
// estilo css
const es = StyleSheet.create({
  container: { marginBottom: 4 },
  selector: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0' },
  selectorErro: { borderColor: '#111111', borderWidth: 2 },
  selectorTexto: { color: '#111111', fontSize: 14, flex: 1, fontWeight: '500' },
  selectorPlaceholder: { color: '#AAAAAA', fontSize: 14, flex: 1 },
  chevron: { color: '#888888', fontSize: 16, marginLeft: 8 },
  textoErro: { color: '#444444', fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitulo: { color: '#111111', fontWeight: '700', fontSize: 16 },
  fechar: { color: '#888888', fontSize: 16, fontWeight: '700', padding: 4 },
  opcao: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  opcaoAtiva: { backgroundColor: '#F5F5F5' },
  opcaoIcone: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opcaoIconeLetra: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  opcaoModelo: { color: '#111111', fontWeight: '700', fontSize: 15 },
  opcaoPlaca: { color: '#888888', fontSize: 12, marginTop: 2 },
  check: { color: '#111111', fontSize: 12, fontWeight: '800', backgroundColor: '#EEEEEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  semMotos: { padding: 32, alignItems: 'center' },
  semMotosTexto: { color: '#888888', textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
