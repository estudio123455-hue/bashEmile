import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6O1JN62XiZV8PWNOq9S2KZwqEHWRYBgU",
  authDomain: "eventqr-d2ff6.firebaseapp.com",
  projectId: "eventqr-d2ff6",
  storageBucket: "eventqr-d2ff6.firebasestorage.app",
  messagingSenderId: "767086567936",
  appId: "1:767086567936:web:547300a74b1b95f138eee5",
  measurementId: "G-B7LVR1ZMBE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
