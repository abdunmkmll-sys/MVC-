
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
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyPlaceholderKey",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "placeholder-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "placeholder-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);

// حل مشكلة "Could not reach Cloud Firestore backend" عبر Force Long Polling
// وتجاهل الخصائص غير المعرفة لمنع أخطاء التسلسل
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      alert("يرجى السماح بالنوافذ المنبثقة (Popups) في متصفحك لتتمكن من تسجيل الدخول.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed popup");
    } else {
      console.error("Auth Error:", error);
      alert("حدث خطأ في الاتصال بخدمة تسجيل الدخول.");
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

const entriesRef = collection(db, "comments");

/**
 * إصلاح خطأ Circular structure: 
 * كائن serverTimestamp() يحتوي على مراجع دائرية ولا يمكن تحويله لـ JSON 
 * لذا يجب إضافته مباشرة للكائن المرسل لـ addDoc دون استخدام JSON.stringify
 */
export const addEntry = async (entry: any) => {
  // استخراج البيانات البسيطة فقط
  const { victimName, content, category, aiAnalysis, timestamp, userId, userEmail, userPhoto } = entry;
  
  // بناء كائن نظيف يدويًا
  const documentData = {
    victimName: victimName || "مجهول",
    content: content || "",
    category: category || "slip",
    aiAnalysis: aiAnalysis || null,
    timestamp: timestamp || Date.now(),
    userId: userId,
    userEmail: userEmail || null,
    userPhoto: userPhoto || null,
    createdAt: serverTimestamp() // يضاف هنا مباشرة ولا يمر عبر JSON.stringify
  };

  return await addDoc(entriesRef, documentData);
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
          createdAt: data.createdAt?.toMillis?.() || data.timestamp || Date.now()
        };
      });
      callback(fetchedEntries);
    },
    error: (error) => {
      console.warn("Firestore offline mode active:", error.message);
    }
  });
};
