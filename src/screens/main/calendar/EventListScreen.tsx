import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { useCurrentTeam } from '../../../hooks/useCurrentTeam';

interface EventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  createdByName?: string;
  type: string;
}

const typeColorMap: Record<string, string> = {
  Réunion: '#007AFF',
  Anniversaire: '#FF9500',
  Sortie: '#34C759',
  Perso: '#8E8E93',
};

const EventListScreen = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredType, setFilteredType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { teamId } = useCurrentTeam();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!teamId) return;

      const q = query(collection(db, 'calendarevents'), where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);

      const fetched: EventType[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description || '',
          start: data.start.toDate(),
          end: data.end.toDate(),
          createdByName: data.createdByName || '',
          type: data.type || 'Autre',
        };
      });

      const sorted = fetched.sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(sorted);
      setLoading(false);
    };

    fetchEvents();
  }, [teamId]);

  const filteredEvents = filteredType
    ? events.filter((e) => e.type === filteredType)
    : events;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Liste des événements</Text>

      <View style={styles.filterContainer}>
        {['Tous', 'Réunion', 'Anniversaire', 'Sortie', 'Perso'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filteredType === (type === 'Tous' ? null : type) && styles.activeFilter,
            ]}
            onPress={() => setFilteredType(type === 'Tous' ? null : type)}
          >
            <Text style={styles.filterText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.eventCard, { borderLeftColor: typeColorMap[item.type] || '#ccc' }]}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventMeta}>
                {item.start.toLocaleDateString()} à {item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.eventType}>{item.type}</Text>
              {item.description ? <Text style={styles.eventDesc}>{item.description}</Text> : null}
              <Text style={styles.eventCreator}>👤 {item.createdByName}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40 }}>Aucun événement trouvé.</Text>
          }
        />
      )}
    </View>
  );
};

export default EventListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    color: '#000',
  },
  eventCard: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventMeta: {
    fontSize: 13,
    color: '#555',
  },
  eventType: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  eventDesc: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  eventCreator: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
});
