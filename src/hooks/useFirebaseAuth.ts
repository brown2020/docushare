"use client";

import { useAuth } from "@/providers/AuthProvider";

/**
 * Custom hook for Firebase authentication.
 * Provides a simplified interface for auth operations.
 */
export function useFirebaseAuth() {
  const auth = useAuth();

  return {
    // User state
    user: auth.user,
    isSignedIn: !!auth.user,
    isLoaded: !auth.loading,
    loading: auth.loading,
    sessionReady: auth.sessionReady, // True when API calls can be made

    // User properties (with fallbacks)
    userId: auth.user?.uid ?? null,
    email: auth.user?.email ?? null,
    displayName: auth.user?.displayName ?? null,
    photoURL: auth.user?.photoURL ?? null,
    emailVerified: auth.user?.emailVerified ?? false,

    // Error handling
    error: auth.error,
    clearError: auth.clearError,

    // Auth methods
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    sendMagicLink: auth.sendMagicLink,
    completeMagicLinkSignIn: auth.completeMagicLinkSignIn,
    signOut: auth.signOut,
  };
}
