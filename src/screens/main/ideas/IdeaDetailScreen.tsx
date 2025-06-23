import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useRoute } from '@react-navigation/native';
import { IdeasStackParamList } from '../../../navigation/types';

type IdeaDetailScreenRouteProp = RouteProp<IdeasStackParamList, 'IdeaEditor'>;

export default function IdeaDetailScreen() {
  const route = useRoute<IdeaDetailScreenRouteProp>();
  const ideaId = route.params?.ideaId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!ideaId) return;
      const ideaRef = doc(db, 'ideas', ideaId);
      const docSnap = await getDoc(ideaRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setAuthor(data.author || 'Anonyme');
        setCreatedAt(data.createdAt?.toDate?.() || null);
        setDeadline(data.deadline?.toDate?.() || null);

        const currentUser = getAuth().currentUser;
        if (currentUser?.uid === data.userId) {
          setIsAuthor(true);
        }
      }
    };

    fetchIdea();
  }, [ideaId]);

  const handleSave = async () => {
    try {
      if (!ideaId) return;
      const ideaRef = doc(db, 'ideas', ideaId);
      await updateDoc(ideaRef, {
        title,
        description,
        deadline,
      });
      Alert.alert('✅ Sauvegardé', 'Les modifications ont été enregistrées.');
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Erreur', "Échec de l'enregistrement.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Titre</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        editable={isAuthor}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
        editable={isAuthor}
      />

      <Text style={styles.label}>Deadline</Text>
      {deadline && (
        <Text style={styles.deadlineDisplay}>
          ⏳ {deadline.toLocaleDateString()}
        </Text>
      )}
      {isAuthor && (
        <>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.deadlineButton}>
            <Text style={styles.deadlineButtonText}>📅 Choisir une date</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowPicker(false);
                if (date) setDeadline(date);
              }}
            />
          )}
        </>
      )}

      {createdAt && (
        <Text style={styles.dateText}>
          🕒 Créé le {createdAt.toLocaleDateString()}
        </Text>
      )}
      <Text style={styles.authorText}>👤 Auteur : {author}</Text>

      {isAuthor && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Enregistrer les modifications</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  deadlineDisplay: {
    marginBottom: 4,
    color: '#555',
  },
  deadlineButton: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deadlineButtonText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateText: { marginTop: 20, fontSize: 12, color: '#888' },
  authorText: { marginTop: 6, fontSize: 14, color: '#333' },
});
