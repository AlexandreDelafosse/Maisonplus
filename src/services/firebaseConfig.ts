import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAR8kanvI7513NtGejpzN7dQo5Pppx6BJA",
  authDomain: "maisonnplus.firebaseapp.com",
  projectId: "maisonnplus",
  storageBucket: "maisonnplus.appspot.com",
  messagingSenderId: "602416329751",
  appId: "1:602416329751:web:434489ea701c765dca5852"
};

// Initialisation propre
const app = initializeApp(firebaseConfig);

// Auth avec persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore
const db = getFirestore(app);

export { auth, db };
