import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // ✅ correction
import { db } from '../services/firebaseConfig'; // ✅ utilise `db`
import { useCurrentTeam } from './useCurrentTeam';
import { ChatMessage } from '../navigation/types';

export function useTeamChat() {
  const { teamId } = useCurrentTeam(); // ✅ pas currentTeamId
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'chat'),
      where('teamId', '==', teamId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [teamId]);

  return messages;
}
