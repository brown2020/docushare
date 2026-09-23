import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import {
  formatFirebaseErrorForLog,
  getFirebaseErrorCode,
} from "@/lib/firebaseErrorCode";
import { EMPTY_DOC_JSON } from "@/lib/editorContent";

export type ClientDocument = {
  id: string;
  name: string;
  owner?: string;
  isShared?: boolean;
};

function mapRow(
  id: string,
  data: Record<string, unknown>,
  isShared?: boolean
): ClientDocument {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled Document",
    owner: typeof data.owner === "string" ? data.owner : undefined,
    ...(isShared ? { isShared: true } : {}),
  };
}

function isPermissionDenied(error: unknown): boolean {
  const code = (getFirebaseErrorCode(error) ?? "").toLowerCase();
  return (
    code === "permission-denied" ||
    code === "firestore/permission-denied" ||
    code.includes("permission-denied") ||
    code === "missing-or-insufficient-permissions"
  );
}

async function listDocumentsViaApi(): Promise<ClientDocument[]> {
  const response = await fetch("/api/docs", { credentials: "same-origin" });
  if (!response.ok) {
    throw Object.assign(new Error("api_docs_list_failed"), {
      code: `http/${response.status}`,
    });
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw Object.assign(new Error("api_docs_list_invalid"), {
      code: "client/invalid-response",
    });
  }
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return mapRow(String(r.id ?? ""), r, r.isShared === true);
  });
}

async function createDocumentViaApi(name: string): Promise<ClientDocument> {
  const response = await fetch("/api/docs", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw Object.assign(new Error("api_docs_create_failed"), {
      code: `http/${response.status}`,
    });
  }
  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.id !== "string") {
    throw Object.assign(new Error("api_docs_create_invalid"), {
      code: "client/invalid-response",
    });
  }
  return {
    id: data.id,
    name: typeof data.name === "string" ? data.name : name,
    owner: typeof data.owner === "string" ? data.owner : undefined,
  };
}

export async function createDocumentClient(
  ownerUid: string,
  name = "Untitled Document"
): Promise<ClientDocument> {
  if (!ownerUid) {
    throw Object.assign(new Error("Not signed in"), {
      code: "auth/missing-uid",
    });
  }

  const docData = {
    name,
    content: EMPTY_DOC_JSON,
    owner: ownerUid,
    createdAt: new Date(),
    updatedAt: new Date(),
    share: [] as string[],
  };

  try {
    const docRef = await addDoc(collection(db, DOCUMENT_COLLECTION), docData);
    return { id: docRef.id, name, owner: ownerUid };
  } catch (error) {
    console.warn("[docs] create_client_failed", formatFirebaseErrorForLog(error));
    if (isPermissionDenied(error)) {
      try {
        return await createDocumentViaApi(name);
      } catch (apiError) {
        console.warn(
          "[docs] create_api_fallback_failed",
          formatFirebaseErrorForLog(apiError)
        );
        throw apiError;
      }
    }
    throw error;
  }
}

export async function listDocumentsClient(
  ownerUid: string
): Promise<ClientDocument[]> {
  if (!ownerUid) {
    throw Object.assign(new Error("Not signed in"), {
      code: "auth/missing-uid",
    });
  }

  const docsRef = collection(db, DOCUMENT_COLLECTION);
  const [ownedResult, sharedResult] = await Promise.allSettled([
    getDocs(query(docsRef, where("owner", "==", ownerUid))),
    getDocs(query(docsRef, where("share", "array-contains", ownerUid))),
  ]);

  const owned: ClientDocument[] = [];
  const shared: ClientDocument[] = [];
  const failures: unknown[] = [];

  if (ownedResult.status === "fulfilled") {
    for (const d of ownedResult.value.docs) {
      owned.push(mapRow(d.id, d.data() as Record<string, unknown>));
    }
  } else {
    failures.push(ownedResult.reason);
    console.warn(
      "[docs] list_owned_failed",
      formatFirebaseErrorForLog(ownedResult.reason)
    );
  }

  if (sharedResult.status === "fulfilled") {
    for (const d of sharedResult.value.docs) {
      shared.push(mapRow(d.id, d.data() as Record<string, unknown>, true));
    }
  } else {
    failures.push(sharedResult.reason);
    console.warn(
      "[docs] list_shared_failed",
      formatFirebaseErrorForLog(sharedResult.reason)
    );
  }

  if (owned.length > 0 || shared.length > 0 || failures.length === 0) {
    return [...owned, ...shared];
  }

  console.warn(
    "[docs] list_client_failed_falling_back_api",
    failures.map(formatFirebaseErrorForLog).join(",")
  );
  try {
    return await listDocumentsViaApi();
  } catch (apiError) {
    console.warn(
      "[docs] list_api_fallback_failed",
      formatFirebaseErrorForLog(apiError)
    );
    throw failures[0];
  }
}
