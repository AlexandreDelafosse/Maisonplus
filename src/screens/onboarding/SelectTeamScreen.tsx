import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert,
} from 'react-native';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Team } from '../../navigation/types';
import { useMembership } from '../../context/MembershipContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectTeam'>;

export default function SelectTeamScreen({ navigation }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const { setTeamId, membership, team } = useMembership();
  const user = getAuth().currentUser;

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (pendingTeamId && membership?.teamId === pendingTeamId && team?.id === pendingTeamId) {
      setPendingTeamId(null);
      navigation.replace('Main');
    }
  }, [membership, team, pendingTeamId]);

  const fetchTeams = async () => {
    if (!user) return;

    const q = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const membershipSnap = await getDocs(q);
    const memberships = membershipSnap.docs.map((doc) => doc.data());

    const teamDocs = await Promise.all(
      memberships.map(async (m) => {
        const teamSnap = await getDoc(doc(db, 'teams', m.teamId));
        return teamSnap.exists()
          ? { id: teamSnap.id, ...teamSnap.data() } as Team
          : null;
      })
    );

    const validTeams = teamDocs.filter((t): t is Team => t !== null);

    if (validTeams.length === 0) {
      navigation.replace('CreateTeam');
      return;
    }

    setTeams(validTeams);
  };

const handleSelect = (teamId: string) => {
  console.log('✅ Team selected:', teamId);
  setTeamId(teamId);
  setPendingTeamId(teamId);
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
            const q = query(collection(db, 'memberships'), where('teamId', '==', teamId));
            const snap = await getDocs(q);
            const batch = writeBatch(db);
            snap.docs.forEach((doc) => batch.delete(doc.ref));
            batch.delete(doc(db, 'teams', teamId));
            await batch.commit();
            fetchTeams();
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
        <Text style={[styles.teamText, { color: '#fff', textAlign: 'center' }]}>+ Créer une équipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 75 },
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
