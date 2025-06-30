// ✅ InvitationScreen.tsx corrigé avec redirection si non connecté
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { RootStackParamList } from '../../navigation/types';

export default function InvitationScreen() {
  const route = useRoute<any>();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { email, id } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser && email && id) {
      Alert.alert(
        "Créer un compte",
        "Vous devez créer un compte pour accepter cette invitation.",
        [
          {
            text: "S'inscrire",
onPress: () => {
  navigation.navigate(
    'Register',
    {
      email,
      redirectToInvitation: true,
      invitationId: id,
    }
  ) as unknown as never;
}

          },
          { text: "Annuler", style: 'cancel' },
        ]
      );
    }
  }, []);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!email || !id) return setError("Lien invalide.");
      try {
        const snap = await getDoc(doc(db, 'invitations', id));
        if (!snap.exists()) return setError("Invitation introuvable.");
        const data = snap.data();
        if (data.email !== email) return setError("Cette invitation ne vous est pas destinée.");
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
  if (!currentUser) {
    return Alert.alert("Erreur", "Vous devez être connecté pour accepter l'invitation.");
  }

  if (currentUser.email !== email) {
    return Alert.alert(
      "Erreur",
      `Cette invitation est destinée à ${email}, mais vous êtes connecté avec ${currentUser.email}.`
    );
  }

  try {
      await setDoc(doc(db, 'memberships', `${invitation.teamId}_${currentUser.uid}`), {
        userId: currentUser.uid,
        teamId: invitation.teamId,
        role: 'member',
      });


    await refreshUser(); // ou refetchUser(), selon ton hook
    await deleteDoc(doc(db, 'invitations', id));

    Alert.alert("Bienvenue !", "Vous avez rejoint l'équipe.");

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main' as never,
          state: {
            routes: [{ name: 'Profile' as never }],
          } as never,
        } as never,
      ],
    });
  } catch (err) {
    console.error(err);
    Alert.alert("Erreur", "Impossible de rejoindre l'équipe.");
  }
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
      <TouchableOpacity style={styles.button} onPress={accepterInvitation}>
        <Text style={styles.buttonText}>Accepter l'invitation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  info: { fontSize: 16, marginVertical: 10 },
  button: {
    marginTop: 30,
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
function refreshUser() {
  throw new Error('Function not implemented.');
}

