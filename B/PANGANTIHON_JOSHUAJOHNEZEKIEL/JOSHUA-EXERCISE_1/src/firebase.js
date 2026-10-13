// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/**
 * Firebase web configuration. Values in `.env` take precedence; the literals
 * below are the default PRIMARY project so the app also runs without a `.env`.
 */
const env = import.meta.env || {}
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAwBcc9ZY01T1npIabaT9pRCU0bJEHDiZ0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "casssan.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "casssan",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "casssan.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "226989661460",
  appId: env.VITE_FIREBASE_APP_ID || "1:226989661460:web:f29005ec17bad3eb463601",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-2JYGH2Y7K8"
};

/**
 * BACKUP project configuration.
 *
 * A second Firebase project that mirrors the primary one and takes over all
 * reads/writes when the primary project's free daily quota (reads, writes,
 * deletes) is exhausted. Fill these in `.env` from the backup project's
 * Console → Project settings → General → Your apps → Web app config.
 */
const backupConfig = {
  apiKey: env.VITE_FIREBASE_BACKUP_API_KEY || "AIzaSyD8sUvM5wCH38bSfxFhvYidCWRRzxPa0II",
  authDomain: env.VITE_FIREBASE_BACKUP_AUTH_DOMAIN || "casscanbackup.firebaseapp.com",
  projectId: env.VITE_FIREBASE_BACKUP_PROJECT_ID || "casscanbackup",
  storageBucket: env.VITE_FIREBASE_BACKUP_STORAGE_BUCKET || "casscanbackup.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_BACKUP_MESSAGING_SENDER_ID || "953738490325",
  appId: env.VITE_FIREBASE_BACKUP_APP_ID || "1:953738490325:web:f961473c622564cc074d5c",
  measurementId: env.VITE_FIREBASE_BACKUP_MEASUREMENT_ID || "G-JZ06Q7XKJ5"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

/** True when the backup project has the three credentials it needs. */
export function isBackupConfigured() {
  return Boolean(backupConfig.apiKey && backupConfig.projectId && backupConfig.appId)
}

export const primaryProjectId = firebaseConfig.projectId
export const backupProjectId = backupConfig.projectId

const app = initializeApp(firebaseConfig);
/**
 * PRIMARY Firestore — persistent IndexedDB local cache. This is what makes the
 * Zero-Waste cache-first reads (`getDocCached` / `getDocsCached`) free across
 * app restarts: once data is local, the network is never touched for it again.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

let backupAppRef = null
let backupDbRef = null

/**
 * Lazily-initialised BACKUP app (Firestore + Auth share it). Returns null while
 * the backup project is not configured — the app then simply keeps using the
 * primary project.
 */
function getBackupApp() {
  if (!isBackupConfigured()) return null
  if (!backupAppRef) {
    backupAppRef = getApps().find((a) => a.name === "backup") || initializeApp(backupConfig, "backup")
  }
  return backupAppRef
}

/**
 * Lazily-initialised BACKUP Firestore instance (used for the quota failover
 * and for mirroring the primary's data into the backup).
 */
export function getBackupDb() {
  if (!isBackupConfigured()) return null
  if (!backupDbRef) {
    backupDbRef = getFirestore(getBackupApp())
  }
  return backupDbRef
}

/**
 * Lazily-initialised BACKUP Firebase Auth instance — the mirror target for
 * admin accounts (see utils/authMirror.js). Each project has its OWN auth
 * service, so accounts are mirrored lazily at login / admin creation.
 */
export function getBackupAuth() {
  if (!isBackupConfigured()) return null
  return getAuth(getBackupApp())
}

/** Firebase Authentication (email/password) — the source of truth for login. */
export const auth = getAuth(app);

/**
 * Secondary Auth app instance. Creating a new user account on a secondary
 * instance does NOT change the current session, so a signed-in admin can
 * register new operators without being signed out.
 */
export function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === "secondary");
  const secondaryApp = existing || initializeApp(firebaseConfig, "secondary");
  return getAuth(secondaryApp);
}
