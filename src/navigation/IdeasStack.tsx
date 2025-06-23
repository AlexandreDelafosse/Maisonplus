// src/navigation/IdeasStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IdeasListScreen from '../screens/main/IdeasListScreen';
import IdeaEditorScreen from '../screens/main/IdeaEditorScreen';

export type IdeasStackParamList = {
  IdeasList: undefined;
  IdeaEditor: { ideaId?: string };
};

const Stack = createNativeStackNavigator<IdeasStackParamList>();

export default function IdeasStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="IdeasList"
        component={IdeasListScreen}
        options={{ title: '💡 Boîte à idées' }}
      />
      <Stack.Screen
        name="IdeaEditor"
        component={IdeaEditorScreen}
        options={{ title: '✍️ Modifier l’idée' }}
      />
    </Stack.Navigator>
  );
}
