import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/firebaseAdminConfig";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("User is not signed in.", { status: 401 });
    }

    const docsRef = db.collection(DOCUMENT_COLLECTION);
    const docsSnapshot = await docsRef
      .where("owner", "==", userId)
      .select("name", "owner")
      .get();
    const documents = docsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      name:
        typeof doc.data().name === "string"
          ? doc.data().name
          : "Untitled Document",
    }));

    const sharedDocsSnapshot = await docsRef
      .where("share", "array-contains", userId)
      .select("name", "owner")
      .get();
    const sharedDocuments = sharedDocsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      name:
        typeof doc.data().name === "string"
          ? doc.data().name
          : "Untitled Document",
      isShared: true,
    }));

    return NextResponse.json([...documents, ...sharedDocuments]);
  } catch (error) {
    console.log("Error fetching documents:", error);

    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name = "Untitled Document" } = body;

    const docData = {
      name,
      content: {},
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      share: [],
    };

    const docRef = await db.collection(DOCUMENT_COLLECTION).add(docData);

    return NextResponse.json({
      id: docRef.id,
      name,
      owner: userId,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
};
