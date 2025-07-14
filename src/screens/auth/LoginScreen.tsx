import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    console.log('🔑 Tentative de connexion pour', email);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Connexion réussie pour :', cred.user.email);

      // 🔍 On vérifie s'il y a une invitation stockée
      const stored = await SecureStore.getItemAsync('pendingInvitation');
      console.log('📦 Invitation stockée dans SecureStore :', stored);

      if (stored) {
        const { email: storedEmail, id } = JSON.parse(stored);
        console.log('➡️ Redirection vers InvitationScreen avec :', storedEmail, id);

        await SecureStore.deleteItemAsync('pendingInvitation');
        console.log('🧹 Invitation supprimée de SecureStore');

        navigation.reset({
          index: 0,
          routes: [{ name: 'Invitation', params: { email: storedEmail, id } }],
        });
        return;
      }

      console.log('🎯 Aucune invitation trouvée, redirection vers Main');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

    } catch (err: any) {
      console.error('❌ Erreur de connexion :', err);
      setError("Échec de la connexion.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Connexion" onPress={handleLogin} />
      <Text
        style={styles.link}
        onPress={() => navigation.navigate({ name: 'Register', params: {} })}
      >
        Pas encore de compte ? S’inscrire
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 },
  link: { color: 'blue', marginTop: 10, textAlign: 'center' },
});
