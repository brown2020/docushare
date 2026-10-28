import { NextResponse } from "next/server";
import { isFirebaseAdminReady, db } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DOCUMENT_COLLECTION } from "@/lib/constants";

export const dynamic = "force-dynamic";

type RecentDoc = { id: string; name: string; lastEdited: string };

function toDate(value: unknown): Date {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return new Date(0);
}

function formatLastEdited(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapRecent(id: string, data: Record<string, unknown>): RecentDoc & { updatedAt: Date } {
  const updatedAt = toDate(data.updatedAt);
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled Document",
    updatedAt,
    lastEdited: formatLastEdited(updatedAt),
  };
}

function isMissingIndex(error: unknown): boolean {
  const code = (error as { code?: number | string }).code;
  const message = error instanceof Error ? error.message : "";
  return (
    code === 9 ||
    code === "failed-precondition" ||
    message.includes("FAILED_PRECONDITION") ||
    message.includes("requires an index")
  );
}

async function recentOwned(userId: string): Promise<RecentDoc[]> {
  const base = db.collection(DOCUMENT_COLLECTION).where("owner", "==", userId);
  try {
    const snap = await base
      .orderBy("updatedAt", "desc")
      .limit(5)
      .select("name", "updatedAt")
      .get();
    return snap.docs.map((doc: { id: string; data: () => Record<string, unknown> }) => {
      const row = mapRecent(doc.id, doc.data());
      return { id: row.id, name: row.name, lastEdited: row.lastEdited };
    });
  } catch (error) {
    if (!isMissingIndex(error)) throw error;
    const snap = await base.select("name", "updatedAt").get();
    return snap.docs
      .map((doc: { id: string; data: () => Record<string, unknown> }) =>
        mapRecent(doc.id, doc.data())
      )
      .sort(
        (
          a: { updatedAt: Date },
          b: { updatedAt: Date }
        ) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )
      .slice(0, 5)
      .map(({ id, name, lastEdited }: RecentDoc) => ({ id, name, lastEdited }));
  }
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const userId = authUser.uid;
    const docsRef = db.collection(DOCUMENT_COLLECTION);
    const [ownedCount, sharedCount, recentlyEdited] = await Promise.all([
      docsRef.where("owner", "==", userId).count().get(),
      docsRef.where("share", "array-contains", userId).count().get(),
      recentOwned(userId),
    ]);

    return NextResponse.json({
      totalDocuments: ownedCount.data().count,
      sharedDocuments: sharedCount.data().count,
      recentlyEdited,
    });
  } catch (error) {
    console.warn(
      "[docs] stats_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to fetch document stats" },
      { status: 500 }
    );
  }
}
