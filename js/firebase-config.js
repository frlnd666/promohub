// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCpw9RcZeXoWr5qykB4awgbCC-MiVVma_M",
  authDomain: "promohub-666.firebaseapp.com",
  projectId: "promohub-666",
  storageBucket: "promohub-666.firebasestorage.app",
  messagingSenderId: "781257685316",
  appId: "1:781257685316:web:3118a505979426e0c6bf11",
  measurementId: "G-ND4NTZM0Q8"
};

// Buat dokumen user otomatis saat login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
        avatarUrl: user.photoURL || "/icons/default-avatar.png",
        role: "member",
        createdAt: serverTimestamp()
      });
    }
  }
});

export { auth, db };
