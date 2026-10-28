import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, isFirebaseAdminReady, storage } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { canReadDocument, contentReferencesImage } from "@/lib/documents/access";
import {
  contentTypeForImageKey,
  isDocumentId,
  isSafeImageKey,
  sniffImageType,
} from "@/lib/images";
import {
  classifyUpload,
  displayFileName,
  EMPTY_FILE_MESSAGE,
  FILE_TOO_LARGE_MESSAGE,
  MAX_UPLOAD_BYTES,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

export const POST = async (req: NextRequest) => {
  if (!isFirebaseAdminReady()) return unavailable();

  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return new Response("User is not signed in.", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { message: file.size <= 0 ? EMPTY_FILE_MESSAGE : FILE_TOO_LARGE_MESSAGE },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const classified = classifyUpload(bytes, file.name || "upload");
    if (!classified.ok) {
      return NextResponse.json({ message: classified.message }, { status: 400 });
    }

    const filename = `${randomUUID()}${classified.file.extension}`;
    const imageKey = `${authUser.uid}/${filename}`;
    const object = storage.bucket().file(`uploads/${imageKey}`);
    const originalName = displayFileName(file.name || "upload", filename);
    await object.save(Buffer.from(bytes), {
      resumable: false,
      contentType: classified.file.contentType,
      metadata: {
        contentType: classified.file.contentType,
        metadata: {
          owner: authUser.uid,
          originalName,
          kind: classified.file.kind,
        },
      },
    });

    const url = `/api/image?image_key=${encodeURIComponent(imageKey)}`;
    return NextResponse.json({
      status: true,
      message: "File uploaded successfully",
      data: {
        filename: imageKey,
        url,
        kind: classified.file.kind,
        name: originalName,
        text: classified.file.text,
      },
    });
  } catch (error) {
    console.warn(
      "[image] upload_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  if (!isFirebaseAdminReady()) return unavailable();

  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return new Response("User is not signed in.", { status: 401 });
  }

  const imageKey = req.nextUrl.searchParams.get("image_key") ?? "";
  if (!isSafeImageKey(imageKey)) {
    return new Response("Image ID is required.", { status: 400 });
  }

  const documentId = req.nextUrl.searchParams.get("documentId");
  if (documentId && !isDocumentId(documentId)) {
    return new Response("Document ID is invalid.", { status: 400 });
  }

  try {
    const file = storage.bucket().file(`uploads/${imageKey}`);
    const [exists] = await file.exists();
    if (!exists) {
      return new Response("Image not found.", { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const owner = metadata?.metadata?.owner;
    const ownsObject =
      owner === authUser.uid || imageKey.startsWith(`${authUser.uid}/`);

    let allowed = ownsObject;
    if (!allowed && documentId) {
      const snap = await db.collection(DOCUMENT_COLLECTION).doc(documentId).get();
      const data = snap.data();
      allowed =
        snap.exists &&
        canReadDocument(data, authUser.uid) &&
        contentReferencesImage(data?.content, imageKey);
    }

    if (!allowed) {
      return new Response("Image not found.", { status: 404 });
    }

    const [imageBuffer] = await file.download();
    const sniffed = sniffImageType(imageBuffer);
    const response = new NextResponse(new Uint8Array(imageBuffer));
    const originalName = displayFileName(
      String(metadata?.metadata?.originalName ?? ""),
      "file"
    );
    response.headers.set(
      "content-type",
      sniffed ?? contentTypeForImageKey(imageKey)
    );
    response.headers.set(
      "content-disposition",
      `inline; filename="${originalName}"`
    );
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-content-type-options", "nosniff");
    return response;
  } catch (error) {
    console.warn(
      "[image] fetch_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
};
