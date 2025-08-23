import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCpw9RcZeXoWr5qykB4awgbCC-MiVVma_M",
  authDomain: "promohub-666.firebaseapp.com",
  projectId: "promohub-666",
  storageBucket: "promohub-666.firebasestorage.app",
  messagingSenderId: "781257685316",
  appId: "1:781257685316:web:3118a505979426e0c6bf11",
  measurementId: "G-ND4NTZM0Q8"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor service yang dipakai
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
