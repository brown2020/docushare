import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/firebase/firebaseAdminConfig";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import { File } from "buffer";
async function uploadFile(filePath: string, bucketPath: string) {
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(bucketPath);

        const stream = file.createWriteStream({
            metadata: {
                contentType: 'image/jpeg' // Adjust content type as needed
            }
        });

        return new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', resolve);

            fs.createReadStream(filePath).pipe(stream);
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function downloadFile(bucketPath: string, filePath: string) {
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(bucketPath);

        const stream = file.createReadStream();

        return new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('end', resolve);

            stream.pipe(fs.createWriteStream(filePath));
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

export const POST = async (req: NextRequest) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { userId } = auth();

            if (!userId) {
                reject(new Response("User is not signed in.", { status: 401 }));
                return;
            }

            // Parse the form data using the native Request API
            const formData = await req.formData();
            const file = formData.get('file'); // The 'file' key should match the name of your form input

            if (!file || !(file instanceof File)) {
                resolve(NextResponse.json({ message: 'No file uploaded' }, { status: 400 }))
                return;
            }

            // You can now handle the file upload here
            const directoryPath = path.join(__dirname, '../../public');
            const filename = `${parseInt((Math.random() * 100000000).toString())}_${file.name}`;
            const filePath = path.join(directoryPath, filename);
            await fs.mkdirSync(directoryPath, { recursive: true });
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.promises.writeFile(filePath, buffer);
            const bucketPath = `uploads/${filename}`;
            await uploadFile(filePath, bucketPath);

            resolve(NextResponse.json(
                { status: true, message: 'File uploaded successfully', data: { filename } },
                { status: 200 }
            ))


        } catch (error) {
            console.log("Error sharing document:", error);
            reject(NextResponse.json(
                { error: "Failed to fetch documents" },
                { status: 500 }
            ))
        }
    })
};

export const GET = async (req: NextRequest) => {
    try {

        const image_key = req.nextUrl.searchParams.get("image_key");
        if (!image_key) {
            return new Response("Image ID is required.", { status: 400 });
        }

        // Fetch the document
        const bucket = admin.storage().bucket();
        const file = bucket.file(`uploads/${image_key}`);

        const [exists] = await file.exists();

        if (!exists) {
            return new Response("Image not found.", { status: 404 });
        }

        const directoryPath = path.join(__dirname, '../../public');
        const filename = image_key;
        const filePath = path.join(directoryPath, filename);
        await fs.mkdirSync(directoryPath, { recursive: true });
        if (!await fs.existsSync(filePath)) {
            await downloadFile(`uploads/${image_key}`, filePath);
        }

        const imageBuffer = await fs.readFileSync(filePath)
        const response = new NextResponse(imageBuffer)
        response.headers.set('content-type', 'image/png');
        return response;

    } catch (error) {
        console.log("Error fetching user emails:", error);
        return NextResponse.json(
            { error: "Failed to fetch user emails" },
            { status: 500 }
        );
    }
};