import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase/firebaseClient";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { DOCUMENT_COLLECTION } from "@/lib/constants";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents for the user
    const docsRef = collection(db, DOCUMENT_COLLECTION);
    const userDocsQuery = query(docsRef, where("userId", "==", userId));
    const userDocsSnapshot = await getDocs(userDocsQuery);

    // Get shared documents
    const sharedDocsQuery = query(
      docsRef,
      where("userId", "==", userId),
      where("isShared", "==", true)
    );
    const sharedDocsSnapshot = await getDocs(sharedDocsQuery);

    // Get recently edited documents
    const recentDocsQuery = query(
      docsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(5)
    );
    const recentDocsSnapshot = await getDocs(recentDocsQuery);

    const recentlyEdited = recentDocsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Untitled Document",
        lastEdited: formatLastEdited(data.updatedAt?.toDate() || new Date()),
      };
    });

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
