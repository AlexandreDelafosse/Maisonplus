// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

type UserData = {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
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

          if (docSnap.exists()) {
            const data = docSnap.data();

            setUserData({
              uid: user.uid,
              email: user.email || '',
              displayName: data.displayName || user.displayName || '',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
            });
          } else {
            setUserData({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
            });
          }
        } catch (error) {
          console.error('Erreur récupération user :', error);
          setUserData(null);
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
