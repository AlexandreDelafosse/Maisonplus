import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';

export default function NotesScreen() {
  const [notes, setNotes] = useState<string[]>([]);
  const [text, setText] = useState('');

  const addNote = () => {
    if (text.trim()) {
      setNotes([...notes, text]);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Écris une note..."
        value={text}
        onChangeText={setText}
      />
      <Button title="Ajouter" onPress={addNote} />
      <FlatList
        data={notes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.note}>{item}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  input: { borderColor: '#ccc', borderWidth: 1, marginBottom: 8, padding: 8, borderRadius: 4 },
  note: { padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
});
