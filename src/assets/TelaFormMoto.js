// tela de cadastro e edicao de motocicletas

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';

import Botao from '../components/Botao';
import { CORES, ESPACAMENTO } from '../utils/tema';

const TelaFormMoto = ({ navigation }) => {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [quilometragem, setQuilometragem] = useState('');

  // salva os dados da motocicleta
  const salvarMoto = () => {
    Alert.alert(
      'sucesso',
      'motocicleta cadastrada com sucesso'
    );

    navigation.goBack();
  };

  return (
    <ScrollView style={estilos.container}>
      <Text style={estilos.titulo}>
        cadastrar motocicleta
      </Text>

      <TextInput
        placeholder="marca"
        style={estilos.input}
        value={marca}
        onChangeText={setMarca}
      />

      <TextInput
        placeholder="modelo"
        style={estilos.input}
        value={modelo}
        onChangeText={setModelo}
      />

      <TextInput
        placeholder="ano"
        style={estilos.input}
        keyboardType="numeric"
        value={ano}
        onChangeText={setAno}
      />

      <TextInput
        placeholder="placa"
        style={estilos.input}
        value={placa}
        onChangeText={setPlaca}
      />

      <TextInput
        placeholder="cor"
        style={estilos.input}
        value={cor}
        onChangeText={setCor}
      />

      <TextInput
        placeholder="quilometragem"
        style={estilos.input}
        keyboardType="numeric"
        value={quilometragem}
        onChangeText={setQuilometragem}
      />

      <Botao
        titulo="salvar motocicleta"
        onPress={salvarMoto}
      />
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.branco,
    padding: ESPACAMENTO.md,
  },

  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: ESPACAMENTO.lg,
  },

  input: {
    borderWidth: 1,
    borderColor: CORES.cinzaBorda,
    padding: 12,
    marginBottom: ESPACAMENTO.md,
    borderRadius: 8,
  },
});

export default TelaFormMoto;