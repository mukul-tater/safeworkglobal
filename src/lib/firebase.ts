import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase web config is public (safe in the browser).
 * Prefer VITE_FIREBASE_* when set; otherwise use project defaults so SMS OTP
 * works on hosts (e.g. safeworkglobal.com / Lovable) that omit those env vars.
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB27N7cODGEhPFJdJm-CFAoedTeW2OeJh0',
  authDomain: 'safeworkglobal1.firebaseapp.com',
  projectId: 'safeworkglobal1',
  storageBucket: 'safeworkglobal1.firebasestorage.app',
  messagingSenderId: '616979591324',
  appId: '1:616979591324:web:f0d5a5495c80668d97fd59',
};

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey).trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain).trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId).trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket).trim(),
  messagingSenderId: String(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  ).trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId).trim(),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* env variables.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}
