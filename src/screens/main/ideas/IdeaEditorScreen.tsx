import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useCurrentTeam } from '../../../hooks/useCurrentTeam';

export default function IdeaEditorScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const ideaId = route.params?.ideaId || null;

  const user = getAuth().currentUser;
  const { teamId } = useCurrentTeam();

  useEffect(() => {
    if (!ideaId) return;

    const fetchIdea = async () => {
      setLoading(true);
      try {
        const ideaRef = doc(db, 'ideas', ideaId);
        const ideaSnap = await getDoc(ideaRef);
        if (ideaSnap.exists()) {
          const data = ideaSnap.data();
          setTitle(data.title || '');
          setDescription(data.description || '');
          if (data.deadline?.toDate) {
            setDeadline(data.deadline.toDate());
          }
        }
      } catch (error) {
        console.error('Erreur chargement idée :', error);
        Alert.alert('Erreur', "Impossible de charger l'idée.");
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [ideaId]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const saveIdea = async () => {
    if (!user) return;
    if (title.trim() === '') {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }

    const data = {
      title,
      description,
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (ideaId) {
        // Update mode
        await updateDoc(doc(db, 'ideas', ideaId), data);
      } else {
        // Create mode
        await addDoc(collection(db, 'ideas'), {
          ...data,
          createdAt: serverTimestamp(),
          votes: 0,
          status: 'pending',
          author: user.displayName || '',
          userId: user.uid,
          teamId,
        });
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l’idée.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

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

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButtonText}>
          {deadline ? `📅 ${deadline.toLocaleDateString()}` : '📅 Choisir une deadline'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

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
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
