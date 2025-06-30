// src/context/MembershipContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../services/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { Team } from '../navigation/types';

export interface Membership {
  userId: string;
  teamId: string;
  role: 'admin' | 'member';
  membershipId: string;
  displayName?: string;
  email: string;
}

type MembershipContextType = {
  membership: Membership | null;
  team: Team | null;
  teamId: string | null;
  setTeamId: (id: string | null) => void;
  loading: boolean;
  setLoading: (val: boolean) => void;
};

const MembershipContext = createContext<MembershipContextType>({
  membership: null,
  team: null,
  teamId: null,
  setTeamId: () => {},
  loading: true,
  setLoading: () => {},
});

export const useMembership = () => useContext(MembershipContext);

export const MembershipProvider = ({ children }: { children: React.ReactNode }) => {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    setMembership(null);
    setTeam(null);
    setTeamId(null);
    setLoading(false);
    return;
  }

  const q = query(collection(db, 'memberships'), where('userId', '==', user.uid));
  const unsubscribe = onSnapshot(q, async (snap) => {
    if (snap.empty) {
      setMembership(null);
      setTeam(null);
      setTeamId(null);
      setLoading(false);
      return;
    }

    let selectedDoc = snap.docs[0];
    if (teamId) {
      const match = snap.docs.find(doc => doc.data().teamId === teamId);
      if (match) selectedDoc = match;
    }

    const data = selectedDoc.data();
    setTeamId(data.teamId);

    setMembership({
      membershipId: selectedDoc.id,
      userId: data.userId,
      teamId: data.teamId,
      role: data.role,
      displayName: user.displayName || '',
      email: user.email || '',
    });

    const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
    if (teamSnap.exists()) {
      setTeam({ id: teamSnap.id, ...teamSnap.data() } as Team);
    } else {
      setTeam(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, [teamId]); // 👈 AJOUT DE teamId DANS LES DÉPENDANCES


  return (
    <MembershipContext.Provider
      value={{ membership, team, teamId, setTeamId, loading, setLoading }}
    >
      {children}
    </MembershipContext.Provider>
  );
};
