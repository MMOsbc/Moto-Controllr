// services/firebase.js
// Inicialização do Firebase para o MotoControllr
// Compatível com Expo Go SDK 52 usando firebase@10.x (modular API)

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// chaves do fire base
const firebaseConfig = {
  apiKey: "AIzaSyC6_1V0F0s5SXbzaNqPl6F6gDS1_ksIv1s",
  authDomain: "moto-controllr-dados.firebaseapp.com",
  databaseURL: "https://moto-controllr-dados-default-rtdb.firebaseio.com",
  projectId: "moto-controllr-dados",
  storageBucket: "moto-controllr-dados.firebasestorage.app",
  messagingSenderId: "1048828571484",
  appId: "1:1048828571484:web:20744292915c2bab509b99",
  measurementId: "G-8BYQXZFJRE"
};

// Evita reinicializar se o app já foi iniciado (hot reload do Expo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth com persistência via AsyncStorage (necessário para React Native / Expo Go)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore — banco de dados em nuvem
export const db = getFirestore(app);

export default app;
