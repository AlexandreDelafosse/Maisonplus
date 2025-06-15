// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

type UserData = {
  uid: string;
  email: string;
  role: 'admin' | 'member';
  displayName: string;
  teamId?: string;
};


const UserContext = createContext<UserData | null>(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          const role = docSnap.exists() ? docSnap.data().role || 'member' : 'member';

          setUserData({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role,
          });
        } catch (error) {
          console.error('Erreur récupération user :', error);
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
};
