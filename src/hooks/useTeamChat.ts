import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useCurrentTeam } from './useCurrentTeam';
import { ChatMessage } from '../navigation/types';

export function useTeamChat() {
  const { teamId } = useCurrentTeam();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'chat'),
      where('teamId', '==', teamId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ChatMessage, 'id'>),
      }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [teamId]);

  return messages;
}
