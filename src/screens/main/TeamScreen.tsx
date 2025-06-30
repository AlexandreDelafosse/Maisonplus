import React, { useEffect, useState, useMemo } from 'react';
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
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { db } from '../../services/firebaseConfig';
import { useMembership } from '../../context/MembershipContext';
import { sendEmailInvitation } from '../../services/email';

export default function TeamScreen() {
  const { membership, team, loading } = useMembership();
  const [users, setUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isCurrentUserAdmin = useMemo(() => membership?.role === 'admin', [membership]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!team?.id) return;
      console.log('🔁 Fetching members...');
      try {
        const q = query(collection(db, 'memberships'), where('teamId', '==', team.id));
        const snap = await getDocs(q);
        console.log('Membres trouvés:', snap.docs.length);

        const userDocs = await Promise.all(
          snap.docs.map((m) => getDoc(doc(db, 'users', m.data().userId)))
        );

        const members = userDocs.map((u, i) => {
          const memberData = snap.docs[i].data();
          return u.exists()
            ? {
                uid: u.id,
                role: memberData.role,
                membershipId: snap.docs[i].id,
                email: u.data()?.email || '—',
                displayName: u.data()?.displayName || '(Inconnu)',
              }
            : null;
        }).filter(Boolean);

        setUsers(members as any[]);
      } catch (err) {
        console.error('Erreur fetchMembers:', err);
        Alert.alert('Erreur', "Impossible de charger les membres.");
      }
    };

    fetchMembers();
  }, [team?.id, membership?.membershipId]);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !team?.id) return;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          await addDoc(collection(db, 'memberships'), {
            userId: userDoc.id,
            teamId: team.id,
            role: 'member',
            joinedAt: Timestamp.now(),
          });
          Alert.alert('Succès', 'Utilisateur ajouté à l’équipe.');
        }
      } else {
        const invitationRef = await addDoc(collection(db, 'invitations'), {
          email,
          teamId: team.id,
          teamName: team.name,
          invitedAt: new Date().toISOString(),
          status: 'pending',
        });

        await sendEmailInvitation(email, inviteFirstName || 'Inconnu', team.name, invitationRef.id);
        Alert.alert('Invitation envoyée', 'Un e-mail a été envoyé à cet utilisateur.');
      }

      setInviteEmail('');
      setInviteFirstName('');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’inviter cet utilisateur.');
    }
  };

  const removeFromTeam = async (membershipId: string) => {
    try {
      await deleteDoc(doc(db, 'memberships', membershipId));
      setUsers((prev) => prev.filter((u) => u.membershipId !== membershipId));
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de retirer ce membre.');
    }
  };

  const leaveTeam = async () => {
    if (!membership) return;
    try {
      await deleteDoc(doc(db, 'memberships', membership.membershipId));
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
            {item.displayName} {isCurrentUser ? '(moi)' : ''}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.role}>🔰 {item.role || 'membre'}</Text>
        </View>

        {!isCurrentUser && isCurrentUserAdmin && (
          <TouchableOpacity style={styles.removeButton} onPress={() => removeFromTeam(item.membershipId)}>
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

  if (!team?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Aucune équipe sélectionnée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 {team.name}</Text>

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
          ListHeaderComponent={<Text>Membres de l’équipe :</Text>}
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
  inviteContainer: { marginBottom: 20 },
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
