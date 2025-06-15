import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotesStack from '../navigation/NotesStack'; // 🔥 stack complet, pas juste NotesList
import { TasksScreen } from '../screens/TasksScreen';
import  ProfileScreen  from '../screens/ProfileScreen';
import  TeamScreen  from '../screens/TeamScreen';
import CalendarScreen from '../screens/CalendarScreen';
import BudgetScreen from '../screens/BudgetScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Mes Notes" component={NotesStack} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Team" component={TeamScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
    </Tab.Navigator>
  );
}
