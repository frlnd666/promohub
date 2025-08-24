// js/app.js
import { app, auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// == Auth Helpers ==
async function registerUser(email, password, displayName = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // buat dokumen user
  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    name: displayName || email,
    createdAt: Date.now(),
    status: "pending"
  });
  return cred.user;
}

async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  // buat dokumen user jika belum ada
  await setDoc(doc(db, "users", cred.user.uid), {
    email: cred.user.email,
    name: cred.user.displayName || cred.user.email,
    createdAt: Date.now(),
    status: "pending"
  }, { merge: true });
  return cred.user;
}

async function logoutUser() {
  await signOut(auth);
  window.location.replace("login.html");
}

// optional: proteksi halaman ketika diperlukan
function protectPage(redirect = "login.html") {
  onAuthStateChanged(auth, (u) => {
    if (!u) window.location.replace(redirect);
  });
}

export {
  app, auth, db,
  registerUser, loginUser, signInWithGoogle, logoutUser, protectPage
};

// expose logout untuk onclick HTML lama
window.logoutUser = logoutUser;
