import { FieldValue } from "firebase-admin/firestore";
import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { API_KEY_FIELDS, type ApiKeyField } from "@/lib/ai/apiKeyFields";
import { resolveModelSelection, type KeyBag, type ModelSelection } from "@/lib/ai/resolveModel";
import { USER_COLLECTION } from "@/lib/constants";

function profileRef(uid: string) {
  return db.collection(USER_COLLECTION).doc(uid).collection("profile").doc("userData");
}

function secretRef(uid: string) {
  return db.collection(USER_COLLECTION).doc(uid).collection("secrets").doc("apiKeys");
}

function asKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Read provider keys from the server-only secrets doc. Copy any legacy keys
 * off the client-readable profile, then delete them there.
 */
export async function loadUserKeyBag(uid: string): Promise<KeyBag> {
  requireFirebaseAdmin();
  const profile = profileRef(uid);
  const secrets = secretRef(uid);

  return db.runTransaction(async (tx: {
    get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    set: (ref: unknown, data: unknown, options?: { merge?: boolean }) => void;
    update: (ref: unknown, data: Record<string, unknown>) => void;
  }) => {
    const profileSnap = await tx.get(profile);
    const secretSnap = await tx.get(secrets);
    const profileData = profileSnap.data() ?? {};
    const secretData = secretSnap.data() ?? {};
    const merged: KeyBag = {};
    const deletes: Record<string, FirebaseFirestore.FieldValue> = {};

    for (const field of API_KEY_FIELDS) {
      const fromSecret = asKey(secretData[field]);
      const fromProfile = asKey(profileData[field]);
      const value = fromSecret || fromProfile;
      if (value) merged[field] = value;
      if (fromProfile) {
        deletes[field] = FieldValue.delete();
        if (!fromSecret) merged[field] = fromProfile;
      }
    }

    if (profileSnap.exists && Object.keys(deletes).length > 0) {
      const secretWrite: Partial<Record<ApiKeyField, string>> = {};
      for (const field of API_KEY_FIELDS) {
        const value = merged[field];
        if (typeof value === "string" && value) secretWrite[field] = value;
      }
      tx.set(secrets, secretWrite, { merge: true });
      tx.update(profile, deletes);
    }

    if (typeof profileData.ai_model === "string") {
      merged.ai_model = profileData.ai_model;
    }
    return merged;
  });
}

export async function resolveStoredModel(uid: string): Promise<ModelSelection> {
  const bag = await loadUserKeyBag(uid);
  return resolveModelSelection(bag);
}
