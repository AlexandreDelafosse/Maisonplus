// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        role: 'member',
      });

      navigation.navigate('Home'); // ou autre écran post-inscription
    } catch (err) {
      setError("Échec de l’inscription.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nom d'affichage"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="S’inscrire" onPress={handleRegister} />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Déjà un compte ? Se connecter
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
