// App.js — Ponto de entrada do aplicativo
// IMPORTANTE: 'react-native-gesture-handler' deve ser importado primeiro
import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
