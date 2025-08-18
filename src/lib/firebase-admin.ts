
import * as admin from 'firebase-admin';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// Centralized list of admin emails. This is the single source of truth.
export const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
}

// Singleton instance of Firebase Admin
let firebaseAdmin: FirebaseAdmin | null = null;

/**
 * Initializes and returns a singleton instance of the Firebase Admin SDK.
 * This ensures that the SDK is initialized only once per server instance.
 */
export function getFirebaseAdmin(): FirebaseAdmin {
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
  
  let serviceAccount: admin.ServiceAccount;

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set or is empty.");
    }
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.', e);
    throw new Error("Firebase Admin SDK credentials are not set or are invalid.");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firebaseAdmin = {
    auth: app.auth(),
    db: app.firestore(),
  };

  return firebaseAdmin;
}

/**
 * Verifies the session cookie and returns the decoded token if valid.
 * This is the centralized function for server-side user authentication.
 */
export async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const session = cookies().get("session")?.value;
  if (!session) {
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    // Use 'true' to check if the cookie is revoked
    const decodedClaims = await auth.verifySessionCookie(session, true); 
    return decodedClaims;
  } catch (error) {
    // Session cookie is invalid or expired.
    // console.error("Error verifying session cookie:", error);
    return null;
  }
}
