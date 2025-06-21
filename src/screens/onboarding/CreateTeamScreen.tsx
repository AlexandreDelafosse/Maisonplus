import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { PACKS } from '../../utils/packs';
import uuid from 'react-native-uuid';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

export default function CreateTeamScreen() {
  const [teamName, setTeamName] = useState('');
  const [selectedPack, setSelectedPack] = useState('famille');

  // ✅ CORRECT: typé dès le départ
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'équipe');
      return;
    }

    const teamId = uuid.v4().toString();

    try {
      await setDoc(doc(db, 'teams', teamId), {
        name: teamName,
        createdBy: user?.uid,
        pack: selectedPack,
        members: [user?.uid],
        createdAt: Date.now(),
      });

      // ✅ Navigation directe
      navigation.navigate('SelectTeam');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de créer l\'équipe.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer une équipe</Text>
      <TextInput
        placeholder="Nom de l'équipe"
        value={teamName}
        onChangeText={setTeamName}
        style={styles.input}
      />
      <Text style={styles.subtitle}>Choisir un pack :</Text>
      <FlatList
        data={Object.entries(PACKS)}
        keyExtractor={([key]) => key}
        renderItem={({ item: [key, pack] }) => (
          <TouchableOpacity
            style={[styles.packCard, selectedPack === key && styles.packCardSelected]}
            onPress={() => setSelectedPack(key)}>
            <Text style={styles.packName}>{pack.label}</Text>
            {pack.features.map(f => (
              <Text key={f} style={styles.feature}>• {f}</Text>
            ))}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
        <Text style={styles.buttonText}>Créer l'équipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 75 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 20 },
  subtitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  packCard: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 10, marginBottom: 10 },
  packCardSelected: { backgroundColor: '#dff0d8', borderColor: '#28a745' },
  packName: { fontWeight: 'bold', marginBottom: 6 },
  feature: { fontSize: 13 },
  button: { marginTop: 20, backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
});
