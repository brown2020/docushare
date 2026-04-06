// lib/firebaseAdminConfig.ts
import admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any, storage: any;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  db = admin.firestore();
  storage = admin.storage();
} catch (e) {
  console.warn("Firebase Admin initialization failed (expected in build):", e);
  db = {};
  storage = {};
}

export { admin, db, storage };
