import { db } from "@/firebase/firebaseClient";
import { Timestamp, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { create } from "zustand";

interface AuthState {
  uid: string;
  firebaseUid: string;
  authEmail: string;
  authDisplayName: string;
  authPhotoUrl: string;
  authEmailVerified: boolean;
  authReady: boolean;
  authPending: boolean;
  isAdmin: boolean;
  isAllowed: boolean;
  isInvited: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
  credits: number;
  docs: { id: string; name?: string }[];
}

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => void;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultAuthState: AuthState = {
  uid: "",
  firebaseUid: "",
  authEmail: "",
  authDisplayName: "",
  authPhotoUrl: "",
  authEmailVerified: false,
  authReady: false,
  authPending: false,
  isAdmin: false,
  isAllowed: false,
  isInvited: false,
  lastSignIn: null,
  premium: false,
  credits: 0,
  docs: [],
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultAuthState,

  setAuthDetails: (details: Partial<AuthState>) => {
    // Only merge state fields (not actions) for clarity and to avoid accidental overwrites.
    const nextState: AuthState = { ...getAuthState(get()), ...details };
    set(nextState);
    void updateUserDetailsInFirestore(nextState, nextState.uid);
  },

  clearAuthDetails: () => set({ ...defaultAuthState }),
}));

function getAuthState(store: AuthStore): AuthState {
  // Strip actions off the store so we never accidentally persist/merge them into state.
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

  // Only persist the fields we intentionally store on the user doc.
  // Note: `lastSignIn` is always updated server-side here (not from client state).
  const sanitizedDetails = {
    firebaseUid: details.firebaseUid,
    authEmail: details.authEmail,
    authDisplayName: details.authDisplayName,
    authPhotoUrl: details.authPhotoUrl,
    authEmailVerified: details.authEmailVerified,
    authReady: details.authReady,
    authPending: details.authPending,
    isAdmin: details.isAdmin,
    isAllowed: details.isAllowed,
    isInvited: details.isInvited,
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
