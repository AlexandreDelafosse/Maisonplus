import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useCurrentTeam } from '../../hooks/useCurrentTeam';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectTeam'>;

export default function SelectTeamScreen({ navigation }: Props) {
  const [teams, setTeams] = useState<any[]>([]);
  const { setTeamId, setTeamData } = useCurrentTeam();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;

      const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (results.length === 0) {
        navigation.replace('CreateTeam'); // Redirige si aucune team
        return;
      }

      setTeams(results);
    };

    fetchTeams();
  }, []);

  const handleSelect = async (teamId: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Sauvegarde du teamId dans Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId,
      });
    }

    setTeamId(teamId);
    setTeamData(null); // réinitialise pour forcer le rechargement
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes équipes</Text>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.teamItem} onPress={() => handleSelect(item.id)}>
            <Text style={styles.teamText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.teamItem, { backgroundColor: '#007AFF' }]}
        onPress={() => navigation.navigate('CreateTeam')}
      >
        <Text style={[styles.teamText, { color: '#fff', textAlign: 'center' }]}>
          + Créer une équipe
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  teamItem: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  teamText: {
    fontSize: 16,
  },
});
