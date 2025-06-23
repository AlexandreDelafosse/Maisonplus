import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CalendarScreen from './CalendarScreen';
import EventListScreen from './EventListScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

type ViewMode = 'calendar' | 'list';

export default function CalendarSwitcherScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // 🔄 Charger le dernier mode depuis AsyncStorage
  useEffect(() => {
    const loadMode = async () => {
      const saved = await AsyncStorage.getItem('calendarViewMode');
      if (saved === 'list' || saved === 'calendar') {
        setViewMode(saved);
      }
    };
    loadMode();
  }, []);

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem('calendarViewMode', mode);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'calendar' && styles.active]}
          onPress={() => switchMode('calendar')}
        >
          <Text style={viewMode === 'calendar' ? styles.activeText : styles.inactiveText}>
            🗓️ Calendrier
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'list' && styles.active]}
          onPress={() => switchMode('list')}
        >
          <Text style={viewMode === 'list' ? styles.activeText : styles.inactiveText}>
            📋 Liste
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🌟 Animation fluide */}
      <Animatable.View key={viewMode} animation="fadeIn" duration={300} style={{ flex: 1 }}>
        {viewMode === 'calendar' ? <CalendarScreen /> : <EventListScreen />}
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  switchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  active: {
    backgroundColor: '#007aff',
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#333',
  },
});
