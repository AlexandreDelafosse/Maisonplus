import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useMembership } from '../context/MembershipContext';
interface Team {
  id: string;
  name: string;
  pack?: string;
  [key: string]: any;
}

export interface Membership {
  id: string;
  userId: string;
  teamId: string;
  role: 'admin' | 'member';
  joinedAt: Date | Timestamp;
}

export function useCurrentTeam() {
  const {
    membership,
    team,
    teamId,
    setTeamId,
    loading,
  } = useMembership();

  return {
    membership,
    team,
    teamId,
    setTeamId,
    loading,
  };
}
