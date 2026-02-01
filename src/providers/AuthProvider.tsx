"use client";

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
  ReactNode,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionReady: boolean; // True when session cookie is set
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

const actionCodeSettings = {
  url:
    typeof window !== "undefined"
      ? `${window.location.origin}/signin?mode=emailLink`
      : "",
  handleCodeInApp: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Create session cookie on sign in
        try {
          const idToken = await firebaseUser.getIdToken(true); // Force refresh
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            setSessionReady(true);
          } else {
            console.error("Failed to create session:", response.status);
            setSessionReady(false);
          }
        } catch (err) {
          console.error("Failed to create session:", err);
          setSessionReady(false);
        }
      } else {
        setSessionReady(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      setSessionReady(false);
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Manually create session after sign in
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (response.ok) {
          setSessionReady(true);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sign in";
        setError(message);
        throw err;
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
        // Manually create session after sign up
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (response.ok) {
          setSessionReady(true);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create account";
        setError(message);
        throw err;
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
      // Manually create session after Google sign in
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (response.ok) {
        setSessionReady(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Store email for when user clicks the link
      if (typeof window !== "undefined") {
        window.localStorage.setItem("emailForSignIn", email);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send magic link";
      setError(message);
      throw err;
    }
  }, []);

  const completeMagicLinkSignIn = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);
    setSessionReady(false);
    try {
      if (typeof window !== "undefined" && isSignInWithEmailLink(auth, window.location.href)) {
        const credential = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem("emailForSignIn");
        // Manually create session after magic link sign in
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (response.ok) {
          setSessionReady(true);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete sign in";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      // Clear session cookie first
      await fetch("/api/auth/session", { method: "DELETE" });
      setSessionReady(false);
      await firebaseSignOut(auth);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
