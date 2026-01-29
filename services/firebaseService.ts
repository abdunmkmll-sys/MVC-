
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore,
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
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "placeholder-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "placeholder-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);

// تعزيز استقرار الاتصال بـ Firestore عبر تفعيل Long Polling بشكل قسري وتعديل الإعدادات للبيئات المقيدة
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const auth = getAuth(app);
// تأمين استمرارية الجلسة في المتصفح
setPersistence(auth, browserLocalPersistence);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * معالجة تسجيل الدخول مع التعامل مع أخطاء النوافذ المنبثقة الشائعة
 */
export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      alert("عذراً، المتصفح حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع للمتابعة.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed the login popup.");
    } else {
      console.error("Auth error:", error);
      alert("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

const entriesRef = collection(db, "comments");

export const addEntry = async (entry: any) => {
  // تنظيف البيانات لضمان أنها قابلة للتسلسل (Serializable) قبل الإرسال
  const cleanEntry = JSON.parse(JSON.stringify({
    ...entry,
    createdAt: serverTimestamp(),
    timestamp: Date.now()
  }));
  
  return await addDoc(entriesRef, cleanEntry);
};

export const deleteEntry = async (id: string) => {
  return await deleteDoc(doc(db, "comments", id));
};

export const subscribeToEntries = (callback: (entries: any[]) => void) => {
  const q = query(entriesRef, orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, {
    next: (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // تحويل Firestore Timestamp إلى رقم لضمان سهولة الاستخدام في React
          createdAt: data.createdAt?.toMillis?.() || data.timestamp || Date.now()
        };
      });
      callback(fetchedEntries);
    },
    error: (error) => {
      // التعامل الصامت مع أخطاء الاتصال المؤقتة لتجنب إزعاج المستخدم
      console.warn("Firestore Snapshot error (likely offline):", error);
    }
  });
};
