// configuracao de navegacao do aplicativo - stack e tab navigator
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import useAuth from '../hooks/useAuth';

// telas de autenticacao
import TelaLogin from '../screens/TelaLogin';
import TelaCadastro from '../screens/TelaCadastro';

// telas principais
import TelaDashboard from '../screens/TelaDashboard';
import TelaMotos from '../screens/TelaMotos';
import TelaFormMoto from '../screens/TelaFormMoto';
import TelaManutencoes from '../screens/TelaManutencoes';
import TelaAbastecimentos from '../screens/TelaAbastecimentos';
import TelaChecklist from '../screens/TelaChecklist';
import TelaOficinas from '../screens/TelaOficinas';
import TelaEstatisticas from '../screens/TelaEstatisticas';
import TelaPerfil from '../screens/TelaPerfil';

import { CORES, FONTE, ESPACAMENTO } from '../utils/tema';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// icones de texto simples para a tab bar (sem biblioteca externa)
const iconeTab = (nome, focado) => {
  const icones = {
    Inicio: focado ? '[=]' : '[ ]',
    Motos: focado ? '[M]' : 'M',
    Manutencoes: focado ? '[F]' : 'F',
    Abastecimentos: focado ? '[A]' : 'A',
    Mais: focado ? '[+]' : '+',
  };

  return (
    <Text style={[estilos.icone, focado && estilos.iconeFocado]}>
      {icones[nome] || nome[0]}
    </Text>
  );
};

// navegador de abas principais do app
const NavegadorAbas = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: estilos.tabBar,
        tabBarActiveTintColor: CORES.preto,
        tabBarInactiveTintColor: CORES.cinzaClaro,
        tabBarLabelStyle: estilos.tabLabel,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={TelaDashboard}
        options={{
          tabBarIcon: ({ focused }) =>
            iconeTab('Inicio', focused),
        }}
      />

      <Tab.Screen
        name="Motos"
        component={TelaMotos}
        options={{
          tabBarIcon: ({ focused }) =>
            iconeTab('Motos', focused),
        }}
      />

      <Tab.Screen
        name="Abastecimentos"
        component={TelaAbastecimentos}
        options={{
          tabBarLabel: 'Combustivel',
          tabBarIcon: ({ focused }) =>
            iconeTab('Abastecimentos', focused),
        }}
      />

      <Tab.Screen
        name="Checklist"
        component={TelaChecklist}
        options={{
          tabBarIcon: ({ focused }) =>
            iconeTab('Mais', focused),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={TelaPerfil}
        options={{
          tabBarIcon: ({ focused }) =>
            iconeTab('Mais', focused),
        }}
      />
    </Tab.Navigator>
  );
};

// navegador principal que controla o fluxo de autenticacao
const Navegacao = () => {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            {/* telas do app principal apos login */}
            <Stack.Screen
              name="Principal"
              component={NavegadorAbas}
            />

            <Stack.Screen
              name="FormMoto"
              component={TelaFormMoto}
            />

            <Stack.Screen
              name="Manutencoes"
              component={TelaManutencoes}
            />

            <Stack.Screen
              name="FormManutencao"
              component={TelaManutencoes}
            />

            <Stack.Screen
              name="FormAbastecimento"
              component={TelaAbastecimentos}
            />

            <Stack.Screen
              name="Oficinas"
              component={TelaOficinas}
            />

            <Stack.Screen
              name="Estatisticas"
              component={TelaEstatisticas}
            />
          </>
        ) : (
          <>
            {/* telas de autenticacao */}
            <Stack.Screen
              name="Login"
              component={TelaLogin}
            />

            <Stack.Screen
              name="Cadastro"
              component={TelaCadastro}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const estilos = StyleSheet.create({
  tabBar: {
    backgroundColor: CORES.branco,
    borderTopWidth: 1,
    borderTopColor: CORES.cinzaBorda,
    height: 60,
    paddingBottom: ESPACAMENTO.xs,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  icone: {
    fontSize: 16,
    color: CORES.cinzaClaro,
  },

  iconeFocado: {
    color: CORES.preto,
  },
});

export default Navegacao;