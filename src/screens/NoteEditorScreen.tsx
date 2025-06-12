import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import uuid from 'react-native-uuid';
import { NotesStackParamList } from '../navigation/NotesStack';

type NoteEditorScreenRouteProp = RouteProp<NotesStackParamList, 'NoteEditor'>;
type NavigationProp = NativeStackNavigationProp<NotesStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NoteEditorScreenRouteProp>();
  const { noteId } = route.params || {};

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (noteId) {
      AsyncStorage.getItem('notes').then((data) => {
        if (data) {
          const notes = JSON.parse(data);
          const note = notes.find((n: any) => n.id === noteId);
          if (note) {
            setTitle(note.title);
            setContent(note.content);
          }
        }
      });
    }
  }, [noteId]);

const saveNote = async () => {
  console.log('👉 Fonction saveNote appelée !');

  try {
    const data = await AsyncStorage.getItem('notes');
    const notes = data ? JSON.parse(data) : [];

    if (title.trim() === '' && content.trim() === '') {
      console.log('🛑 Note vide, rien sauvegardé');
      navigation.goBack();
      return;
    }

    if (noteId) {
      const updated = notes.map((n: any) =>
        n.id === noteId ? { ...n, title, content } : n
      );
      await AsyncStorage.setItem('notes', JSON.stringify(updated));
      console.log('✏️ Note mise à jour :', title);
    } else {
      const newNote = { id: uuid.v4() as string, title, content };
      const newNotes = [...notes, newNote];
      console.log('🧾 Contenu de newNotes à sauvegarder :', newNotes);

      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      console.log('✅ Notes sauvegardées avec succès !');
    }

    navigation.goBack();
  } catch (e) {
    console.error('❌ Erreur de sauvegarde :', e);
  }
};

  const deleteNote = async () => {
    Alert.alert('Supprimer', 'Supprimer cette note ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const data = await AsyncStorage.getItem('notes');
          const notes = data ? JSON.parse(data) : [];
          const filtered = notes.filter((n: any) => n.id !== noteId);
          await AsyncStorage.setItem('notes', JSON.stringify(filtered));
          navigation.goBack();

        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TextInput
        placeholder="Titre"
        value={title}
        onChangeText={setTitle}
        style={styles.title}
      />
      <TextInput
        placeholder="Contenu"
        value={content}
        onChangeText={setContent}
        style={styles.content}
        multiline
      />

      <View style={styles.buttons}>
        {noteId && (
          <TouchableOpacity style={styles.delete} onPress={deleteNote}>
            <Text style={styles.deleteText}>Supprimer</Text>
          </TouchableOpacity>
        )}
<TouchableOpacity
  style={styles.save}
  onPress={() => {
    console.log('🖱️ Bouton "Sauvegarder" pressé');
    saveNote();
  }}
>
  <Text style={styles.saveText}>Sauvegarder</Text>
</TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  content: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  save: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
  },
  saveText: { color: 'white', textAlign: 'center' },
  delete: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  deleteText: { color: 'white', textAlign: 'center' },
});
