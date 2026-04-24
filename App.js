// App.js
// ponto de entrada do app
// verifica se o usuario esta logado e redireciona para a tela correta

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import colors from './services/colors';

export default function App() {
  // usuario logado ou null
  const [usuario, setUsuario] = useState(null);

  // true enquanto verifica se o usuario ja esta logado
  const [verificando, setVerificando] = useState(true);

  // escuta mudancas no estado de autenticacao do firebase
  // dispara quando o usuario loga ou desloga
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setVerificando(false);
    });
    // cancela o listener quando o componente for desmontado
    return cancelar;
  }, []);

  // exibe spinner enquanto o firebase verifica a sessao
  if (verificando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.background} />
      {/* exibe telas de auth ou telas principais conforme o login */}
      {usuario ? (
        <AppNavigator usuario={usuario} />
      ) : (
        <AuthNavigator />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
