import { useEffect, useState } from 'react';
import { db } from '../services/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { useCurrentTeam } from './useCurrentTeam';

export interface TeamTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'todo' | 'inProgress' | 'done';
  assignedTo?: string[];
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  createdBy: string;
  teamId: string;
}

export const useTeamTasks = (p0: string) => {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { teamId } = useCurrentTeam(); // ✅ on récupère le teamId actif

  useEffect(() => {
    if (!teamId) return;

    const q = query(collection(db, 'tasks'), where('teamId', '==', teamId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: TeamTask[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description || '',
          dueDate: data.dueDate?.toDate?.() || undefined,
          status: (data.status as TeamTask['status']) || 'todo',
          assignedTo: data.assignedTo || [],
          recurrence: (data.recurrence as TeamTask['recurrence']) || 'none',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
          teamId: data.teamId,
        };
      });

      setTasks(taskList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  const addTask = async (task: Omit<TeamTask, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: Timestamp.now(),
    });
  };

  const deleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  const updateTask = async (taskId: string, updates: Partial<TeamTask>) => {
    await updateDoc(doc(db, 'tasks', taskId), updates);
  };

  return {
    tasks,
    loading,
    addTask,
    deleteTask,
    updateTask,
  };
};
