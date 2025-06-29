import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useCurrentTeam } from '../../hooks/useCurrentTeam';
import { db } from '../../services/firebaseConfig';
import { sendEmailInvitation } from '../../services/email';

export default function TeamScreen() {
  const { teamId, teamData, setLoading, loading } = useCurrentTeam();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [users, setUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');

  const isCurrentUserAdmin = useMemo(() => {
    return users.find((u) => u.uid === currentUser?.uid)?.role === 'admin';
  }, [users, currentUser?.uid]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId || !teamData?.members) return;

      setLoading(true);

      try {
        const snapshots = await Promise.all(
          teamData.members.map((uid: string) => getDoc(doc(db, 'users', uid)))
        );

        const loaded = snapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ uid: snap.id, ...snap.data() }));

        setUsers(loaded);
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger les membres.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId, teamData]);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !teamId) return;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { teamId });
          Alert.alert('Succès', 'Utilisateur ajouté à l’équipe.');
        }
      } else {
        const invitationRef = await addDoc(collection(db, 'invitations'), {
          email,
          teamId,
          teamName: teamData.name, // 👈 Ajout nécessaire
          invitedAt: new Date().toISOString(),
          status: 'pending',
        });
        await sendEmailInvitation(email, inviteFirstName || 'inconnu', teamData.name, invitationRef.id);
        Alert.alert('Invitation envoyée', 'Un e-mail a été envoyé à cet utilisateur.');
      }

      setInviteEmail('');
      setInviteFirstName('');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’inviter cet utilisateur.');
    }
  };

  const removeFromTeam = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { teamId: '' });
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de retirer ce membre.');
    }
  };

  const leaveTeam = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { teamId: '' });
      Alert.alert('Succès', 'Vous avez quitté l’équipe.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de quitter l’équipe.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCurrentUser = item.uid === currentUser?.uid;

    return (
      <View style={styles.userRow}>
        <View>
          <Text style={styles.name}>
            {item.displayName || '(Anonyme)'} {isCurrentUser ? '(moi)' : ''}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.role}>🔰 {item.role || 'membre'}</Text>
        </View>

        {!isCurrentUser && isCurrentUserAdmin && (
          <TouchableOpacity style={styles.removeButton} onPress={() => removeFromTeam(item.uid)}>
            <Text style={styles.removeButtonText}>Retirer</Text>
          </TouchableOpacity>
        )}

        {isCurrentUser && (
          <TouchableOpacity style={styles.quitButton} onPress={leaveTeam}>
            <Text style={styles.quitButtonText}>Quitter</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 {teamData?.name || 'Équipe'}</Text>

      {isCurrentUserAdmin && (
        <View style={styles.inviteContainer}>
          <TextInput
            style={styles.input}
            placeholder="Prénom de l’invité"
            value={inviteFirstName}
            onChangeText={setInviteFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email à inviter"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Text style={styles.inviteButtonText}>Inviter</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>Aucun membre.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  userRow: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  name: { fontSize: 16, fontWeight: '600' },
  email: { fontSize: 14, color: '#555' },
  role: { fontSize: 14, color: '#666' },
  removeButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  removeButtonText: { color: '#fff', fontWeight: 'bold' },
  quitButton: {
    backgroundColor: '#ffa500',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  quitButtonText: { color: '#fff', fontWeight: 'bold' },
  inviteContainer: { marginBottom: 20, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: '#28a745',
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  inviteButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 30 },
});
