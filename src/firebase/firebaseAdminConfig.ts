// lib/firebaseAdminConfig.ts
import { initializeApp, getApps, cert, type ServiceAccount, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any, storage: any, auth: any, app: any;

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
} catch (e) {
  console.warn("Firebase Admin initialization failed (expected in build):", e);
  db = {};
  storage = {};
  auth = {};
  app = {};
}

export { app, db, storage, auth };
