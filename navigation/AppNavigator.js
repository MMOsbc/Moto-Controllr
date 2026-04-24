// navigation/AppNavigator.js
// navegacao principal do app apos o login
// exibe as abas: motos, manutencao, abastecimento, pneus, gastos, checklist

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import colors from '../services/colors';

// importa todas as telas principais
import MotosScreen from '../screens/MotosScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ManutencaoScreen from '../screens/ManutencaoScreen';
import AbastecimentoScreen from '../screens/AbastecimentoScreen';
import PneusScreen from '../screens/PneusScreen';
import GastosScreen from '../screens/GastosScreen';
import ChecklistScreen from '../screens/ChecklistScreen';

const Tab = createBottomTabNavigator();

// icones em texto simples para cada aba (sem emoji)
const ICONES = {
  Motos: 'M',
  Dashboard: 'D',
  Manutencao: 'Mn',
  Abastecimento: 'Ab',
  Pneus: 'Pn',
  Gastos: 'Gs',
  Checklist: 'Ck',
};

export default function AppNavigator({ usuario }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // exibe a letra do modulo como icone da aba
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: focused ? colors.tabActive : colors.tabInactive,
              }}
            >
              {ICONES[route.name]}
            </Text>
          ),
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBackground,
            borderTopColor: colors.tabBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 6,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
          },
          headerStyle: { backgroundColor: colors.headerBackground },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
        })}
      >
        <Tab.Screen
          name="Motos"
          options={{ title: 'Minhas Motos' }}
        >
          {/* passa o usuario para as telas que precisam do uid */}
          {(props) => <MotosScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Dashboard">
          {(props) => <DashboardScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen
          name="Manutencao"
          options={{ title: 'Manutencao' }}
        >
          {(props) => <ManutencaoScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Abastecimento">
          {(props) => <AbastecimentoScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Pneus">
          {(props) => <PneusScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Gastos">
          {(props) => <GastosScreen {...props} usuario={usuario} />}
        </Tab.Screen>
        <Tab.Screen name="Checklist">
          {(props) => <ChecklistScreen {...props} usuario={usuario} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
