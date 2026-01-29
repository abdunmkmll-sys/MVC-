
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore,
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Firestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  browserLocalPersistence,
  setPersistence,
  Auth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// التحقق مما إذا كانت جميع الإعدادات المطلوبة موجودة
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.authDomain
);

let app;
let db: Firestore;
let auth: Auth;

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  auth = getAuth(app);
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence);
  }
}

export { db, auth };

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured) throw new Error("Firebase not configured");
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Auth Error:", error.code);
    throw error;
  }
};

export const logout = () => isFirebaseConfigured && signOut(auth);

export const addEntry = async (entry: any) => {
  if (!isFirebaseConfigured) return;
  const entriesRef = collection(db, "comments");
  const documentData = {
    ...entry,
    createdAt: serverTimestamp(),
    timestamp: Date.now()
  };
  return await addDoc(entriesRef, documentData);
};

export const deleteEntry = async (id: string) => {
  if (!isFirebaseConfigured) return;
  return await deleteDoc(doc(db, "comments", id));
};

export const subscribeToEntries = (callback: (entries: any[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const entriesRef = collection(db, "comments");
  const q = query(entriesRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const fetchedEntries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(fetchedEntries);
  }, (error) => {
    console.warn("Firestore status:", error.message);
  });
};
