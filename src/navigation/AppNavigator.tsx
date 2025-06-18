// src/navigation/AppNavigator.tsx
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { linking } from '../../App';
import type { RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabs from './MainTabs';
import InvitationScreen from '../screens/InvitationScreen';
import CreateTeamScreen from '../screens/CreateTeamScreen';
import SelectTeamScreen from '../screens/SelectTeamScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
              <Stack.Screen name="SelectTeam" component={SelectTeamScreen} />
              <Stack.Screen name="Main" component={MainTabs} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
          <Stack.Screen name="Invitation" component={InvitationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
