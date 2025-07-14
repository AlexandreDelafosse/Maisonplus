import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import type { RootStackParamList } from './types';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import MainTabs from './MainTabs';
import InvitationScreen from '../screens/invitation/InvitationScreen';
import CreateTeamScreen from '../screens/onboarding/CreateTeamScreen';
import SelectTeamScreen from '../screens/onboarding/SelectTeamScreen';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

// ✅ Nouveau provider Membership
import { MembershipProvider } from '../context/MembershipContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator({ linking }: { linking: any }) {
  const { user, loading } = useContext(AuthContext);
  const [initialScreen, setInitialScreen] = useState<'Login' | 'Invitation'>('Login');
  const [invitationParams, setInvitationParams] = useState<{ email: string, id: string } | null>(null);

  useEffect(() => {
    const checkStoredInvitation = async () => {
      const stored = await SecureStore.getItemAsync('pendingInvitation');
      if (stored && !user) {
        const parsed = JSON.parse(stored);
        console.log('📦 Invitation stockée détectée dans AppNavigator :', parsed);
        setInvitationParams(parsed);
        setInitialScreen('Invitation');
      }
    };
    checkStoredInvitation();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MembershipProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="SelectTeam" component={SelectTeamScreen} />
              <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
            </>
          ) : (
            <>
              {initialScreen === 'Invitation' && invitationParams ? (
                <Stack.Screen
                  name="Invitation"
                  component={InvitationScreen}
                  initialParams={invitationParams}
                />
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
              )}
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </MembershipProvider>
  );
}