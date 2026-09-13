import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;

export function getApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  return getAuth(getApp());
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function signInWithGoogle() {
  return signInWithPopup(getFirebaseAuth(), provider);
}

export function signOutUser() {
  return fbSignOut(getFirebaseAuth());
}

export function getIdToken(user: User) {
  return user.getIdToken();
}