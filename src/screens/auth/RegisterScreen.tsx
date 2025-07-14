import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import * as SecureStore from 'expo-secure-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const invitationId = route.params?.invitationId || null;
  const redirectToInvitation = route.params?.redirectToInvitation || false;
  const prefillEmail = route.params?.email || '';

  useEffect(() => {
    if (prefillEmail) {
      console.log('📩 Pré-remplissage email depuis params :', prefillEmail);
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError('');
    console.log('📝 Tentative d’inscription pour', email);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        firstName,
        lastName,
        role: 'member',
      });

      // ✅ Cas 1 : Redirection directe depuis params
      if (redirectToInvitation && invitationId) {
        console.log('🔁 Redirection directe vers Invitation avec ID :', invitationId);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Invitation', params: { email, id: invitationId } }],
        });
        return;
      }
console.log("[REGISTER] Redirection vers Invitation avec params :", { email, id: invitationId });

      // ✅ Cas 2 : Redirection via SecureStore
      const stored = await SecureStore.getItemAsync('pendingInvitation');
      console.log('🔍 Vérification SecureStore →', stored);
      console.log("[REGISTER] Check SecureStore pour redirection...");

      if (stored) {
        const { email: storedEmail, id } = JSON.parse(stored);
        await SecureStore.deleteItemAsync('pendingInvitation');
        console.log('🧹 Invitation supprimée de SecureStore');

        navigation.reset({
          index: 0,
          routes: [{ name: 'Invitation', params: { email: storedEmail, id } }],
        });
        return;
      }
      console.log("[REGISTER] Redirection via SecureStore :", stored);


      // ✅ Cas standard
      console.log('🎯 Inscription réussie sans invitation → vers Main');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

    } catch (err: any) {
      console.error('❌ Erreur lors de l’inscription :', err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Cette adresse e-mail est déjà utilisée.");
      } else {
        setError("Échec de l’inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Prénom" value={firstName} onChangeText={setFirstName} style={styles.input} />
      <TextInput placeholder="Nom" value={lastName} onChangeText={setLastName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Mot de passe" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      {loading && <Text style={styles.loading}>Création du compte...</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="S’inscrire" onPress={handleRegister} />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Déjà un compte ? Se connecter
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 80 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
  loading: { color: 'gray', marginBottom: 10, textAlign: 'center' },
  link: { color: 'blue', marginTop: 10, textAlign: 'center' },
});
