import { db } from "@/firebase/firebaseClient";
import { Timestamp, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { create } from "zustand";

// Simplified auth state - using Firebase UID only (no dual UID tracking)
interface AuthState {
  uid: string; // Firebase UID
  authEmail: string;
  authDisplayName: string;
  authPhotoUrl: string;
  authEmailVerified: boolean;
  authReady: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
  credits: number;
}

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => void;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultAuthState: AuthState = {
  uid: "",
  authEmail: "",
  authDisplayName: "",
  authPhotoUrl: "",
  authEmailVerified: false,
  authReady: false,
  lastSignIn: null,
  premium: false,
  credits: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultAuthState,

  setAuthDetails: (details: Partial<AuthState>) => {
    const nextState: AuthState = { ...getAuthState(get()), ...details };
    set(nextState);
    // Sync to Firestore
    void updateUserDetailsInFirestore(nextState, nextState.uid);
  },

  clearAuthDetails: () => set({ ...defaultAuthState }),
}));

function getAuthState(store: AuthStore): AuthState {
  // Strip actions off the store
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setAuthDetails, clearAuthDetails, ...state } = store;
  return state;
}

async function updateUserDetailsInFirestore(
  details: AuthState,
  uid: string
) {
  if (!uid) return;

  const userRef = doc(db, `users/${uid}`);

  const sanitizedDetails = {
    authEmail: details.authEmail,
    authDisplayName: details.authDisplayName,
    authPhotoUrl: details.authPhotoUrl,
    authEmailVerified: details.authEmailVerified,
    authReady: details.authReady,
    premium: details.premium,
    credits: details.credits,
    lastSignIn: serverTimestamp(),
  };

  try {
    await setDoc(userRef, sanitizedDetails, { merge: true });
  } catch (error) {
    console.error("Error updating auth details in Firestore:", error);
  }
}
