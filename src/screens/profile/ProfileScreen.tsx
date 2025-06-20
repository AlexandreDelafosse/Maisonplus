// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    const fetchData = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setRole(data.role || '');

          if (data.needsProfileCompletion) {
            Alert.alert(
              "Bienvenue !",
              "Veuillez compléter votre profil pour finaliser l'inscription."
            );
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur chargement profil :', err);
        Alert.alert('Erreur', "Impossible de charger les données de profil.");
      }
    };

    fetchData();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const newDisplayName = `${firstName} ${lastName}`.trim();

    try {
      await updateProfile(user, { displayName: newDisplayName });
      await updateDoc(userRef, {
        firstName,
        lastName,
        displayName: newDisplayName,
        email: user.email || '',
        uid: user.uid,
        needsProfileCompletion: false,
      });
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
    } catch (err) {
      console.error('Erreur MAJ profil :', err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  const changeRole = async () => {
    if (!user) return;
    const newRole = role === 'admin' ? 'member' : 'admin';
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { role: newRole });
      setRole(newRole);
      Alert.alert('Succès', `Rôle changé en ${newRole}`);
    } catch (err) {
      console.error('Erreur changement de rôle :', err);
      Alert.alert('Erreur', 'Impossible de changer le rôle.');
    }
  };

  const goToTeamSelection = () => {
    navigation.navigate('SelectTeam');
  };

  if (isLoading) {
    return (
      <View style={styles.container}><Text>Chargement...</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      <TextInput
        placeholder="Prénom"
        value={firstName}
        onChangeText={setFirstName}
        editable={!isLoading}
        style={styles.input}
      />

      <TextInput
        placeholder="Nom"
        value={lastName}
        onChangeText={setLastName}
        editable={!isLoading}
        style={styles.input}
      />

      <Text style={styles.label}>Nom d'affichage : {`${firstName} ${lastName}`.trim()}</Text>

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Sauvegarder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#555' }]} onPress={changeRole}>
        <Text style={styles.buttonText}>Changer de rôle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={goToTeamSelection}>
        <Text style={styles.buttonText}>Changer d'équipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
