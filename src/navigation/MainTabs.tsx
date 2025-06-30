import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import NotesStack from './NotesStack';
import { TasksScreen } from '../screens/main/TasksScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TeamScreen from '../screens/main/TeamScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import ChatScreen from '../screens/main/ChatScreen';
import CalendarSwitcherScreen from '../screens/main/calendar/CalendarSwitcherScreen';
import IdeasStackNavigator from './IdeasStack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { hasFeature } from '../utils/TeamFeaturesManager';
import { useMembership } from '../context/MembershipContext'; // ✅ nouveau hook

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { team, loading } = useMembership(); // ✅ remplacé
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!loading && !team?.pack) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SelectTeam' }],
      });
    }
  }, [loading, team]);

  if (loading || !team?.pack) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pack = team.pack;

  return (
    <Tab.Navigator>
      {hasFeature(pack, 'tasks') && <Tab.Screen name="Tasks" component={TasksScreen} />}

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

      {hasFeature(pack, 'notes') && <Tab.Screen name="Notes" component={NotesStack} />}
      {hasFeature(pack, 'budget') && <Tab.Screen name="Budget" component={BudgetScreen} />}
      {hasFeature(pack, 'chat') && <Tab.Screen name="Chat" component={ChatScreen} />}

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

      <Tab.Screen
  name="Team"
  component={TeamScreen}
  options={{
    tabBarLabel: 'Team',
    tabBarIcon: ({ color, size }) => (
      <Icon name="account-group" size={size} color={color} />
    ),
  }}
/>

      <Tab.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    tabBarLabel: 'Profil',
    tabBarIcon: ({ color, size }) => (
      <Icon name="account-circle" size={size} color={color} />
    ),
  }}
/>

    </Tab.Navigator>
  );
}
