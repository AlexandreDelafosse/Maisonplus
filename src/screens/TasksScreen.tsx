// src/screens/TasksScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Modal, TextInput,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useCurrentTeam } from '../hooks/useCurrentTeam';
import { TeamTask, useTeamTasks } from '../hooks/useTeamTasks';
import { useTeamMembers } from '../hooks/useTeamMembers';
import Checkbox from '../components/Checkbox';

const recurrenceLabels: Record<'none' | 'daily' | 'weekly' | 'monthly', string> = {
  none: 'Aucune',
  daily: 'Tous les jours',
  weekly: 'Toutes les semaines',
  monthly: 'Tous les mois',
};

export function TasksScreen() {
  const { teamId } = useCurrentTeam();
  const { tasks, loading, addTask, updateTask } = useTeamTasks(teamId || '');
  const { members } = useTeamMembers(teamId || '');

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');


  const auth = getAuth();
  const currentUser = auth.currentUser;

  const openModal = (task: TeamTask | null = null) => {
if (task) {
  setEditingTaskId(task.id);
  setTitle(task.title);
  setDescription(task.description || '');
  setAssignedTo(task.assignedTo || []);
  setRecurrence(task.recurrence || 'none');
  setDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
} else {
  setEditingTaskId(null);
  setTitle('');
  setDescription('');
  setAssignedTo([]);
  setRecurrence('none');
  setDueDate(new Date());
}
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !teamId || !currentUser) return;

const data: Omit<TeamTask, 'id' | 'createdAt'> = {
  title,
  description,
  assignedTo,
  status: 'todo',
  recurrence,
  dueDate,
  teamId,
  createdBy: currentUser.uid,
};


    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, data);
      } else {
        await addTask(data);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la tâche.');
    }
  };

  const toggleCompleted = async (task: TeamTask) => {
    await updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const toggleUserAssignment = (userId: string) => {
    setAssignedTo(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesUser =
      !selectedUser || (task.assignedTo && task.assignedTo.includes(selectedUser));
    const matchesDate =
      !selectedDate ||
      (task.dueDate && new Date(task.dueDate).toDateString() === selectedDate.toDateString());
    return matchesUser && matchesDate;
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Text style={styles.label}>Filtrer par membre :</Text>
        <FlatList
          horizontal
          data={members}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedUser(item.id === selectedUser ? '' : item.id)}
              style={{
                backgroundColor: selectedUser === item.id ? '#007AFF' : '#ccc',
                padding: 6, borderRadius: 8, marginHorizontal: 4,
              }}
            >
              <Text style={{ color: 'white' }}>{item.displayName}</Text>
            </TouchableOpacity>
            
          )}

          
        />
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
              <Checkbox value={item.status === 'done'} onValueChange={() => toggleCompleted(item)} />
              <View>
                <Text style={[styles.taskTitle, item.status === 'done' && styles.completed]}>{item.title}</Text>
                <Text style={styles.taskMeta}>
                  Assignée à : {item.assignedTo?.map(uid => members.find(u => u.id === uid)?.displayName).join(', ') || '—'}
                </Text>
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

          <Text style={styles.label}>Description :</Text>
<TextInput
  placeholder="Description de la tâche"
  value={description}
  onChangeText={setDescription}
  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
  multiline
/>


          <Text style={styles.label}>Assigner à :</Text>
          <View style={styles.checkboxGroup}>
            {members.map(user => (
              <TouchableOpacity
                key={user.id}
                onPress={() => toggleUserAssignment(user.id)}
                style={styles.checkboxRow}
              >
                <Checkbox value={assignedTo.includes(user.id)} onValueChange={() => toggleUserAssignment(user.id)} />
                <Text style={styles.checkboxLabel}>{user.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Récurrence :</Text>
          <View style={styles.checkboxGroup}>
            {(['none', 'daily', 'weekly', 'monthly'] as const).map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => setRecurrence(option)}
                style={styles.checkboxRow}
              >
                <Checkbox value={recurrence === option} onValueChange={() => setRecurrence(option)} />
                <Text style={styles.checkboxLabel}>{recurrenceLabels[option]}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  taskTitle: { fontSize: 16 },
  completed: { textDecorationLine: 'line-through', color: 'gray' },
  taskMeta: { fontSize: 12, color: '#666' },
  addButton: {
    position: 'absolute', bottom: 30, right: 30,
    backgroundColor: '#007AFF', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
  },
  addButtonText: { fontSize: 30, color: '#fff' },
  modalContainer: { padding: 20, flex: 1, justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 12 },
  label: { marginTop: 10, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, marginTop: 20 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  dateButton: { padding: 10, backgroundColor: '#eee', borderRadius: 8, marginTop: 10 },
  dateButtonText: { color: '#333' },
  checkboxGroup: { marginTop: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  checkboxLabel: { marginLeft: 10 },
});
