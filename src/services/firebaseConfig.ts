// services/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAR8kanvI7513NtGejpzN7dQo5Pppx6BJA',
  authDomain: 'maisonnplus.firebaseapp.com',
  projectId: 'maisonnplus',
  storageBucket: 'maisonnplus.appspot.com',
  messagingSenderId: '602416329751',
  appId: '1:602416329751:web:434489ea701c765dca5852',
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = initializeFirestore(app, {
  localCache: persistentLocalCache(), // 🛠️ FIX ICI
});

export { auth, db };
