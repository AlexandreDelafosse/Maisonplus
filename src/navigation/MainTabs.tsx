import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotesStack from '../navigation/NotesStack';
import { TasksScreen } from '../screens/main/TasksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TeamScreen from '../screens/main/TeamScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import { useCurrentTeam } from '../hooks/useCurrentTeam';
import { hasFeature } from '../utils/TeamFeaturesManager';
import NotesScreen from '../screens/main/NotesScreen';
import ChatScreen from '../screens/main/ChatScreen';
import { ActivityIndicator, View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { teamData, loading } = useCurrentTeam();

  console.log('teamData', teamData);
console.log('loading', loading);


  // 💡 Affiche un spinner pendant le chargement
  if (loading || !teamData?.pack) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pack = teamData.pack;

  return (
<Tab.Navigator>
  {hasFeature(pack, 'tasks') && (
    <Tab.Screen name="Tasks" component={TasksScreen} />
  )}
  {hasFeature(pack, 'calendar') && (
    <Tab.Screen name="Calendar" component={CalendarScreen} />
  )}
  {hasFeature(pack, 'notes') && (
    <Tab.Screen name="Notes" component={NotesStack} /> // ✅ pas NotesScreen !
  )}
  {hasFeature(pack, 'budget') && (
    <Tab.Screen name="Budget" component={BudgetScreen} />
  )}
  {hasFeature(pack, 'chat') && (
    <Tab.Screen name="Chat" component={ChatScreen} />
  )}

  {/* 👇 Toujours visibles, peu importe le pack */}
  <Tab.Screen name="Team" component={TeamScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>

  );
}
