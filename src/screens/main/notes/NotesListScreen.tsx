import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../../navigation/NotesStack';
import { doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTeamNotes } from '../../../hooks/useTeamNotes'; // ✅ Hook custom
import { useIsFocused } from '@react-navigation/native';
import { Note } from '../../../navigation/types';


type NavigationProp = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isFocused = useIsFocused();

  const allNotes = useTeamNotes(); // ✅ notes en temps réel via hook
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'alpha'>('recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (isFocused) {
      setNotes(allNotes); // ⚡️ met à jour dès qu’on revient
    }
  }, [isFocused, allNotes]);

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags || [])));

  const filteredNotes = notes
    .filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedTag ? note.tags?.includes(selectedTag) : true)
    )
    .sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      if (sortOrder === 'recent') return b.id.localeCompare(a.id);
      if (sortOrder === 'oldest') return a.id.localeCompare(b.id);
      return 0;
    });

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(require('../../services/firebaseConfig').db, 'notes', id));
      setNotes((prev) => prev.filter((n) => n.id !== id)); // Optimiste
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de supprimer la note.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Rechercher une note..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.sortBar}>
        <TouchableOpacity onPress={() => setSortOrder('recent')}>
          <Text style={[styles.sortButton, sortOrder === 'recent' && styles.activeSort]}>
            🕒 Récent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOrder('oldest')}>
          <Text style={[styles.sortButton, sortOrder === 'oldest' && styles.activeSort]}>
            📜 Ancien
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOrder('alpha')}>
          <Text style={[styles.sortButton, sortOrder === 'alpha' && styles.activeSort]}>
            🔤 A-Z
          </Text>
        </TouchableOpacity>
      </View>

      {allTags.length > 0 && (
        <View style={styles.tagBar}>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setSelectedTag(tag === selectedTag ? null : tag)}
              style={[styles.tagButton, selectedTag === tag && styles.activeTagButton]}
            >
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <TouchableOpacity
              style={styles.noteContent}
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            >
              <Text style={styles.title}>{item.title}</Text>
              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <Text style={styles.tags}>#{item.tags.join('  #')}</Text>
              )}
              <Text style={styles.author}>✍️ {item.author || 'Inconnu'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Text style={styles.trashIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune note pour cette équipe.</Text>
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sortButton: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeSort: {
    backgroundColor: '#007AFF',
    color: 'white',
    fontWeight: 'bold',
  },
  tagBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTagButton: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    color: '#333',
  },
  noteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteContent: {
    flex: 1,
  },
  trashIcon: {
    fontSize: 18,
    marginLeft: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 25,
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 16 },
  tags: { fontSize: 12, color: '#888', marginTop: 4 },
});
