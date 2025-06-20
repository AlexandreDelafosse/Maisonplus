import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export function useCurrentTeam() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchTeam = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setTeamId(null);
      setTeamData(null);
      setLoading(false);
      return;
    }

    let finalTeamId = teamId;

    // 🧠 Si pas de teamId fourni par props, on va le chercher dans Firestore
    if (!finalTeamId) {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      finalTeamId = userSnap.data()?.teamId || null;
    }

    if (finalTeamId) {
      const teamSnap = await getDoc(doc(db, 'teams', finalTeamId));
      if (teamSnap.exists()) {
        setTeamData(teamSnap.data());
        setTeamId(finalTeamId);
      } else {
        setTeamData(null);
      }
    } else {
      setTeamData(null);
    }

    setLoading(false);
  };

  fetchTeam();
}, [teamId]); // 👈 écoute les changements de teamId


  return {
    teamId,
    setTeamId, // ← AJOUT ESSENTIEL !
    teamData,
    setTeamData,
    loading,
    setLoading,
  };
}
