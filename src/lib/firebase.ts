// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "motionflow-nmtny",
  "appId": "1:664448019536:web:fa751d3540b5cb0d603555",
  "storageBucket": "motionflow-nmtny.appspot.com",
  "apiKey": "AIzaSyC_F18qhwCr0haoVW1pF4T_l7BJnv4HyMI",
  "authDomain": "motionflow-nmtny.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "664448019536"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
