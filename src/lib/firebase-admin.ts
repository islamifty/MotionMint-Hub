
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
}

// Singleton pattern to ensure Firebase is initialized only once.
let firebaseAdmin: FirebaseAdmin | null = null;

function initializeFirebaseAdmin(): FirebaseAdmin {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  let serviceAccount: admin.ServiceAccount | undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.', e);
      throw new Error('Firebase service account is not a valid JSON object.');
    }
  }

  if (!admin.apps.length) {
    if (!serviceAccount) {
        console.warn("Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT environment variable is not set or is invalid.");
        throw new Error("Firebase Admin SDK credentials are not set.");
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  const auth = admin.auth();
  const db = admin.firestore();

  firebaseAdmin = { auth, db };
  return firebaseAdmin;
}

export function getFirebaseAdmin(): FirebaseAdmin {
  return initializeFirebaseAdmin();
}
