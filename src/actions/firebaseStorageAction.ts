"use server";
// import { db, storage } from "@/firebase/firebaseAdminConfig";
import path from "path";
import fs from "fs";

export async function uploadImage(file: File) {


  if (!file) {
    console.error('No file selected');
    return;
  }

  const filePath = path.join(__dirname, '../public', file.name);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);
    console.log('File uploaded successfully to:', filePath);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}