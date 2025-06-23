import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useCurrentTeam } from '../../hooks/useCurrentTeam';

export default function IdeaEditorScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigation = useNavigation();
  const user = getAuth().currentUser;
  const { teamId } = useCurrentTeam(); // ajoute cette ligne au début du composant


  const saveIdea = async () => {
    if (!user) return;
    if (title.trim() === '') {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }

    try {
      await addDoc(collection(db, 'ideas'), {
        title,
        description,
        votes: 0,
        createdAt: serverTimestamp(),
        author: user.displayName || '',
        userId: user.uid,
        teamId, // ← ajoute ce champ !
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l’idée.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Titre de l'idée"
        value={title}
        onChangeText={setTitle}
        style={styles.titleInput}
      />
      <TextInput
        placeholder="Description (facultative)"
        value={description}
        onChangeText={setDescription}
        style={styles.descInput}
        multiline
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveIdea}>
        <Text style={styles.saveText}>💾 Sauvegarder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 4,
  },
  descInput: {
    fontSize: 16,
    height: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
  },
  saveText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
