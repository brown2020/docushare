import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/lib/constants";

export type ClientDocument = {
  id: string;
  name: string;
  owner?: string;
  isShared?: boolean;
};

export async function createDocumentClient(
  ownerUid: string,
  name = "Untitled Document"
): Promise<ClientDocument> {
  const docData = {
    name,
    content: {},
    owner: ownerUid,
    createdAt: new Date(),
    updatedAt: new Date(),
    share: [] as string[],
  };
  const docRef = await addDoc(collection(db, DOCUMENT_COLLECTION), docData);
  return { id: docRef.id, name, owner: ownerUid };
}

export async function listDocumentsClient(
  ownerUid: string
): Promise<ClientDocument[]> {
  const docsRef = collection(db, DOCUMENT_COLLECTION);
  const ownedSnap = await getDocs(
    query(docsRef, where("owner", "==", ownerUid))
  );
  const owned = ownedSnap.docs.map((d) => ({
    id: d.id,
    name: typeof d.data().name === "string" ? d.data().name : "Untitled Document",
    owner: d.data().owner as string | undefined,
  }));

  const sharedSnap = await getDocs(
    query(docsRef, where("share", "array-contains", ownerUid))
  );
  const shared = sharedSnap.docs.map((d) => ({
    id: d.id,
    name: typeof d.data().name === "string" ? d.data().name : "Untitled Document",
    owner: d.data().owner as string | undefined,
    isShared: true,
  }));

  return [...owned, ...shared];
}
