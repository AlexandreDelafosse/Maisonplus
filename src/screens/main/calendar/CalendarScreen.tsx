import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-big-calendar';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentTeam } from '../../../hooks/useCurrentTeam';

interface EventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  createdByName?: string;
  color?: string;
}

export default function CalendarScreen() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [eventType, setEventType] = useState('Réunion');

  const auth = getAuth();
  const user = auth.currentUser;
  const { teamId } = useCurrentTeam();

  useFocusEffect(
    useCallback(() => {
      if (!teamId) return;

      const q = query(collection(db, 'calendarevents'), where('teamId', '==', teamId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typeColorMap: { [key: string]: string } = {
          Réunion: '#007AFF',
          Anniversaire: '#FF9500',
          Sortie: '#34C759',
          Perso: '#8E8E93',
        };

        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description || '',
            start: data.start.toDate(),
            end: data.end.toDate(),
            createdByName: data.createdByName || '',
            color: typeColorMap[data.type] || '#CCCCCC',
          };
        });
        setEvents(fetched);
      });

      return () => unsubscribe();
    }, [teamId])
  );

  const handlePressCell = (date: Date) => {
    const defaultStart = new Date(date);
    defaultStart.setHours(10, 0, 0, 0);
    const defaultEnd = new Date(date);
    defaultEnd.setHours(11, 0, 0, 0);

    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setNewTitle('');
    setDescription('');
    setCreatorName('');
    setEventType('Réunion');
    setIsEditing(false);
    setModalVisible(true);
  };

  const handlePressEvent = (event: EventType) => {
    setStartDate(event.start);
    setEndDate(event.end);
    setNewTitle(event.title);
    setDescription(event.description || '');
    setIsEditing(true);
    setEditingId(event.id);
    setCreatorName(event.createdByName || '');
    setModalVisible(true);
  };

  const submitEvent = async () => {
    if (!startDate || !endDate || !newTitle.trim() || !teamId) return;
    if (endDate <= startDate) return alert("L'heure de fin doit être après l'heure de début.");

    if (isEditing && editingId) {
      const ref = doc(db, 'calendarevents', editingId);
      await updateDoc(ref, {
        title: newTitle,
        description,
        start: startDate,
        end: endDate,
        type: eventType,
      });
    } else {
      await addDoc(collection(db, 'calendarevents'), {
        title: newTitle,
        description,
        start: startDate,
        end: endDate,
        type: eventType,
        teamId,
        createdByUid: user?.uid || '',
        createdByName: user?.displayName || user?.email || 'Inconnu',
      });
    }

    setModalVisible(false);
  };

  const deleteEvent = () => {
    if (editingId) {
      Alert.alert('Supprimer', 'Voulez-vous supprimer cet événement ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'calendarevents', editingId));
            setModalVisible(false);
          },
        },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Calendar
        events={events}
        height={Platform.OS === 'web' ? 800 : 600}
        mode="month"
        locale="fr"
        onPressCell={handlePressCell}
        onPressEvent={handlePressEvent}
      />

      {/* Modal : inchangé */}
      {/* ... tout le code du modal ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 6,
    marginBottom: 6,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 6,
  },
  deleteText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
