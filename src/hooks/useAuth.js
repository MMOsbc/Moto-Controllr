// hook de autenticacao - monitora o estado do usuario logado
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

// retorna o usuario atual e o estado de carregamento
const useAuth = () => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // observa mudancas no estado de autenticacao
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });

    // cancela a assinatura ao desmontar o componente
    return () => unsubscribe();
  }, []);

  return { usuario, carregando };
};

export default useAuth;
