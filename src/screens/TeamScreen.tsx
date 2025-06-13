// ../src/screens/TeamScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

type UserData = {
  uid: string;
  email: string;
  role: 'admin' | 'member';
  displayName: string;
};

export default function TeamScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const getCurrentUserRole = () => {
    return users.find((u) => u.uid === currentUid)?.role;
  };

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

  const renderItem = ({ item }: { item: UserData }) => (
    <View style={styles.userRow}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.displayName || '(Anonyme)'}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>🎭 {item.role}</Text>
      </View>

      {isAdmin && item.uid !== currentUid && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => toggleRole(item.uid, item.role)}
        >
          <Text style={styles.buttonText}>
            {item.role === 'admin' ? 'Rendre membre' : 'Nommer admin'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Équipe</Text>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  role: {
    fontSize: 14,
    marginTop: 4,
    color: '#444',
  },
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
  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: '#777',
  },
});
