import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBbQJUsvn9LiTrDp8ScUNNdYm6oOFrdLZc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tele-hak.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tele-hak",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tele-hak.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "432433394472",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:432433394472:web:5a582b90dcbaa35baf161d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
