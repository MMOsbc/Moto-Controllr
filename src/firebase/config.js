// configuracao do firebase - inicializacao e exportacao dos servicos
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// credenciais do projeto firebase - substituir pelas suas
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "motoapp-XXXXX.firebaseapp.com",
  projectId: "motoapp-XXXXX",
  storageBucket: "motoapp-XXXXX.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXX"
};

// inicializa o app firebase
const app = initializeApp(firebaseConfig);

// exporta os servicos utilizados no projeto
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
