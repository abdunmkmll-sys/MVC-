
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInAnonymously 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Check if config is still using placeholders
const isFirebaseConfigured = 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let db: any = null;
let auth: any = null;
let entriesRef: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    entriesRef = collection(db, "comments");
    signInAnonymously(auth).catch(err => console.warn("Firebase Auth disabled or failed:", err));
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
}

export { db, auth, entriesRef, isFirebaseConfigured };

// Helper to interact with LocalStorage as a fallback
const LOCAL_STORAGE_KEY = 'kalajat_fallback_data';

const getLocalEntries = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalEntries = (entries: any[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
};

export const addEntry = async (entry: any) => {
  if (isFirebaseConfigured && entriesRef) {
    return await addDoc(entriesRef, {
      ...entry,
      createdAt: serverTimestamp(),
      timestamp: Date.now()
    });
  } else {
    // Local Fallback
    const entries = getLocalEntries();
    const newEntry = { ...entry, id: Date.now().toString(), timestamp: Date.now() };
    saveLocalEntries([newEntry, ...entries]);
    return newEntry;
  }
};

export const deleteEntry = async (id: string) => {
  if (isFirebaseConfigured && db) {
    return await deleteDoc(doc(db, "comments", id));
  } else {
    // Local Fallback
    const entries = getLocalEntries();
    saveLocalEntries(entries.filter((e: any) => e.id !== id));
  }
};

export const subscribeToEntries = (callback: (entries: any[]) => void) => {
  if (isFirebaseConfigured && entriesRef) {
    const q = query(entriesRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(fetchedEntries);
    }, (error) => {
      console.error("Firestore subscription error, falling back to local:", error);
      callback(getLocalEntries());
    });
  } else {
    // Immediate callback for local data
    callback(getLocalEntries());
    // Simulate "live" by polling or just reliance on app state
    return () => {}; 
  }
};
