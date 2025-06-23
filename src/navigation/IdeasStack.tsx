// src/navigation/IdeasStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IdeasListScreen from '../screens/main/ideas/IdeasListScreen';
import IdeaEditorScreen from '../screens/main/ideas/IdeaEditorScreen';
import IdeaDetailScreen from '../screens/main/ideas/IdeaDetailScreen';

export type IdeasStackParamList = {
  IdeasList: undefined;
  IdeaEditor: { ideaId?: string }; // si tu veux réutiliser pour éditer
  IdeaDetail: { ideaId: string };  // ← ✅ AJOUTE CECI
  IdeasStats: undefined;           // ← si tu veux la page stats aussi
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
            <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
    </Stack.Navigator>
  );
}
