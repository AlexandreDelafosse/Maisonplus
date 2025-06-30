import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Idea } from '../navigation/types';
import { useCurrentTeam } from './useCurrentTeam';

export function useTeamIdeas(): Idea[] {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const { teamId } = useCurrentTeam();

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, "ideas"),
      where("teamId", "==", teamId),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Idea[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Idea, 'id'>),
      }));
      setIdeas(list);
    });

    return () => unsubscribe();
  }, [teamId]);

  return ideas;
}
