// lib/firebaseAdminConfig.ts
import { initializeApp, getApps, cert, type ServiceAccount, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

export class FirebaseAdminNotConfiguredError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Firebase Admin is not configured");
    this.name = "FirebaseAdminNotConfiguredError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any, storage: any, auth: any, app: any;
let adminReady = false;

try {
  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    app = getApp();
  }
  db = getFirestore();
  storage = getStorage();
  auth = getAuth();
  adminReady = true;
} catch (e) {
  console.warn("Firebase Admin initialization failed (expected in build):", e instanceof Error ? e.message : "unknown");
  db = null;
  storage = null;
  auth = null;
  app = null;
  adminReady = false;
}

export function isFirebaseAdminReady(): boolean {
  return adminReady;
}

export function requireFirebaseAdmin(): void {
  if (!adminReady) {
    throw new FirebaseAdminNotConfiguredError();
  }
}

export { app, db, storage, auth };
