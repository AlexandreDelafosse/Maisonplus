import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useCurrentTeam } from '../../hooks/useCurrentTeam';
import { Idea } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IdeasStackParamList } from '../../navigation/types';
import { getAuth } from 'firebase/auth';

type ExtendedIdea = Idea & {
  hasVoted?: boolean;
  voters: string[];
};

export default function IdeasListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<IdeasStackParamList>>();
  const { teamId } = useCurrentTeam();
  const [ideas, setIdeas] = useState<ExtendedIdea[]>([]);

  const fetchIdeas = useCallback(async () => {
    try {
      if (!teamId) return;
      const user = getAuth().currentUser;
      const userId = user?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'ideas'),
        where('teamId', '==', teamId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ideasData: ExtendedIdea[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Idea, 'id'>;
        const voteCollectionRef = collection(db, 'ideas', docSnap.id, 'votes');
        const voteSnapshots = await getDocs(voteCollectionRef);

        const votersIds: string[] = [];
        const votersNames: string[] = [];

        for (const vote of voteSnapshots.docs) {
          const voterId = vote.id;
          votersIds.push(voterId);

          const userDoc = await getDoc(doc(db, 'users', voterId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            votersNames.push(userData.name || userData.email || 'Anonyme');
          } else {
            votersNames.push('Anonyme');
          }
        }

        const hasVoted = votersIds.includes(userId);

        ideasData.push({
          id: docSnap.id,
          ...data,
          hasVoted,
          voters: votersNames
        });
      }

      setIdeas(ideasData);
    } catch (error) {
      console.error('Erreur lors du chargement des idées :', error);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      fetchIdeas();
    }, [fetchIdeas])
  );

  const handleVote = async (ideaId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const userId = user.uid;
      const voteDocRef = doc(db, 'ideas', ideaId, 'votes', userId);
      const voteDoc = await getDoc(voteDocRef);

      if (voteDoc.exists()) return;

      const ideaRef = doc(db, 'ideas', ideaId);
      await updateDoc(ideaRef, {
        votes: increment(1)
      });

      await setDoc(voteDocRef, {
        voted: true,
        email: user.email || '',
      });

      fetchIdeas();
    } catch (error) {
      console.error('Erreur lors du vote :', error);
    }
  };

  const handleUnvote = async (ideaId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const userId = user.uid;
      const voteDocRef = doc(db, 'ideas', ideaId, 'votes', userId);
      const voteDoc = await getDoc(voteDocRef);

      if (!voteDoc.exists()) return;

      await updateDoc(doc(db, 'ideas', ideaId), {
        votes: increment(-1)
      });

      await deleteDoc(voteDocRef);

      fetchIdeas();
    } catch (error) {
      console.error('Erreur lors du retrait du vote :', error);
    }
  };

  const renderItem = ({ item }: { item: ExtendedIdea }) => {
    const currentUser = getAuth().currentUser;
    const currentDisplay = currentUser?.displayName || currentUser?.email || 'Anonyme';

    return (
      <View style={styles.ideaItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('IdeaEditor', { ideaId: item.id })}
        >
          <Text style={styles.ideaTitle}>{item.title}</Text>
          {item.description ? (
            <Text numberOfLines={1} style={styles.ideaDescription}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.voteCount}>Votes : {item.votes || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            item.hasVoted ? styles.voteButtonDisabled : null
          ]}
          onPress={() =>
            item.hasVoted ? handleUnvote(item.id) : handleVote(item.id)
          }
        >
          <Text style={styles.voteButtonText}>
            {item.hasVoted ? '🗑 Retirer mon vote' : '👍 Voter'}
          </Text>
        </TouchableOpacity>

        {item.voters.length > 0 && (
          <Text style={styles.voterList}>
            Votants :{' '}
            {item.voters
              .map((name) =>
                name === currentDisplay ? `${name} ✅` : name
              )
              .join(', ')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ideas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune idée pour l’instant.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate({
            name: 'IdeaEditor',
            params: {},
          })
        }
      >
        <Text style={styles.addButtonText}>+ Ajouter une idée</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  ideaItem: {
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12
  },
  ideaTitle: { fontSize: 16, fontWeight: 'bold' },
  ideaDescription: { fontSize: 14, color: '#555' },
  voteCount: { marginTop: 6, color: '#333' },
  voteButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  voteButtonDisabled: {
    backgroundColor: '#ccc'
  },
  voteButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  voterList: {
    marginTop: 6,
    fontSize: 12,
    color: '#666'
  },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});
