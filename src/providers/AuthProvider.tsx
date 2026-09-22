"use client";

import { createServerSession, clearServerSession } from "@/lib/auth/sessionClient";
import { auth } from "@/firebase/firebaseClient";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  mapFirebaseAuthError,
  formatFirebaseAuthErrorForLog,
} from "@/lib/firebaseAuthErrors";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionReady: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  completeMagicLinkSignIn: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();


function handleAuthFailure(err: unknown, fallback: string): string {
  console.warn("[auth]", formatFirebaseAuthErrorForLog(err));
  return mapFirebaseAuthError(err, fallback);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (ignore) return;
      setUser(firebaseUser);
      if (!firebaseUser) {
        setSessionReady(false);
        setLoading(false);
        return;
      }
      setLoading(false);
      void (async () => {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          const ok = await createServerSession(idToken);
          if (!ignore) setSessionReady(ok);
        } catch (err) {
          console.warn("[auth]", formatFirebaseAuthErrorForLog(err));
          if (!ignore) setSessionReady(false);
        }
      })();
    });
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      setSessionReady(false);
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        setUser(credential.user);
        const idToken = await credential.user.getIdToken(true);
        const ok = await createServerSession(idToken);
        setSessionReady(ok);
        if (!ok) {
          setError("Signed in, but session setup failed. Please try again.");
          return false;
        }
        return true;
      } catch (err) {
        setError(handleAuthFailure(err, "Failed to sign in"));
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setError(null);
      setLoading(true);
      setSessionReady(false);
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName && credential.user) {
          await updateProfile(credential.user, { displayName });
        }
        setUser(credential.user);
        const idToken = await credential.user.getIdToken(true);
        const ok = await createServerSession(idToken);
        setSessionReady(ok);
        if (!ok) {
          setError("Account created, but session setup failed. Please sign in.");
          return false;
        }
        return true;
      } catch (err) {
        setError(handleAuthFailure(err, "Failed to create account"));
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSessionReady(false);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      const idToken = await credential.user.getIdToken(true);
      const ok = await createServerSession(idToken);
      setSessionReady(ok);
      if (!ok) {
        setError("Signed in, but session setup failed. Please try again.");
        return false;
      }
      return true;
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to sign in with Google"));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    setError(null);
    const actionCodeSettings = {
      url:
        typeof window !== "undefined"
          ? `${window.location.origin}/signin?mode=emailLink`
          : "",
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("emailForSignIn", email);
      }
      return true;
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to send magic link"));
      return false;
    }
  }, []);

  const completeMagicLinkSignIn = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);
    setSessionReady(false);
    try {
      if (
        typeof window !== "undefined" &&
        isSignInWithEmailLink(auth, window.location.href)
      ) {
        const credential = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );
        window.localStorage.removeItem("emailForSignIn");
        const idToken = await credential.user.getIdToken(true);
        const ok = await createServerSession(idToken);
        setSessionReady(ok);
        return ok;
      }
      return false;
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to complete sign in"));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await clearServerSession();
      setSessionReady(false);
      await firebaseSignOut(auth);
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to sign out"));
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionReady,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendMagicLink,
      completeMagicLinkSignIn,
      signOut,
      clearError,
    }),
    [
      user,
      loading,
      sessionReady,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendMagicLink,
      completeMagicLinkSignIn,
      signOut,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
