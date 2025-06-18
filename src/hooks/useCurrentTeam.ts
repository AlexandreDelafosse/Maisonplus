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
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const teamId = userSnap.data()?.teamId;

      if (teamId) {
        setTeamId(teamId);
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        if (teamSnap.exists()) {
          setTeamData(teamSnap.data());
        }
      }

      setLoading(false);
    };

    fetchTeam();
  }, []);

  return {
    teamId,
    setTeamId, // ← AJOUT ESSENTIEL !
    teamData,
    setTeamData,
    loading,
    setLoading,
  };
}
