import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { canReadDocument } from "@/lib/documents/access";
import { isDocumentId } from "@/lib/images";

export const POST = async (req: NextRequest) => {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return new Response("User is not signed in.", { status: 401 });
    }
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const userId = authUser.uid;

    const body = await req.json();
    const email = body.email as string;
    const documentId = body.documentId as string;
    if (!documentId || !isDocumentId(documentId)) {
      return NextResponse.json({
        status: false,
        message: "Document ID is required.",
      });
    }
    if (!email) {
      return NextResponse.json({
        status: false,
        message: "Email address is required.",
      });
    }

    // Look up user by email in Firebase Auth
    let targetUser;
    try {
      targetUser = await auth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ status: false, message: "User not found." });
    }

    if (targetUser.uid === userId) {
      return NextResponse.json({
        status: false,
        message: "Cannot share with yourself.",
      });
    }

    // Fetch the document to update
    const docRef = db.collection(DOCUMENT_COLLECTION).doc(documentId);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      return NextResponse.json({
        status: false,
        message: "Document not found.",
      });
    }

    const docData = docSnapshot.data();
    if (docData?.owner !== userId) {
      return NextResponse.json({
        status: false,
        message: "Only the document owner can share.",
      });
    }

    // Update the document with the target user's UID
    await docRef.update({
      share: FieldValue.arrayUnion(targetUser.uid),
    });

    return NextResponse.json({ status: true });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to share document" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return new Response("User is not signed in.", { status: 401 });
    }

    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const documentId = req.nextUrl.searchParams.get("documentId");
    if (!documentId || !isDocumentId(documentId)) {
      return new Response("Document ID is required.", { status: 400 });
    }

    const docRef = db.collection(DOCUMENT_COLLECTION).doc(documentId);
    const docSnapshot = await docRef.get();
    const documentData = docSnapshot.data();
    if (!docSnapshot.exists || !canReadDocument(documentData, authUser.uid)) {
      return new Response("Document not found.", { status: 404 });
    }
    const userIds: string[] = documentData?.share || [];

    if (userIds.length === 0) {
      return NextResponse.json({ emails: [] });
    }

    // Fetch email addresses for the user IDs from Firebase Auth
    const emailResults = await Promise.all(
      userIds.map(async (uid: string) => {
        try {
          const user = await auth.getUser(uid);
          return user.email ?? null;
        } catch {
          return null;
        }
      })
    );
    const emails = emailResults.filter((email): email is string => Boolean(email));

    return NextResponse.json({ emails });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to fetch user emails" },
      { status: 500 }
    );
  }
};
