
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

const getEnv = (key: string) => {
  return (import.meta as any).env?.[`VITE_${key}`] || (process as any).env?.[key] || "";
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db, auth };

const googleProvider = new GoogleAuthProvider();

// محاكاة البيانات محلياً في حال غياب Firebase
const LOCAL_STORAGE_KEY = 'kalja_entries_backup';

export const loginWithGoogle = async () => {
  if (isFirebaseConfigured && auth) {
    return await signInWithPopup(auth, googleProvider);
  }
  // تسجيل دخول وهمي لوضع التجربة
  return { user: { uid: 'guest', displayName: 'ضيف محلي', photoURL: null, email: 'guest@local' } };
};

export const logout = () => auth && isFirebaseConfigured && signOut(auth);

export const addEntry = async (entry: any) => {
  if (isFirebaseConfigured && db) {
    return await addDoc(collection(db, "comments"), {
      ...entry,
      createdAt: serverTimestamp(),
      timestamp: Date.now()
    });
  } else {
    // حفظ محلي
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newEntry, ...current]));
    return newEntry;
  }
};

export const deleteEntry = async (id: string) => {
  if (isFirebaseConfigured && db) {
    return await deleteDoc(doc(db, "comments", id));
  } else {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const filtered = current.filter((e: any) => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }
};

export const subscribeToEntries = (callback: (entries: any[]) => void) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "comments"), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  } else {
    // محاكاة البث المباشر للمحلي
    const sync = () => {
      callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]'));
    };
    sync();
    window.addEventListener('storage', sync);
    const interval = setInterval(sync, 1000);
    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(interval);
    };
  }
};
