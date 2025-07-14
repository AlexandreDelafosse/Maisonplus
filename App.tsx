import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider } from './src/context/AuthContext';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import linking from './src/navigation/linkingConfig'; // 👈 le vrai linking

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url && url.includes('/invitation')) {
        const parsed = Linking.parse(url);
        const email = parsed.queryParams?.email;
        const id = parsed.queryParams?.id;

        if (email && id) {
          console.log('📩 Invitation captée à l’ouverture de l’app:', email, id);
          await SecureStore.setItemAsync(
            'pendingInvitation',
            JSON.stringify({ email, id })
          );
        }
      }
      setReady(true); // ✅ App prête à s’afficher
    };

    handleInitialUrl();
  }, []);

  if (!ready) return null; // ⏳ on attend le traitement de l’URL

  return (
    <AuthProvider>
      <AppNavigator linking={linking} />
    </AuthProvider>
  );
}

