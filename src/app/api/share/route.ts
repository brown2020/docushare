import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { auth } from "@clerk/nextjs/server";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { clerkClient } from "@clerk/express";

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("User is not signed in.", { status: 401 });
    }

    const body = await req.json();
    const email = body.email as string;
    const documentId = body.documentId as string;
    if (!email) {
      return NextResponse.json({
        status: false,
        message: "Email address is required.",
      });
    }

    // Fetch user by email address from Clerk
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (users.data.length === 0 || users.data[0].id === userId) {
      return NextResponse.json({ status: false, message: "User not found." });
    }

    const user = users.data[0];

    // Fetch the document to update
    const docRef = db.collection(DOCUMENT_COLLECTION).doc(documentId);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      return NextResponse.json({
        status: false,
        message: "Document not found.",
      });
    }

    // Update the document with the fetched user details
    await docRef.update({
      share: FieldValue.arrayUnion(user.id),
    });

    return NextResponse.json({ status: true });
  } catch (error) {
    console.log("Error sharing document:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const { userId } = await auth();

    if (!userId) {
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
    const userIds = documentData?.share || [];

    if (userIds.length === 0) {
      return NextResponse.json({ emails: [] });
    }

    // Fetch email addresses for the user IDs from Clerk
    const userList = await clerkClient.users.getUserList({ userId: userIds });
    const emails = userList.data.map(
      (user) => user.emailAddresses[0].emailAddress
    );

    return NextResponse.json({ emails });
  } catch (error) {
    console.log("Error fetching user emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch user emails" },
      { status: 500 }
    );
  }
};
