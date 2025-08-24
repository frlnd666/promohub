// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage }    from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// GANTI dengan config project kamu (copy dari Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCpw9RcZeXoWr5qykB4awgbCC-MiVVma_M",
  authDomain: "promohub-666.firebaseapp.com",
  projectId: "promohub-666",
  storageBucket: "promohub-666.appspot.com", // <- perbaikan domain
  messagingSenderId: "781257685316",
  appId: "1:781257685316:web:3118a505979426e0c6bf11",
  measurementId: "G-ND4NTZM0Q8"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
