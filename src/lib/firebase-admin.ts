
import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.', e);
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (!admin.apps.length) {
    console.warn("Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT environment variable is not set or is invalid.");
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
