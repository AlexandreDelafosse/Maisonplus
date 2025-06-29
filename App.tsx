import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import * as Linking from 'expo-linking';

export const linking = {
  prefixes: ['exp://', 'https://4b17-2a01-cb00-1c4-c700-c979-2dd1-b72a-9fc3.ngrok-free.app'], // Ajoute ton domaine ngrok si besoin
  config: {
    screens: {
      Invitation: 'invitation',
      Login: 'login',
      Register: 'register',
    },
  },
};


export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
