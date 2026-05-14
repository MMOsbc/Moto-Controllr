// context/AuthContext.js


import React, { createContext, useContext, useState, useEffect } from 'react';
import { obterSessao } from '../services/auth';
import { obterMotoAtiva } from '../services/motos';

const AuthContext = createContext(null);

// hook para acessar o contexto em qualquer tela
export function useAuth() {
  return useContext(AuthContext);
}

// provider que envolve o app inteiro
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [motoAtiva, setMotoAtiva] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verifica sessão ao iniciar o app
  useEffect(() => {
    verificarSessao();
  }, []);

  async function verificarSessao() {
    try {
      const sessao = await obterSessao();
      if (sessao) {
        setUsuario(sessao);
        const moto = await obterMotoAtiva(sessao.id);
        setMotoAtiva(moto);
      }
    } catch (erro) {
      console.error('Erro ao verificar sessão:', erro);
    } finally {
      setCarregando(false);
    }
  }

  // funcao acionada apos login feito
  async function entrar(usuarioLogado) {
    setUsuario(usuarioLogado);
    const moto = await obterMotoAtiva(usuarioLogado.id);
    setMotoAtiva(moto);
  }

  // chamada para desfazer as info do antigo usuario ao sair do app
  function sair() {
    setUsuario(null);
    setMotoAtiva(null);
  }

  // funcao para atualizar quando a moto for trocada na parte de ativacao ou quando criar a primeira moto
  async function atualizarMotoAtiva() {
    if (!usuario) return;
    const moto = await obterMotoAtiva(usuario.id);
    setMotoAtiva(moto);
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      motoAtiva,
      carregando,
      entrar,
      sair,
      atualizarMotoAtiva,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
