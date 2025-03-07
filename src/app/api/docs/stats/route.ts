import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/firebaseAdminConfig";
import { DOCUMENT_COLLECTION } from "@/lib/constants";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents for the user
    const docsRef = db.collection(DOCUMENT_COLLECTION);

    // Get documents owned by the user
    const userDocsSnapshot = await docsRef.where("owner", "==", userId).get();

    // Get shared documents
    const sharedDocsSnapshot = await docsRef
      .where("share", "array-contains", userId)
      .get();

    // Get all user documents and sort them client-side
    // This avoids needing a composite index
    const allUserDocs = userDocsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: typeof data.name === "string" ? data.name : "Untitled Document",
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastEdited: formatLastEdited(data.updatedAt?.toDate() || new Date()),
      };
    });

    // Sort by updatedAt (most recent first) and take the first 5
    const recentlyEdited = allUserDocs
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(({ id, name, lastEdited }) => ({ id, name, lastEdited }));

    return NextResponse.json({
      totalDocuments: userDocsSnapshot.size,
      sharedDocuments: sharedDocsSnapshot.size,
      recentlyEdited,
    });
  } catch (error) {
    console.error("Error fetching document stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch document stats" },
      { status: 500 }
    );
  }
}

// Helper function to format the last edited date
function formatLastEdited(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}
