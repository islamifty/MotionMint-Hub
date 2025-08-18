
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

  if (admin.apps.length > 0) {
    const defaultApp = admin.app();
    firebaseAdmin = {
        auth: defaultApp.auth(),
        db: defaultApp.firestore(),
    };
    return firebaseAdmin;
  }

  let serviceAccount: admin.ServiceAccount | undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.', e);
      // Fall through to the error below
    }
  }

  if (!serviceAccount) {
    console.warn("Firebase Admin SDK credentials are not set or are invalid. Server-side Firebase features will not be available.");
    // Return a dummy object or throw, depending on desired behavior for a missing config.
    // For this app, we'll throw to make it clear that configuration is required.
    throw new Error("Firebase Admin SDK credentials are not set in the environment variables.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  const auth = admin.auth();
  const db = admin.firestore();

  firebaseAdmin = { auth, db };
  return firebaseAdmin;
}

export function getFirebaseAdmin(): FirebaseAdmin {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
}
