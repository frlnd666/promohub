// promo-hub/js/app.js

// 1. SEMUA IMPORT HARUS DI BAGIAN PALING ATAS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// 2. INISIALISASI FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Inisialisasi Firestore

// 3. LOGIKA APLIKASI

// Cek status login pengguna untuk melindungi halaman
onAuthStateChanged(auth, (user) => {
  const protectedPages = ['wallet.html', 'profile.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (user) {
    // Pengguna sudah login, jika ada di halaman login, arahkan ke beranda
    if (currentPage === 'login.html') {
      window.location.replace('index.html');
    }
  } else {
    // Pengguna belum login, jika mencoba akses halaman terproteksi, arahkan ke login
    if (protectedPages.includes(currentPage)) {
      window.location.replace('login.html');
    }
  }
});

// --- Fungsi Autentikasi ---

/**
 * Mendaftarkan pengguna baru dengan email/password dan menyimpan data profil ke Firestore.
 */
const registerUser = async (name, phone, bank, email, password) => {
  try {
    // Langkah 1: Buat user di Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Langkah 2: Simpan data profil tambahan ke Firestore di koleksi 'users'
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: name,
      email: email,
      phoneNumber: phone,
      bankAccountNumber: bank,
      photoURL: '' // Foto profil awal dibiarkan kosong
    });

    // Arahkan ke halaman utama setelah berhasil
    window.location.replace('index.html');
  } catch (error) {
    console.error("Error pendaftaran:", error);
    return error.message; // Kembalikan pesan error untuk ditampilkan di UI
  }
};

/**
 * Login pengguna dengan email dan password.
 */
const loginUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.replace('index.html');
  } catch (error) {
    console.error("Error login:", error);
    return error.message;
  }
};

/**
 * Login pengguna menggunakan akun Google.
 */
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    window.location.replace('index.html');
  } catch (error) {
    console.error("Error login Google:", error);
    return error.message;
  }
};

/**
 * Logout pengguna yang sedang aktif.
 */
const logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.replace('login.html');
  } catch (error) {
    console.error("Error logout:", error);
  }
};

// Ekspor semua fungsi dan service yang dibutuhkan oleh file lain
export { auth, app, db, registerUser, loginUser, signInWithGoogle, logoutUser };
