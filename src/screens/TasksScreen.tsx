// src/screens/TasksScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import Checkbox from '../components/Checkbox';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- TYPES ---
type User = {
  id: string;
  displayName: string;
};

type Task = {
  id: string;
  title: string;
  assignedTo: string;
  completed: boolean;
  recurrence: string;
  dueDate: string;
};

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recurrence, setRecurrence] = useState('none');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const list: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || 'Anonyme',
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    getDoc(userRef).then(docSnap => {
      const userRole = docSnap.data()?.role;
      const q = userRole === 'admin'
        ? query(collection(db, 'tasks'))
        : query(collection(db, 'tasks'), where('assignedTo', '==', currentUser.uid));

      const unsub = onSnapshot(q, snapshot => {
        const list: Task[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Task, 'id'>),
        }));
        setTasks(list);
      });
      return unsub;
    });
  }, [currentUser]);

  const openModal = (task: Task | null = null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setAssignedTo(task.assignedTo);
      setRecurrence(task.recurrence || 'none');
      setDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
    } else {
      setEditingTask(null);
      setTitle('');
      setAssignedTo('');
      setRecurrence('none');
      setDueDate(new Date());
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const data = {
      title,
      assignedTo,
      completed: false,
      recurrence,
      dueDate: dueDate.toISOString(),
    };
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), data);
      } else {
        await addDoc(collection(db, 'tasks'), data);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la tâche.');
    }
  };

  const toggleCompleted = async (task: Task) => {
    await updateDoc(doc(db, 'tasks', task.id), { completed: !task.completed });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesUser = !selectedUser || task.assignedTo === selectedUser;
    const matchesDate = !selectedDate || new Date(task.dueDate).toDateString() === selectedDate.toDateString();
    return matchesUser && matchesDate;
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Picker
          selectedValue={selectedUser}
          onValueChange={setSelectedUser}
          style={{ flex: 1 }}>
          <Picker.Item label="Tous les membres" value="" />
          {users.map(user => (
            <Picker.Item key={user.id} label={user.displayName} value={user.id} />
          ))}
        </Picker>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>
            {selectedDate ? selectedDate.toLocaleDateString() : 'Filtrer par date'}
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity onPress={() => setSelectedDate(null)}>
            <Text style={{ marginLeft: 10, color: 'red' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => openModal(item)}>
            <View style={styles.taskItem}>
              <Checkbox value={item.completed} onValueChange={() => toggleCompleted(item)} />
              <View>
                <Text style={[styles.taskTitle, item.completed && styles.completed]}>{item.title}</Text>
                <Text style={styles.taskMeta}>Assignée à : {users.find(u => u.id === item.assignedTo)?.displayName || '—'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
        <Text style={styles.addButtonText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Tâche</Text>
          <TextInput
            placeholder="Titre de la tâche"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Text style={styles.label}>Assigner à :</Text>
          <Picker
            selectedValue={assignedTo}
            onValueChange={(v) => setAssignedTo(v)}>
            <Picker.Item label="Choisir un membre" value="" />
            {users.map(user => (
              <Picker.Item key={user.id} label={user.displayName} value={user.id} />
            ))}
          </Picker>

          <Text style={styles.label}>Récurrence :</Text>
          <Picker
            selectedValue={recurrence}
            onValueChange={(value) => setRecurrence(value)}>
            <Picker.Item label="Aucune" value="none" />
            <Picker.Item label="Tous les jours" value="daily" />
            <Picker.Item label="Toutes les semaines" value="weekly" />
            <Picker.Item label="Tous les mois" value="monthly" />
          </Picker>

          <Text style={styles.label}>Date limite :</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.input}>{dueDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                if (date) setDueDate(date);
                setShowDatePicker(false);
              }}
            />
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  taskMeta: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  modalContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
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
    marginTop: 10,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateButton: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginTop: 10,
  },
  dateButtonText: {
    color: '#333',
  },
});
