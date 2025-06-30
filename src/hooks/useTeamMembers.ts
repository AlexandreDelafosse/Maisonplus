// ✅ useTeamMembers.ts
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useCurrentTeam } from './useCurrentTeam';
import { User } from '../navigation/types';

export type Member = {
  user: any;
  id: string;
  displayName: string;
};

interface Membership {
  user: User;
  role: 'admin' | 'member';
  joinedAt: Date | any;
}

export function useTeamMembers(p0: string): { members: Member[]; loading: boolean } {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { teamId } = useCurrentTeam();

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'memberships'),
      where('teamId', '==', teamId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawList: (Member | null)[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const membership = docSnap.data();
          const userSnap = await getDoc(doc(db, 'users', membership.userId));

          if (!userSnap.exists()) return null;

          const userData = userSnap.data();
          if (!userData?.email) return null;

          return {
            id: userSnap.id,
            displayName: userData.displayName || userData.firstName || userData.email,
            user: {
              id: userSnap.id,
              email: userData.email,
              displayName: userData.displayName,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          };

        })
      );

      const list = rawList.filter((m): m is Member => m !== null);
      setMembers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  return { members, loading };
}
