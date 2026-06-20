import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function getExtensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/png":
    default:
      return ".png";
  }
}

function buildUploadFilename(fileName: string, contentType: string) {
  const extension = path.extname(fileName).toLowerCase();
  const safeExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension)
    ? extension
    : getExtensionForContentType(contentType);
  return `${randomUUID()}${safeExtension}`;
}

function isSafeImageKey(imageKey: string) {
  return (
    imageKey.length > 0 &&
    !imageKey.includes("/") &&
    !imageKey.includes("\\") &&
    !imageKey.includes("..")
  );
}

function getContentType(imageKey: string) {
  switch (path.extname(imageKey).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".png":
    default:
      return "image/png";
  }
}

async function uploadFile(fileBuffer: Buffer, bucketPath: string) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(bucketPath);

    await file.save(Buffer.from(fileBuffer));
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-17-2125",
    });
    return url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export const POST = async (req: NextRequest) => {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return new Response("User is not signed in.", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Unsupported image type" },
        { status: 400 }
      );
    }

    const filename = buildUploadFilename(file.name, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketPath = `uploads/${filename}`;
    const url = await uploadFile(buffer, bucketPath);

    return NextResponse.json(
      {
        status: true,
        message: "File uploaded successfully",
        data: { filename, url },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling image upload:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
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

    const image_key = req.nextUrl.searchParams.get("image_key");
    if (!image_key || !isSafeImageKey(image_key)) {
      return new Response("Image ID is required.", { status: 400 });
    }

    // Fetch the document
    const bucket = admin.storage().bucket();
    const file = bucket.file(`uploads/${image_key}`);

    const [exists] = await file.exists();

    if (!exists) {
      return new Response("Image not found.", { status: 404 });
    }

    const [imageBuffer] = await file.download();
    const response = new NextResponse(new Uint8Array(imageBuffer));
    response.headers.set("content-type", getContentType(image_key));
    return response;
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
};
