// services/firebaseConfig.js
// inicializa o firebase com autenticacao e banco de dados

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// credenciais do projeto no firebase console
const firebaseConfig = {
  apiKey: 'AIzaSyC6_1V0F0s5SXbzaNqPl6F6gDS1_ksIv1s',
  authDomain: 'moto-controllr-dados.firebaseapp.com',
  projectId: 'moto-controllr-dados',
  storageBucket: 'moto-controllr-dados.firebasestorage.app',
  messagingSenderId: '1048828571484',
  appId: '1:1048828571484:web:20744292915c2bab509b99',
  measurementId: 'G-8BYQXZFJRE',
};

// inicializa o app do firebase
const app = initializeApp(firebaseConfig);

// inicializa autenticacao com persistencia via asyncstorage
// isso faz o usuario continuar logado mesmo ao fechar o app
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// instancia do banco de dados firestore
const db = getFirestore(app);

export { auth, db };
