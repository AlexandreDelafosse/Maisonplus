import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../../navigation/types';
import { arrayUnion, updateDoc } from 'firebase/firestore';

export default function InvitationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const auth = getAuth();
  const { email, id } = route.params || {};

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((usr) => {
      setCurrentUser(usr);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!email || !id) return setError('Lien invalide.');
      try {
        const snap = await getDoc(doc(db, 'invitations', id));
        if (!snap.exists()) return setError('Invitation introuvable.');
        const data = snap.data();
        if (data.email !== email) return setError('Cette invitation ne vous est pas destinée.');
        setInvitation(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'invitation.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [email, id]);

  const accepterInvitation = async () => {
    if (!currentUser || currentUser.email !== email) return;

    try {
      await setDoc(doc(db, 'memberships', `${invitation.teamId}_${currentUser.uid}`), {
        userId: currentUser.uid,
        teamId: invitation.teamId,
        role: 'member',
      });

      await deleteDoc(doc(db, 'invitations', id));
      await SecureStore.deleteItemAsync('pendingInvitation');
      await updateDoc(doc(db, 'teams', invitation.teamId), {
        members: arrayUnion(currentUser.uid),
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInscription = () => {
    navigation.replace('Register', {
      email,
      redirectToInvitation: true,
      invitationId: id,
    });
  };

  const handleConnexion = () => {
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <View style={styles.container}><ActivityIndicator size="large" /></View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}><Text style={styles.error}>{error}</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Invitation trouvée !</Text>
      <Text style={styles.info}>Équipe : {invitation?.teamName || 'Inconnue'}</Text>
      <Text style={styles.info}>Email : {email}</Text>

      {currentUser?.email === email ? (
        <TouchableOpacity style={styles.button} onPress={accepterInvitation}>
          <Text style={styles.buttonText}>Accepter l'invitation</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={{ marginVertical: 20, textAlign: 'center' }}>
            Pour accepter cette invitation, vous devez créer un compte ou vous connecter.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleInscription}>
            <Text style={styles.buttonText}>S'inscrire</Text>
          </TouchableOpacity>

        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  info: { fontSize: 16, marginVertical: 10 },
  button: {
    marginTop: 10,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});
