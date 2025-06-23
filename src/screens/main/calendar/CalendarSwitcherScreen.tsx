import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CalendarScreen from './CalendarScreen';
import EventListScreen from './EventListScreen';

export default function CalendarSwitcherScreen() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'calendar' && styles.active]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={viewMode === 'calendar' ? styles.activeText : styles.inactiveText}>
            🗓️ Calendrier
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, viewMode === 'list' && styles.active]}
          onPress={() => setViewMode('list')}
        >
          <Text style={viewMode === 'list' ? styles.activeText : styles.inactiveText}>
            📋 Liste
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? <CalendarScreen /> : <EventListScreen />}
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
