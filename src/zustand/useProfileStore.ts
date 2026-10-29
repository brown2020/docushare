import { create } from "zustand";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { claimStarterCredits } from "@/actions/starterCreditActions";
import { displayedCredits, userProfileDocPath } from "@/lib/billing/creditBalance";
import { useAuthStore } from "./useAuthStore";
import { db } from "@/firebase/firebaseClient";

// Updated ProfileType to include new API keys
export interface ProfileType {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;

  openai_api_key: string;
  anthropic_api_key: string;
  google_gen_ai_api_key: string;
  mistral_api_key: string;
  fireworks_api_key: string;
}

// Updated defaultProfile with new API keys initialized
const defaultProfile: ProfileType = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,

  openai_api_key: "",
  anthropic_api_key: "", // New API key default
  google_gen_ai_api_key: "", // New API key default
  mistral_api_key: "", // New API key default
  fireworks_api_key: "", // New API key default
};

interface AuthState {
  authEmail?: string;
  authDisplayName?: string;
  authPhotoUrl?: string;
  authEmailVerified?: boolean;
}

interface ProfileState {
  profile: ProfileType;
  /** True after a profile read has applied the server credit balance. */
  creditsLoaded: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (newProfile: Partial<ProfileType>) => Promise<void>;
}

const CLIENT_PROFILE_FIELDS = [
  "email",
  "contactEmail",
  "displayName",
  "photoUrl",
  "emailVerified",
] as const;

// Merge profile identity fields. Credits and provider keys are server-owned.
const mergeProfileWithDefaults = (
  profile: Partial<ProfileType>,
  authState: AuthState
): ProfileType => ({
  ...defaultProfile,
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
  emailVerified: profile.emailVerified ?? authState.authEmailVerified ?? false,
  credits: displayedCredits(profile.credits),
});

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile,
  creditsLoaded: false,

  fetchProfile: async () => {
    const { uid, authEmail, authDisplayName, authPhotoUrl, authEmailVerified } =
      useAuthStore.getState();
    if (!uid) return;

    try {
      const userRef = doc(db, userProfileDocPath(uid));
      const docSnap = await getDoc(userRef);

      let newProfile: ProfileType;

      if (docSnap.exists()) {
        newProfile = mergeProfileWithDefaults(docSnap.data() as ProfileType, {
          authEmail,
          authDisplayName,
          authPhotoUrl,
          authEmailVerified,
        });
      } else {
        newProfile = {
          ...defaultProfile,
          email: authEmail || "",
          contactEmail: authEmail || "",
          displayName: authDisplayName || "",
          photoUrl: authPhotoUrl || "",
          emailVerified: authEmailVerified || false,
        };
      }

      const identity: Record<string, string | boolean> = {};
      for (const field of CLIENT_PROFILE_FIELDS) {
        const value = newProfile[field as keyof ProfileType];
        if (typeof value === "string" || typeof value === "boolean") {
          identity[field] = value;
        }
      }
      await setDoc(userRef, identity, { merge: true });
      const starter = await claimStarterCredits();
      if (starter) newProfile.credits = displayedCredits(starter.credits);
      set({ profile: newProfile, creditsLoaded: true });
    } catch (error) {
      console.error("Error fetching or creating profile:", error);
    }
  },

  updateProfile: async (newProfile: Partial<ProfileType>) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    try {
      const userRef = doc(db, userProfileDocPath(uid));
      const updatedProfile = { ...get().profile, ...newProfile };
      const identity: Record<string, string | boolean> = {};
      for (const field of CLIENT_PROFILE_FIELDS) {
        const value = updatedProfile[field as keyof ProfileType];
        if (typeof value === "string" || typeof value === "boolean") {
          identity[field] = value;
        }
      }

      const next = { ...get().profile };
      if (typeof updatedProfile.email === "string") next.email = updatedProfile.email;
      if (typeof updatedProfile.contactEmail === "string") {
        next.contactEmail = updatedProfile.contactEmail;
      }
      if (typeof updatedProfile.displayName === "string") {
        next.displayName = updatedProfile.displayName;
      }
      if (typeof updatedProfile.photoUrl === "string") next.photoUrl = updatedProfile.photoUrl;
      if (typeof updatedProfile.emailVerified === "boolean") {
        next.emailVerified = updatedProfile.emailVerified;
      }
      set({ profile: next });
      await setDoc(userRef, identity, { merge: true });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },
}));

export default useProfileStore;
