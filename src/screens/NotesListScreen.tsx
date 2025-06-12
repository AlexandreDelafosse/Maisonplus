import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../navigation/NotesStack';
import { useIsFocused } from '@react-navigation/native';

type Note = {
  id: string;
  title: string;
};

type NavigationProp = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadNotes = async () => {
      const data = await AsyncStorage.getItem('notes');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Liste rechargée depuis AsyncStorage :', parsed);
          setNotes(parsed);
        } catch (e) {
          console.error('❌ Erreur JSON :', e);
        }
      } else {
        console.log('⚠️ Aucune note dans le storage');
        setNotes([]);
      }
    };

    if (isFocused) {
      loadNotes();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.note}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
          >
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune note pour l’instant.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('NoteEditor')}
      >
        <Text style={styles.addButtonText}>+ Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  note: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 20, color: '#666' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 25,
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonText: { color: 'white', fontWeight: 'bold' },
});
