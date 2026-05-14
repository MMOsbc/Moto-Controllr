// navigation/AppNavigator.js
// navegacao entre as paginas, e a barra lateral para selecionar a pagina que o usuario quer ir 
// Tema: branco, preto e cinza

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import DashboardScreen from '../screens/DashboardScreen';
import MotosScreen from '../screens/MotosScreen';
import ManutencaoScreen from '../screens/ManutencaoScreen';
import AbastecimentoScreen from '../screens/AbastecimentoScreen';
import PneusScreen from '../screens/PneusScreen';
import GastosScreen from '../screens/GastosScreen';
import ChecklistScreen from '../screens/ChecklistScreen';

import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const C = {
  branco: '#FFFFFF',
  cinzaClaro: '#F5F5F5',
  cinzaBorda: '#E0E0E0',
  cinzaMedio: '#888888',
  cinzaEscuro: '#444444',
  preto: '#111111',
};
// funcao para mostrar as paginas existentes e aplica estilo
function IconeMenu({ nome, focused }) {
  const icones = {
    Dashboard: 'D', Motos: 'M', Manutencao: 'Mt', Abastecimento: 'Ab',
    Pneus: 'Pn', Gastos: 'G', Checklist: 'Ck',
  };
  return (
    <View style={{
      width: 30, height: 30, borderRadius: 6,
      backgroundColor: focused ? C.preto : 'transparent',
      borderWidth: focused ? 0 : 1, borderColor: C.cinzaBorda,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? C.branco : C.cinzaMedio }}>
        {icones[nome] || '?'}
      </Text>
    </View>
  );
}

function DrawerCustom(props) {
  const { usuario, sair } = useAuth();

  async function handleLogout() {
    await logout();
    sair();
  }

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: C.cinzaClaro }}>
      <View style={estilosDrawer.cabecalho}>
        <View style={estilosDrawer.logoBox}>
          <Text style={estilosDrawer.logoLetra}>M</Text>
        </View>
        <Text style={estilosDrawer.appNome}>MotoManager</Text>
        {usuario && <Text style={estilosDrawer.usuarioNome}>{usuario.nome}</Text>}
      </View>

      <View style={estilosDrawer.separador} />
      <DrawerItemList {...props} />
      <View style={estilosDrawer.separador} />

      <TouchableOpacity style={estilosDrawer.botaoLogout} onPress={handleLogout}>
        <Text style={estilosDrawer.textoLogout}>Sair da conta</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}
// mostra as telas na barra lateral ao ser clicada
function DrawerLogado() {
  const telas = [
    { name: 'Dashboard', component: DashboardScreen, label: 'Inicio', headerShown: false },
    { name: 'Motos', component: MotosScreen, label: 'Motos' },
    { name: 'Manutencao', component: ManutencaoScreen, label: 'Manutencao' },
    { name: 'Abastecimento', component: AbastecimentoScreen, label: 'Abastecimento' },
    { name: 'Pneus', component: PneusScreen, label: 'Pneus' },
    { name: 'Gastos', component: GastosScreen, label: 'Gastos' },
    { name: 'Checklist', component: ChecklistScreen, label: 'Checklist' },
  ];

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerCustom {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: C.cinzaClaro, width: 270, borderRightWidth: 1, borderRightColor: C.cinzaBorda },
        drawerActiveTintColor: C.preto,
        drawerInactiveTintColor: C.cinzaMedio,
        drawerActiveBackgroundColor: '#EBEBEB',
        drawerInactiveBackgroundColor: 'transparent',
        drawerItemStyle: { borderRadius: 8, marginHorizontal: 8 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
        headerStyle: { backgroundColor: C.branco, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: C.cinzaBorda },
        headerTintColor: C.preto,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      {telas.map(t => (
        <Drawer.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            title: t.label,
            drawerLabel: t.label,
            headerShown: t.headerShown !== false,
            drawerIcon: ({ focused }) => <IconeMenu nome={t.name} focused={focused} />,
          }}
        />
      ))}
    </Drawer.Navigator>
  );
}

function StackAuth() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
// valida se o usuario esta logado para apresentar levar a tela principal e apresentar o menu lateral
export default function AppNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.loading}>
        <View style={estilos.logoBox}>
          <Text style={estilos.logoLetra}>M</Text>
        </View>
        <ActivityIndicator color={C.preto} size="large" style={{ marginTop: 24 }} />
        <Text style={estilos.loadingTexto}>Carregando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {usuario ? <DrawerLogado /> : <StackAuth />}
    </NavigationContainer>
  );
}

const estilos = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  logoLetra: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
  loadingTexto: { color: '#888888', marginTop: 14, fontSize: 15 },
});

const estilosDrawer = StyleSheet.create({
  cabecalho: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  logoBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoLetra: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  appNome: { color: '#111111', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  usuarioNome: { color: '#888888', fontSize: 13, marginTop: 3 },
  separador: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16, marginVertical: 8 },
  botaoLogout: { marginHorizontal: 12, marginVertical: 8, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  textoLogout: { color: '#555555', fontWeight: '600', fontSize: 14 },
});
