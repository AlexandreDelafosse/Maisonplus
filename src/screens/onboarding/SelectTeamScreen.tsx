import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert,
} from 'react-native';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    if (!user) return;

    const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (results.length === 0) {
      navigation.replace('CreateTeam');
      return;
    }

    setTeams(results);
  };

  const handleSelect = async (teamId: string) => {
    const currentUser = getAuth().currentUser;
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        teamId,
      });
    }

    setTeamId(teamId);
    setTeamData(null);
    navigation.replace('Main');
  };

  const handleDelete = (teamId: string, teamName: string) => {
    Alert.alert(
      'Supprimer cette équipe ?',
      `Es-tu sûr de vouloir supprimer l'équipe "${teamName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'teams', teamId));
            fetchTeams(); // Recharge les équipes
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes équipes</Text>

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.teamRow}>
            <TouchableOpacity style={styles.teamItem} onPress={() => handleSelect(item.id)}>
              <Text style={styles.teamText}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
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
  container: { flex: 1, padding: 20, paddingTop: 75 ,},
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamItem: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  teamText: {
    fontSize: 16,
  },
  deleteText: {
    color: 'red',
    fontSize: 20,
    marginLeft: 10,
    padding: 10,
  },
});
