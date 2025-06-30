import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useCurrentTeam } from './useCurrentTeam';
import { Note } from '../navigation/types';

export function useTeamNotes(): Note[] {
  const [notes, setNotes] = useState<Note[]>([]);
  const { teamId } = useCurrentTeam();

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'notes'),
      where('teamId', '==', teamId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Note[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Note, 'id'>),
      }));
      setNotes(list);
    });

    return () => unsubscribe();
  }, [teamId]);

  return notes;
}
