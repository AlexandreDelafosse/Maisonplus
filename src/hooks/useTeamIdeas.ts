import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { Idea } from '../navigation/types';
import { useCurrentTeam } from './useCurrentTeam';

export function useTeamIdeas(): Idea[] {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const { teamId } = useCurrentTeam();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!teamId || !user) return;

    const q = query(collection(db, "ideas"), where("teamId", "==", teamId), orderBy("createdAt"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Idea[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Idea, 'id'>),
      }));
      setIdeas(list);
    });

    return () => unsubscribe();
  }, [teamId, user]);

  return ideas;
}
