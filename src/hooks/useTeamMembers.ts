import { useEffect, useState } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useCurrentTeam } from './useCurrentTeam';

export type Member = {
  id: string;
  displayName: string;
  email?: string;
  role?: string;
};

export function useTeamMembers(p0: any) {
  const { teamId, loading: teamLoading } = useCurrentTeam();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamLoading) return;

    const fetchMembers = async () => {
      if (!teamId) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'users'), where('teamId', '==', teamId));
      const snapshot = await getDocs(q);

      const list: Member[] = snapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || 'Anonyme',
        email: doc.data().email,
        role: doc.data().role,
      }));

      setMembers(list);
      setLoading(false);
    };

    fetchMembers();
  }, [teamId, teamLoading]);

  return { members, loading };
}
