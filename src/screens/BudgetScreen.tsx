// src/screens/BudgetScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useCurrentTeam } from '../hooks/useCurrentTeam';
import { useTeamMembers } from '../hooks/useTeamMembers';
import type { Member } from '../hooks/useTeamMembers';
import { Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';


type Expense = {
  label: string;
  amount: number;
  paidBy: string;
  date: string;
  tags?: string[];
};

type Summary = {
  userId: string;
  displayName: string;
  total: number;
};

export default function BudgetScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { teamId } = useCurrentTeam();
  const { members, loading: loadingUsers } = useTeamMembers(teamId || '');

  const [month, setMonth] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date());
  const [tags, setTags] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalsByUser, setTotalsByUser] = useState<Summary[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    setMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (month && teamId) {
      loadBudget();
    }
  }, [month, teamId]);

  useEffect(() => {
    if (!paidBy && members.length > 0) {
      const fallback = members.find(m => m.id === currentUser?.uid) || members[0];
      setPaidBy(fallback.id);
    }
  }, [members]);

  useEffect(() => {
    calculateTotalsByUser();
  }, [expenses, members]);

  const loadBudget = async () => {
    if (!teamId) return;
    const budgetRef = doc(db, 'teams', teamId, 'budgets', month);

    try {
      const snap = await getDoc(budgetRef);
      if (snap.exists()) {
        const data = snap.data();
        setTotalBudget(data.totalBudget);
        setExpenses(data.expenses || []);
      } else {
        await setDoc(budgetRef, { totalBudget: 0, expenses: [], createdBy: currentUser?.uid });
        setTotalBudget(0);
        setExpenses([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement budget :', error);
      Alert.alert('Erreur', 'Impossible de charger les données du budget.');
    }
  };

  const addOrUpdateExpense = async () => {
    if (!label.trim() || !amount || isNaN(parseFloat(amount))) {
      Alert.alert('Erreur', 'Veuillez saisir un libellé et un montant valide.');
      return;
    }
    if (!paidBy) {
      Alert.alert('Erreur', 'Veuillez sélectionner un membre ayant payé.');
      return;
    }

    const newExpense: Expense = {
      label,
      amount: parseFloat(amount),
      paidBy,
      date: date.toISOString(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    };

    let updated = [...expenses];
    if (editingIndex !== null) {
      updated[editingIndex] = newExpense;
    } else {
      updated.push(newExpense);
    }

    try {
      const budgetRef = doc(db, 'teams', teamId!, 'budgets', month);
      await updateDoc(budgetRef, { expenses: updated });
      setExpenses(updated);
      resetModal();
      setModalVisible(false);
    } catch (error) {
      console.error('❌ Erreur ajout ou modif dépense :', error);
      Alert.alert('Erreur', "Impossible de sauvegarder la dépense.");
    }
  };

  const deleteExpense = async (index: number) => {
    const updated = [...expenses];
    updated.splice(index, 1);
    try {
      const budgetRef = doc(db, 'teams', teamId!, 'budgets', month);
      await updateDoc(budgetRef, { expenses: updated });
      setExpenses(updated);
    } catch (error) {
      console.error('❌ Erreur suppression dépense :', error);
      Alert.alert('Erreur', "Impossible de supprimer la dépense.");
    }
  };

  const resetModal = () => {
    setLabel('');
    setAmount('');
    setPaidBy(currentUser?.uid || members[0]?.id || '');
    setDate(new Date());
    setTags('');
    setEditingIndex(null);
  };

  const calculateTotalsByUser = () => {
    const map: { [userId: string]: number } = {};
    expenses.forEach(exp => {
      map[exp.paidBy] = (map[exp.paidBy] || 0) + exp.amount;
    });
    const summary: Summary[] = members.map(user => ({
      userId: user.id,
      displayName: user.displayName,
      total: map[user.id] || 0,
    }));
    setTotalsByUser(summary);
  };

const calculateTotalsByTag = () => {
  const tagMap: { [tag: string]: number } = {};

  expenses.forEach(exp => {
    const splitAmount = exp.amount / (exp.tags?.length || 1);
    exp.tags?.forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + splitAmount;
    });
  });

  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  return Object.entries(tagMap).map(([tag, value], index) => ({
    name: tag,
    amount: value,
    color: colors[index % colors.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budget du mois : {month}</Text>
      <Text style={styles.total}>Budget total : {totalBudget} €</Text>

      {totalsByUser.length > 0 && (
        <View style={styles.summaryBox}>
          {totalsByUser.map(item => (
            <Text key={item.userId} style={styles.summaryText}>
              {item.displayName} : {item.total.toFixed(2)} €
            </Text>
          ))}
        </View>
      )}

      {calculateTotalsByTag().length > 0 && (
<PieChart
  data={calculateTotalsByTag()}
  width={Dimensions.get('window').width - 40}
  height={180}
  chartConfig={{
    color: () => '#000',
    labelColor: () => '#333',
  }}
  accessor="amount"
  backgroundColor="transparent"
  paddingLeft="20"
/>

      )}

      <FlatList
        data={expenses}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseText}>{item.label} - {item.amount.toFixed(2)} €</Text>
            <Text style={styles.meta}>
              Payé par : {members.find(u => u.id === item.paidBy)?.displayName || 'Inconnu'} - {new Date(item.date).toLocaleDateString()}
            </Text>
            {item.tags && (
              <Text style={styles.meta}>Tags : {item.tags.join(', ')}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => {
                setEditingIndex(index);
                setLabel(item.label);
                setAmount(item.amount.toString());
                setPaidBy(item.paidBy);
                setDate(new Date(item.date));
                setTags(item.tags?.join(', ') || '');
                setModalVisible(true);
              }}>
                <Text style={{ color: 'blue' }}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteExpense(index)}>
                <Text style={{ color: 'red' }}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (members.length === 0) {
            Alert.alert('Chargement...', 'Les membres ne sont pas encore chargés.');
            return;
          }
          resetModal();
          setModalVisible(true);
        }}>
        <Text style={styles.addButtonText}>+ Ajouter une dépense</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{editingIndex !== null ? 'Modifier' : 'Nouvelle'} dépense</Text>

          <TextInput
            placeholder="Nom de la dépense"
            style={styles.input}
            value={label}
            onChangeText={setLabel}
          />

          <TextInput
            placeholder="Montant"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TextInput
            placeholder="Tags (ex: nourriture, transport)"
            style={styles.input}
            value={tags}
            onChangeText={setTags}
          />

          <Text style={styles.label}>Payé par :</Text>
          <View style={styles.paidByList}>
            {members.map(user => (
              <TouchableOpacity
                key={user.id}
                onPress={() => setPaidBy(user.id)}
                style={[
                  styles.paidByItem,
                  paidBy === user.id && styles.paidByItemSelected,
                ]}>
                <Text style={styles.paidByText}>
                  {user.displayName}
                  {paidBy === user.id ? ' ✅' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.input}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
                setShowDatePicker(false);
              }}
            />
          )}

          <TouchableOpacity style={styles.saveButton} onPress={addOrUpdateExpense}>
            <Text style={styles.saveButtonText}>{editingIndex !== null ? 'Mettre à jour' : 'Ajouter'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  total: { fontSize: 16, marginBottom: 10 },
  summaryBox: {
    marginBottom: 20,
    backgroundColor: '#f6f6f6',
    padding: 10,
    borderRadius: 8,
  },
  summaryText: { fontSize: 14, color: '#333', marginBottom: 4 },
  expenseItem: { marginBottom: 12 },
  expenseText: { fontSize: 16 },
  meta: { fontSize: 12, color: '#666' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  modalContent: { padding: 20, flex: 1, justifyContent: 'center' },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  label: { fontWeight: 'bold', marginTop: 10 },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  paidByList: { marginTop: 10 },
  paidByItem: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 6,
  },
  paidByItemSelected: {
    backgroundColor: '#007AFF',
  },
  paidByText: {
    color: '#000',
  },
});
