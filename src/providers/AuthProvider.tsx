"use client";

import {
  createServerSession,
  clearServerSession,
  type CreateSessionResult,
} from "@/lib/auth/sessionClient";
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

const AUTH_SETTLE_TIMEOUT_MS = 15_000;
const DEFAULT_SESSION_ERROR =
  "We couldn't establish your session. This might be due to a network issue or missing Firebase configuration in your local .env.";

async function establishSession(
  firebaseUser: User
): Promise<CreateSessionResult> {
  try {
    const idToken = await Promise.race([
      firebaseUser.getIdToken(true),
      new Promise<string>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Timed out fetching Firebase ID token. Check NEXT_PUBLIC_FIREBASE_* in your Mac .env."
              )
            ),
          12_000
        );
      }),
    ]);
    return await createServerSession(idToken);
  } catch (err) {
    const message =
      err instanceof Error && err.message.trim()
        ? err.message
        : DEFAULT_SESSION_ERROR;
    console.warn("[auth]", formatFirebaseAuthErrorForLog(err));
    return { ok: false, error: message };
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionReady: boolean;
  /** Non-null when session cookie setup failed or timed out. */
  sessionError: string | null;
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
  retrySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

function handleAuthFailure(err: unknown, fallback: string): string {
  console.warn("[auth]", formatFirebaseAuthErrorForLog(err));
  return mapFirebaseAuthError(err, fallback);
}

function applySessionResult(
  result: CreateSessionResult,
  setSessionReady: (v: boolean) => void,
  setSessionError: (v: string | null) => void,
  setError?: (v: string | null) => void,
  failMessage?: string
): boolean {
  if (result.ok) {
    setSessionReady(true);
    setSessionError(null);
    return true;
  }
  setSessionReady(false);
  const msg = result.error || failMessage || DEFAULT_SESSION_ERROR;
  setSessionError(msg);
  if (setError) setError(msg);
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    let settled = false;

    const finishLoading = () => {
      if (!ignore) setLoading(false);
    };

    // Never leave the UI stuck on "Loading your workspace..." if Firebase
    // auth state never arrives. Signed-out is fine (no sessionError).
    const settleTimer = setTimeout(() => {
      if (ignore || settled) return;
      settled = true;
      finishLoading();
      setSessionReady(false);
      // Do not set sessionError here: no user yet. If a signed-in user is stuck
      // without a session, createServerSession's own timeout sets sessionError.
    }, AUTH_SETTLE_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (ignore) return;
      settled = true;
      clearTimeout(settleTimer);
      setUser(firebaseUser);
      if (!firebaseUser) {
        setSessionReady(false);
        setSessionError(null);
        finishLoading();
        return;
      }
      // Clear loading as soon as Firebase user is known; session cookie
      // setup has its own timeout + sessionError path.
      finishLoading();
      void (async () => {
        const result = await establishSession(firebaseUser);
        if (!ignore) {
          applySessionResult(result, setSessionReady, setSessionError);
        }
      })();
    });

    return () => {
      ignore = true;
      clearTimeout(settleTimer);
      unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setSessionError(null);
      setLoading(true);
      setSessionReady(false);
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        setUser(credential.user);
        const result = await establishSession(credential.user);
        return applySessionResult(
          result,
          setSessionReady,
          setSessionError,
          setError,
          "Signed in, but session setup failed. Please try again."
        );
      } catch (err) {
        setError(handleAuthFailure(err, "Failed to sign in"));
        setSessionReady(false);
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
      setSessionError(null);
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
        const result = await establishSession(credential.user);
        return applySessionResult(
          result,
          setSessionReady,
          setSessionError,
          setError,
          "Account created, but session setup failed. Please sign in."
        );
      } catch (err) {
        setError(handleAuthFailure(err, "Failed to create account"));
        setSessionReady(false);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setSessionError(null);
    setLoading(true);
    setSessionReady(false);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      const result = await establishSession(credential.user);
      return applySessionResult(
        result,
        setSessionReady,
        setSessionError,
        setError,
        "Signed in, but session setup failed. Please try again."
      );
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to sign in with Google"));
      setSessionReady(false);
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
    setSessionError(null);
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
        const result = await establishSession(credential.user);
        return applySessionResult(
          result,
          setSessionReady,
          setSessionError,
          setError,
          "Signed in, but session setup failed. Please try again."
        );
      }
      return false;
    } catch (err) {
      setError(handleAuthFailure(err, "Failed to complete sign in"));
      setSessionReady(false);
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
      setSessionError(null);
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

  const retrySession = useCallback(async () => {
    if (!user) return;
    setSessionError(null);
    setLoading(true);
    setSessionReady(false);
    try {
      const result = await establishSession(user);
      applySessionResult(result, setSessionReady, setSessionError);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionReady,
      sessionError,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendMagicLink,
      completeMagicLinkSignIn,
      signOut,
      clearError,
      retrySession,
    }),
    [
      user,
      loading,
      sessionReady,
      sessionError,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendMagicLink,
      completeMagicLinkSignIn,
      signOut,
      clearError,
      retrySession,
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
