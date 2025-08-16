import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging
console.log('🔧 Firebase - Config check:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  storageBucket: !!firebaseConfig.storageBucket,
  messagingSenderId: !!firebaseConfig.messagingSenderId,
  appId: !!firebaseConfig.appId,
});

// A helper function to determine if Firebase is configured
export const isFirebaseConfigured = () => {
    const configured = !!firebaseConfig.apiKey;
    console.log('🔧 Firebase - Configuration check result:', configured);
    return configured;
};

// Initialize Firebase only if the config is present
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  if (isFirebaseConfigured()) {
    if (!getApps().length) {
      console.log('🚀 Firebase - Initializing new app');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('🔄 Firebase - Using existing app');
      app = getApp();
    }
    
    console.log('✅ Firebase - App initialized:', !!app);
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('✅ Firebase - Services initialized:', {
      auth: !!auth,
      db: !!db,
      storage: !!storage
    });
  } else {
    console.log('❌ Firebase - Not configured, skipping initialization');
  }
} catch (error) {
  console.error('❌ Firebase - Initialization error:', error);
}

// Helper function to get Firebase instances with proper error handling
const getFirebaseInstance = () => {
  if (!app) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }
  return app;
};

// Export getter functions that ensure Firebase is configured
export const getAuthInstance = () => {
  if (!auth) {
    console.error('❌ Firebase - Auth not available');
    throw new Error('Firebase Auth is not configured. Please check your environment variables.');
  }
  console.log('✅ Firebase - Returning auth instance');
  return auth;
};

export const getFirestoreInstance = () => {
  if (!db) {
    console.error('❌ Firebase - Firestore not available');
    throw new Error('Firebase Firestore is not configured. Please check your environment variables.');
  }
  console.log('✅ Firebase - Returning Firestore instance');
  return db;
};

export const getStorageInstance = () => {
  if (!storage) {
    console.error('❌ Firebase - Storage not available');
    throw new Error('Firebase Storage is not configured. Please check your environment variables.');
  }
  console.log('✅ Firebase - Returning storage instance');
  return storage;
};

export { app, auth, db, storage };
