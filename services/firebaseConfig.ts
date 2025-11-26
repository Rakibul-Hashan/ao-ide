import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// ---------------------------------------------------
//  AUTH FUNCTIONS (the ones your Auth.tsx is expecting)
// ---------------------------------------------------

// Login with email + password
export const loginWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Register new user (email/password)
export const registerWithEmail = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Google login
export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

// Logout
export const logout = async () => {
  return await signOut(auth);
};
