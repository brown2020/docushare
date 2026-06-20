import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/firebase/firebaseAdminConfig";
import { getAuthenticatedUser } from "@/lib/auth/session";
import path from "path";
import { randomUUID } from "crypto";

function buildUploadFilename(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return `${randomUUID()}${extension}`;
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

    const filename = buildUploadFilename(file.name);
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
