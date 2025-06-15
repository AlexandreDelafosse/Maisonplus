// src/screens/BudgetScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Picker } from '@react-native-picker/picker';

type Expense = {
  label: string;
  amount: number;
  paidBy: string;
  date: string;
};

type User = {
  id: string;
  displayName: string;
};

type Summary = {
  userId: string;
  displayName: string;
  total: number;
};

export default function BudgetScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [month, setMonth] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalsByUser, setTotalsByUser] = useState<Summary[]>([]);

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    setMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (month) loadBudget();
  }, [month]);

  useEffect(() => {
    if (users.length > 0 && !paidBy) {
      const fallback = users.find(u => u.id === currentUser?.uid) || users[0];
      setPaidBy(fallback.id);
    }
  }, [users]);

  useEffect(() => {
    calculateTotalsByUser();
  }, [expenses, users]);

  const loadBudget = async () => {
    if (!currentUser) return;

    const budgetRef = doc(db, 'budgets', month);

    try {
      const snap = await getDoc(budgetRef);
      if (snap.exists()) {
        const data = snap.data();
        setTotalBudget(data.totalBudget);
        setExpenses(data.expenses || []);
        console.log('🔄 Dépenses chargées :', data.expenses);
      } else {
        await setDoc(budgetRef, { totalBudget: 0, expenses: [], createdBy: currentUser.uid });
        setTotalBudget(0);
        setExpenses([]);
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      setRole(userSnap.data()?.role || '');

      const usersSnap = await getDocs(collection(db, 'users'));
      const userList: User[] = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as { displayName: string }),
      }));
      setUsers(userList);
      console.log('👥 Utilisateurs :', userList);
    } catch (error) {
      console.error('❌ Erreur chargement budget :', error);
      Alert.alert('Erreur', 'Impossible de charger les données du budget.');
    }
  };

  const addExpense = async () => {
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
    };

    const updated = [...expenses, newExpense];
    const budgetRef = doc(db, 'budgets', month);

    try {
      await updateDoc(budgetRef, { expenses: updated });
      setExpenses(updated);
      setModalVisible(false);
      resetModal();
    } catch (error) {
      console.error('❌ Erreur ajout dépense :', error);
      Alert.alert('Erreur', "Impossible d'ajouter la dépense.");
    }
  };

  const resetModal = () => {
    setLabel('');
    setAmount('');
    setPaidBy(currentUser?.uid || users[0]?.id || '');
    setDate(new Date());
  };

  const calculateTotalsByUser = () => {
    const map: { [userId: string]: number } = {};

    expenses.forEach(exp => {
      map[exp.paidBy] = (map[exp.paidBy] || 0) + exp.amount;
    });

    const summary: Summary[] = users.map(user => ({
      userId: user.id,
      displayName: user.displayName,
      total: map[user.id] || 0,
    }));

    setTotalsByUser(summary);
    console.log('📊 Totaux par utilisateur :', summary);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budget du mois : {month}</Text>
      <Text style={styles.total}>Budget total : {totalBudget} €</Text>

      {totalsByUser.length > 0 && (
        <View style={styles.summaryBox}>
          {totalsByUser.map((item) => (
            <Text key={item.userId} style={styles.summaryText}>
              {item.displayName} : {item.total.toFixed(2)} €
            </Text>
          ))}
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseText}>{item.label} - {item.amount.toFixed(2)} €</Text>
            <Text style={styles.meta}>
              Payé par : {users.find(u => u.id === item.paidBy)?.displayName || 'Inconnu'} - {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (users.length === 0) {
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
          <Text style={styles.modalTitle}>Nouvelle dépense</Text>

          <TextInput
            placeholder="Nom de la dépense"
            placeholderTextColor="#999"
            style={styles.input}
            value={label}
            onChangeText={setLabel}
          />

          <TextInput
            placeholder="Montant"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Payé par :</Text>
          <Picker selectedValue={paidBy} onValueChange={setPaidBy}>
            <Picker.Item label="Sélectionner un membre" value="" enabled={false} />
            {users.map(user => (
              <Picker.Item key={user.id} label={user.displayName} value={user.id} />
            ))}
          </Picker>

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

          <TouchableOpacity style={styles.saveButton} onPress={addExpense}>
            <Text style={styles.saveButtonText}>Ajouter</Text>
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
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
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
});
