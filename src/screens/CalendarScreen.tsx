import React, { useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
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
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

interface EventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  createdByName?: string;
}

export default function CalendarScreen() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [creatorName, setCreatorName] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;

  // 🔁 Récupère le teamId de l'utilisateur connecté
  useFocusEffect(
    useCallback(() => {
      const fetchTeamId = async () => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        setTeamId(data?.teamId || null);
      };

      fetchTeamId();
    }, [user])
  );

  // 📅 Écoute les événements de la team
  useFocusEffect(
    useCallback(() => {
      if (!teamId) return;

      const q = query(collection(db, 'calendarevents'), where('teamId', '==', teamId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description || '',
          start: data.start.toDate(),
          end: data.end.toDate(),
          createdByName: data.createdByName || '',
        };
      });
        setEvents(fetched);
      });

      return () => unsubscribe();
    }, [teamId])
  );

const handlePressCell = (date: Date) => {
  setSelectedDate(date);
  setStartDate(date);
  setEndDate(date);
  setStartTime('10:00');
  setEndTime('11:00');
  setNewTitle('');
  setDescription('');
  setCreatorName(''); // ✅ Réinitialise le créateur
  setIsEditing(false);
  setModalVisible(true);
};


  const handlePressEvent = (event: EventType) => {
    setSelectedDate(event.start);
    setStartDate(event.start);
    setEndDate(event.end);
    setNewTitle(event.title);
    setDescription(event.description || '');
    setStartTime(event.start.toTimeString().slice(0, 5));
    setEndTime(event.end.toTimeString().slice(0, 5));
    setIsEditing(true);
    setEditingId(event.id);
    setModalVisible(true);
    setCreatorName(event.createdByName || '');

  };

  const parseTime = (baseDate: Date, time: string): Date => {
    const [hour, minute] = time.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hour, minute, 0, 0);
    return newDate;
  };

  const submitEvent = async () => {
    if (!startDate || !endDate || !newTitle.trim() || !teamId) return;

    const start = parseTime(startDate, startTime);
    const end = parseTime(endDate, endTime);
    if (end <= start) return alert("L'heure de fin doit être après l'heure de début.");

    if (isEditing && editingId) {
      const ref = doc(db, 'calendarevents', editingId);
      await updateDoc(ref, {
        title: newTitle,
        description,
        start,
        end,
      });
    } else {
      await addDoc(collection(db, 'calendarevents'), {
        title: newTitle,
        description,
        start,
        end,
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Modifier' : 'Nouvel'} événement
            </Text>

            <TextInput
              placeholder="Titre"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 60 }]}
              multiline
            />

            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
              <Text>{startDate ? startDate.toDateString() : 'Choisir une date de début'}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}

            <TextInput
              placeholder="Heure de début (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              style={styles.input}
              keyboardType="numeric"
            />

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
              <Text>{endDate ? endDate.toDateString() : 'Choisir une date de fin'}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

            <TextInput
              placeholder="Heure de fin (HH:MM)"
              value={endTime}
              onChangeText={setEndTime}
              style={styles.input}
              keyboardType="numeric"
            />

            {creatorName ? (
              <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
                Créé par : {creatorName}
              </Text>
            ) : null}


            <TouchableOpacity style={styles.addButton} onPress={submitEvent}>
            
              <Text style={styles.addText}>{isEditing ? 'Modifier' : 'Ajouter'}</Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity onPress={deleteEvent}>
                <Text style={styles.deleteText}>Supprimer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
});
