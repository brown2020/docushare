"use server";

import { FieldValue } from "firebase-admin/firestore";
import { db, requireFirebaseAdmin } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  API_KEY_FIELDS,
  sanitizeApiKey,
  type ApiKeyField,
} from "@/lib/ai/apiKeyFields";
import { USER_COLLECTION } from "@/lib/constants";

function profileRef(uid: string) {
  return db.collection(USER_COLLECTION).doc(uid).collection("profile").doc("userData");
}

function secretRef(uid: string) {
  return db.collection(USER_COLLECTION).doc(uid).collection("secrets").doc("apiKeys");
}

export async function getApiKeyStatus(): Promise<Record<ApiKeyField, boolean>> {
  const authUser = await getAuthenticatedUser();
  const empty = Object.fromEntries(
    API_KEY_FIELDS.map((field) => [field, false])
  ) as Record<ApiKeyField, boolean>;
  if (!authUser) return empty;

  requireFirebaseAdmin();
  const [secrets, profile] = await Promise.all([
    secretRef(authUser.uid).get(),
    profileRef(authUser.uid).get(),
  ]);
  const secretData = secrets.data() ?? {};
  const profileData = profile.data() ?? {};

  return Object.fromEntries(
    API_KEY_FIELDS.map((field) => [
      field,
      Boolean(
        (typeof secretData[field] === "string" && secretData[field].trim()) ||
          (typeof profileData[field] === "string" && profileData[field].trim())
      ),
    ])
  ) as Record<ApiKeyField, boolean>;
}

export async function saveApiKeys(input: Partial<Record<ApiKeyField, string>>) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error("User is not signed in.");
  }
  requireFirebaseAdmin();

  const updates: Partial<Record<ApiKeyField, string>> = {};
  for (const field of API_KEY_FIELDS) {
    if (!(field in input)) continue;
    const cleaned = sanitizeApiKey(input[field]);
    if (cleaned) updates[field] = cleaned;
  }
  if (Object.keys(updates).length === 0) return;

  const deletes: Record<string, FirebaseFirestore.FieldValue> = {};
  for (const field of Object.keys(updates)) {
    deletes[field] = FieldValue.delete();
  }

  await secretRef(authUser.uid).set(updates, { merge: true });
  const profile = profileRef(authUser.uid);
  const snap = await profile.get();
  if (snap.exists) {
    await profile.update(deletes);
  }
}
