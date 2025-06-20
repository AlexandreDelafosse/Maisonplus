// ../src/screens/NoteEditorScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../navigation/NotesStack';
import { db } from '../../services/firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type NoteEditorScreenRouteProp = RouteProp<NotesStackParamList, 'NoteEditor'>;
type NavigationProp = NativeStackNavigationProp<NotesStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NoteEditorScreenRouteProp>();
  const { noteId } = route.params || {};

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (noteId) {
      const fetchNote = async () => {
        try {
          const noteRef = doc(db, 'notes', noteId);
          const snap = await getDoc(noteRef);
          if (snap.exists()) {
            const data = snap.data();
            setTitle(data.title);
            setContent(data.content);
            setTags((data.tags || []).join(', '));
          }
        } catch (err) {
          Alert.alert('Erreur', "Impossible de charger la note.");
          console.error(err);
        }
      };
      fetchNote();
    }

    const show = Keyboard.addListener('keyboardWillShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener('keyboardWillHide', () =>
      setKeyboardHeight(0)
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [noteId]);

  const saveNote = async () => {
    if (!user) return;

    if (title.trim() === '' && content.trim() === '') {
      navigation.goBack();
      return;
    }

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (noteId) {
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, {
          title,
          content,
          tags: tagArray,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          title,
          content,
          tags: tagArray,
          userId: user.uid,
          author: user.displayName || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la note.');
      console.error(err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          placeholder="Titre"
          value={title}
          onChangeText={setTitle}
          style={styles.title}
          multiline
        />
        <TextInput
          placeholder="Contenu"
          value={content}
          onChangeText={setContent}
          style={styles.content}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.fixedBottom}>
        <TextInput
          placeholder="Tags (séparés par des virgules)"
          value={tags}
          onChangeText={setTags}
          style={styles.tags}
        />
        <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.saveText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 4,
  },
  content: {
    fontSize: 16,
    minHeight: 200,
    lineHeight: 24,
  },
  fixedBottom: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  tags: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
