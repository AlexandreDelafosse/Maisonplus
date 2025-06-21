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
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../navigation/NotesStack';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useCurrentTeam } from '../../hooks/useCurrentTeam';

type Note = {
  author: string;
  id: string;
  title: string;
  content: string;
  tags?: string[];
  userId: string;
  teamId: string;
};

type NavigationProp = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { teamId } = useCurrentTeam();

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'alpha'>('recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const loadNotes = async () => {
    if (!currentUser || !teamId) return;

    try {
      const q = query(collection(db, 'notes'), where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);

      const loadedNotes: Note[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Note[];

      setNotes(loadedNotes);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les notes.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadNotes();
    }
  }, [isFocused, teamId]);

  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags || []))
  );

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
      await deleteDoc(doc(db, 'notes', id));
      setNotes((prev) => prev.filter((n) => n.id !== id));
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
