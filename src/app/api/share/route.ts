import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { canReadDocument } from "@/lib/documents/access";
import { planShareWrite } from "@/lib/documents/share";
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
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const documentId = body?.documentId;

    let targetUid: string | null = null;
    const emailForLookup = rawEmail.trim().toLowerCase();
    if (emailForLookup.includes("@")) {
      try {
        const targetUser = await auth.getUserByEmail(emailForLookup);
        targetUid = typeof targetUser?.uid === "string" ? targetUser.uid : null;
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: unknown }).code)
            : "";
        if (code !== "auth/user-not-found") {
          console.warn(
            "[share] lookup_failed",
            error instanceof Error ? error.message : "unknown"
          );
          return NextResponse.json(
            { error: "Failed to share document" },
            { status: 500 }
          );
        }
      }
    }

    let documentExists = false;
    let owner: unknown;
    if (typeof documentId === "string" && isDocumentId(documentId)) {
      const existing = await db.collection(DOCUMENT_COLLECTION).doc(documentId).get();
      documentExists = existing.exists;
      owner = existing.data()?.owner;
    }

    const plan = planShareWrite({
      callerUid: userId,
      documentId,
      email: rawEmail,
      targetUid,
      documentExists,
      owner,
    });
    if (!plan.ok) {
      return NextResponse.json({ error: plan.error }, { status: plan.status });
    }

    await db.collection(DOCUMENT_COLLECTION).doc(plan.documentId).update({
      share: FieldValue.arrayUnion(plan.targetUid),
    });

    return NextResponse.json({ status: true, email: plan.email });
  } catch (error) {
    console.warn("[share] write_failed", error instanceof Error ? error.message : "unknown");
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
