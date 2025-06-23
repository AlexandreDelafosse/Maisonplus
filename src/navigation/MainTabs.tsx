// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotesStack from './NotesStack';
import { TasksScreen } from '../screens/main/TasksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TeamScreen from '../screens/main/TeamScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import { useCurrentTeam } from '../hooks/useCurrentTeam';
import { hasFeature } from '../utils/TeamFeaturesManager';
import ChatScreen from '../screens/main/ChatScreen';
import IdeasStackNavigator from './IdeasStack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View } from 'react-native';

// ✅ Nouveau composant qui gère la bascule liste/calendrier
import CalendarSwitcherScreen from '../screens/main/calendar/CalendarSwitcherScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { teamData, loading } = useCurrentTeam();

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
        <Tab.Screen
          name="Calendar"
          component={CalendarSwitcherScreen}
          options={{
            tabBarLabel: 'Calendrier',
            tabBarIcon: ({ color, size }) => (
              <Icon name="calendar" size={size} color={color} />
            ),
          }}
        />
      )}

      {hasFeature(pack, 'notes') && (
        <Tab.Screen name="Notes" component={NotesStack} />
      )}

      {hasFeature(pack, 'budget') && (
        <Tab.Screen name="Budget" component={BudgetScreen} />
      )}

      {hasFeature(pack, 'chat') && (
        <Tab.Screen name="Chat" component={ChatScreen} />
      )}

      {hasFeature(pack, 'ideas') && (
        <Tab.Screen
          name="Ideas"
          component={IdeasStackNavigator}
          options={{
            tabBarLabel: 'Idées',
            tabBarIcon: ({ color, size }) => (
              <Icon name="lightbulb" size={size} color={color} />
            ),
          }}
        />
      )}

      <Tab.Screen name="Team" component={TeamScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
