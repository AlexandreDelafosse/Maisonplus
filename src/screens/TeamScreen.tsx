import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { sendEmailInvitation } from '../services/email';

type UserData = {
  uid: string;
  email: string;
  role: 'admin' | 'member';
  displayName: string;
  teamId?: string;
};

export default function TeamScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [teamsMap, setTeamsMap] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const loaded: UserData[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          uid: docSnap.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'member',
          teamId: data.teamId || '',
        });
      });
      setUsers(loaded);
    } catch (err) {
      Alert.alert('Erreur', "Impossible de charger les membres.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const snap = await getDocs(collection(db, 'teams'));
      const map: { [key: string]: string } = {};
      snap.forEach((doc) => {
        const name = doc.data().name;
        map[doc.id] = name;
      });
      setTeamsMap(map);
    } catch (err) {
      Alert.alert('Erreur', "Impossible de charger les équipes.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const getCurrentUserRole = () => {
    return users.find((u) => u.uid === currentUid)?.role;
  };

  const currentTeamId = users.find((u) => u.uid === currentUid)?.teamId || '';
  const currentTeamName = teamsMap[currentTeamId] || 'Aucune équipe';
  const isAdmin = getCurrentUserRole() === 'admin';

  const toggleRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === uid ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      Alert.alert('Erreur', "Impossible de modifier le rôle.");
      console.error(err);
    }
  };

  const assignTeam = async (uid: string, teamId: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { teamId });
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === uid ? { ...user, teamId } : user
        )
      );
    } catch (err) {
      Alert.alert('Erreur', "Impossible de changer l'équipe.");
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    if (!currentTeamId) {
      Alert.alert('Erreur', 'Aucune équipe sélectionnée pour l’ajout.');
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const userDoc = snap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { teamId: currentTeamId });
          Alert.alert('Succès', 'Utilisateur ajouté à l’équipe.');
          fetchUsers();
        } else {
          Alert.alert('Erreur', "Cet utilisateur n'a pas encore de profil.");
        }
      } else {
        const docRef = await addDoc(collection(db, 'invitations'), {
          email,
          teamId: currentTeamId,
          status: 'pending',
          invitedAt: new Date().toISOString(),
        });

        await sendEmailInvitation(email, inviteFirstName || 'inconnu', currentTeamName, docRef.id);
        Alert.alert('Invitation envoyée', 'Un e-mail a été envoyé à cet utilisateur.');
      }

      setInviteEmail('');
      setInviteFirstName('');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible d'inviter cet utilisateur.");
    }
  };

  const removeFromTeam = async (uid: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), { teamId: '' });
    setUsers((prev) =>
      prev.map((user) => (user.uid === uid ? { ...user, teamId: '' } : user))
    );
    Alert.alert('Succès', 'Utilisateur retiré de l’équipe.');
  } catch (err) {
    console.error(err);
    Alert.alert('Erreur', "Impossible de retirer l'utilisateur.");
  }
};

const leaveTeam = async () => {
  if (!currentUid) return;
  try {
    await updateDoc(doc(db, 'users', currentUid), { teamId: '' });
    setUsers((prev) =>
      prev.map((user) => (user.uid === currentUid ? { ...user, teamId: '' } : user))
    );
    Alert.alert('Succès', 'Vous avez quitté l’équipe.');
  } catch (err) {
    console.error(err);
    Alert.alert('Erreur', "Impossible de quitter l’équipe.");
  }
};


const renderItem = ({ item }: { item: UserData }) => {
  const isCurrentUser = item.uid === currentUid;

  return (
    <View style={styles.userRow}>
      <View style={styles.info}>
        <Text style={styles.name}>
          {item.displayName || '(Anonyme)'} {isCurrentUser ? '(moi)' : ''}
        </Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>🌟 {item.role}</Text>
        <Text style={styles.role}>
          🏷️ {item.teamId && teamsMap[item.teamId] ? teamsMap[item.teamId] : 'Aucune équipe'}
        </Text>
      </View>

      {isAdmin && !isCurrentUser && item.teamId ? (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromTeam(item.uid)}
        >
          <Text style={styles.removeButtonText}>Retirer de l’équipe</Text>
        </TouchableOpacity>
      ) : null}

      {isCurrentUser && item.teamId ? (
        <TouchableOpacity
          style={styles.quitButton}
          onPress={leaveTeam}
        >
          <Text style={styles.quitButtonText}>Quitter l’équipe</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};



  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 {currentTeamName}</Text>

      {isAdmin && (
        <View style={styles.inviteContainer}>
          <TextInput
            style={styles.input}
            placeholder="Prénom de l'invité"
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

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun membre trouvé.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
userRow: {
  flexDirection: 'column',
  gap: 10,
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderColor: '#eee',
},

  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  email: { fontSize: 14, color: '#666' },
  role: { fontSize: 14, marginTop: 4, color: '#444' },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  empty: { textAlign: 'center', marginTop: 30, color: '#777' },
  inviteContainer: {
    marginBottom: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  inviteButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },removeButton: {
  backgroundColor: '#FF3B30',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
  alignSelf: 'flex-start',
  marginTop: 8,
},
removeButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 12,
},
quitButton: {
  backgroundColor: '#FFA500',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
  alignSelf: 'flex-start',
  marginTop: 8,
},
quitButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 12,
},

});
