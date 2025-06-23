import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotesListScreen from '../screens/main/notes/NotesListScreen';
import NoteEditorScreen from '../screens/main/notes/NoteEditorScreen';

export type NotesStackParamList = {
  NotesList: undefined;
  NoteEditor: { noteId?: string } | undefined;
};

const Stack = createNativeStackNavigator<NotesStackParamList>();

export default function NotesStack() {
  return (
    <Stack.Navigator initialRouteName="NotesList">
      <Stack.Screen name="NotesList" component={NotesListScreen} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ title: 'Éditer la note' }} />
    </Stack.Navigator>
  );
}
