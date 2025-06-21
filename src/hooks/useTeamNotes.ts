import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // ✅ correction
import { db } from '../services/firebaseConfig'; // ✅ utilise `db`
import { useCurrentTeam } from './useCurrentTeam';
import { Note } from '../navigation/types'; // ✅ bien depuis types.ts

export function useTeamNotes() {
  const { teamId } = useCurrentTeam(); // ✅ pas currentTeamId
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'notes'),
      where('teamId', '==', teamId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(fetchedNotes);
    });

    return unsubscribe;
  }, [teamId]);

  return notes;
}
