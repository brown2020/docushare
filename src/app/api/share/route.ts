import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DOCUMENT_COLLECTION, USER_COLLECTION } from "@/lib/constants";

export const POST = async (req: NextRequest) => {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return new Response("User is not signed in.", { status: 401 });
    }

    const userId = authUser.uid;

    const body = await req.json();
    const email = body.email as string;
    const documentId = body.documentId as string;
    if (!email) {
      return NextResponse.json({
        status: false,
        message: "Email address is required.",
      });
    }

    // Look up user by email in Firebase Auth
    let targetUser;
    try {
      targetUser = await admin.auth().getUserByEmail(email);
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

    // Update the document with the target user's UID
    await docRef.update({
      share: FieldValue.arrayUnion(targetUser.uid),
    });

    return NextResponse.json({ status: true });
  } catch (error) {
    console.log("Error sharing document:", error);
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

    const documentId = req.nextUrl.searchParams.get("documentId");
    if (!documentId) {
      return new Response("Document ID is required.", { status: 400 });
    }

    // Fetch the document
    const docRef = db.collection(DOCUMENT_COLLECTION).doc(documentId);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      return new Response("Document not found.", { status: 404 });
    }

    const documentData = docSnapshot.data();
    const userIds: string[] = documentData?.share || [];

    if (userIds.length === 0) {
      return NextResponse.json({ emails: [] });
    }

    // Fetch email addresses for the user IDs from Firebase Auth
    const emails: string[] = [];
    for (const uid of userIds) {
      try {
        const user = await admin.auth().getUser(uid);
        if (user.email) {
          emails.push(user.email);
        }
      } catch {
        // User may have been deleted, skip
        continue;
      }
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.log("Error fetching user emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch user emails" },
      { status: 500 }
    );
  }
};
