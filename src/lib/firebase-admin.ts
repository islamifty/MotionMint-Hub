
import * as admin from 'firebase-admin';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
}

let firebaseAdmin: FirebaseAdmin | null = null;

function initializeFirebaseAdmin(): FirebaseAdmin {
  if (admin.apps.length > 0) {
    const defaultApp = admin.app();
    return {
      auth: defaultApp.auth(),
      db: defaultApp.firestore(),
    };
  }

  let serviceAccount: admin.ServiceAccount | undefined;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT.', e);
      throw new Error("Firebase Admin SDK credentials are not set or are invalid in environment variables.");
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    throw new Error("Firebase Admin SDK credentials are not set in the environment variables.");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  return {
    auth: app.auth(),
    db: app.firestore(),
  };
}

export function getFirebaseAdmin(): FirebaseAdmin {
  if (!firebaseAdmin) {
    firebaseAdmin = initializeFirebaseAdmin();
  }
  return firebaseAdmin;
}

export async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const session = cookies().get("session")?.value || "";
  if (!session) {
    return null;
  }

  try {
    const { auth } = getFirebaseAdmin();
    // Use 'false' to prevent checking for revocation, for performance.
    const decodedClaims = await auth.verifySessionCookie(session, false);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
