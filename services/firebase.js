// services/firebase.js
// Inicialização do Firebase para o MotoControllr
// Compatível com Expo Go SDK 52 usando firebase@10.x (modular API)

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// chaves do fire base
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
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
