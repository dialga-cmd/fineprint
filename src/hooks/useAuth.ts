'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, signInWithGoogle, signOutUser } from '@/lib/firebase';

const FIREBASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);

export interface UseAuthOptions {
  onUserChange?: (user: User | null) => void;
}

export interface UseAuthResult {
  user: User | null;
  authLoading: boolean;
  signingIn: boolean;
  firebaseConfigured: boolean;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export function useAuth({ onUserChange }: UseAuthOptions = {}): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(!FIREBASE_CONFIGURED ? false : true);
  const [signingIn, setSigningIn] = useState(false);
  const onUserChangeRef = useRef(onUserChange);

  useEffect(() => {
    onUserChangeRef.current = onUserChange;
  }, [onUserChange]);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setAuthLoading(false);
      onUserChangeRef.current?.(u);
    });
    return unsub;
  }, []);

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('sign-in failed', err);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    return signOutUser();
  }, []);

  return { user, authLoading, signingIn, firebaseConfigured: FIREBASE_CONFIGURED, handleSignIn, handleSignOut };
}