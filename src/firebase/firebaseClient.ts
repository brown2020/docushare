import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any, db: any, auth: any, storage: any, analytics: any;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  if (typeof window !== "undefined") {
    isSupported()
      .then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      })
      .catch(console.error);
  }
} catch (e) {
  console.warn("Firebase client initialization failed (expected in build):", e);
  app = {};
  db = {};
  auth = {};
  storage = {};
  analytics = undefined;
}

export { db, auth, storage, analytics };
