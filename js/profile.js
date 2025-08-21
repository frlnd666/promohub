// promo-hub/js/profile.js

import { auth, app } from './app.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Inisialisasi service
const db = getFirestore(app);
const storage = getStorage(app);

// Ambil elemen dari DOM
const profileImage = document.getElementById('profileImage');
const fileUpload = document.getElementById('fileUpload');
const displayName = document.getElementById('displayName');
const displayNameInput = document.getElementById('displayNameInput');
const userEmail = document.getElementById('userEmail');
const phoneNumber = document.getElementById('phoneNumber');
const phoneInput = document.getElementById('phoneInput');
const bankAccount = document.getElementById('bankAccount');
const bankInput = document.getElementById('bankInput');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const logoutBtn = document.getElementById('logoutBtn');
const formStatus = document.getElementById('formStatus');
const editModeElements = document.querySelectorAll('.edit-mode');
const valueElements = document.querySelectorAll('.value');

let currentUser = null;

// Fungsi untuk memuat data profil dari Firestore
async function loadProfileData(user) {
  userEmail.textContent = user.email; // Email diambil dari Auth
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    displayName.textContent = data.displayName || 'Nama Belum Diisi';
    phoneNumber.textContent = data.phoneNumber || 'Belum diisi';
    bankAccount.textContent = data.bankAccountNumber || 'Belum diisi';
    profileImage.src = data.photoURL || 'images/default-avatar.png';
    
    // Isi nilai untuk form edit
    displayNameInput.value = data.displayName || '';
    phoneInput.value = data.phoneNumber || '';
    bankInput.value = data.bankAccountNumber || '';
  } else {
    // Jika user login via Google, ambil data awal dari sana
    displayName.textContent = user.displayName || 'Nama Belum Diisi';
    profileImage.src = user.photoURL || 'images/default-avatar.png';
    displayNameInput.value = user.displayName || '';
  }
}

// Fungsi untuk switch antara mode lihat dan mode edit
function toggleEditMode(isEdit) {
  editModeElements.forEach(el => el.style.display = isEdit ? 'block' : 'none');
  valueElements.forEach(el => el.style.display = isEdit ? 'none' : 'block');
  editBtn.style.display = isEdit ? 'none' : 'block';
  logoutBtn.style.display = isEdit ? 'none' : 'block';
  formStatus.textContent = '';
}

// Cek status login
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadProfileData(user);
  } else {
    window.location.replace('login.html');
  }
});

// Event listeners
editBtn.addEventListener('click', () => toggleEditMode(true));
cancelBtn.addEventListener('click', () => toggleEditMode(false));
logoutBtn.addEventListener('click', () => window.logoutUser()); // Panggil fungsi global dari app.js

// Saat memilih file foto baru
fileUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      profileImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Saat menyimpan perubahan
saveBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  saveBtn.disabled = true;
  formStatus.textContent = 'Menyimpan...';
  formStatus.style.color = '#00ffff';
  
  try {
    let photoURL = null;
    // 1. Upload foto jika ada yang baru
    if (fileUpload.files[0]) {
      const file = fileUpload.files[0];
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(snapshot.ref);
    }
    
    // 2. Ambil data profil yang ada untuk digabungkan
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.exists() ? userSnap.data() : {};
    
    // 3. Siapkan data baru untuk disimpan
    const dataToSave = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: displayNameInput.value || existingData.displayName || currentUser.displayName,
      phoneNumber: phoneInput.value || existingData.phoneNumber || '',
      bankAccountNumber: bankInput.value || existingData.bankAccountNumber || '',
      photoURL: photoURL || existingData.photoURL || currentUser.photoURL || '',
    };
    
    // 4. Simpan ke Firestore
    await setDoc(userRef, dataToSave, { merge: true });
    
    formStatus.textContent = 'Profil berhasil diperbarui!';
    formStatus.style.color = '#50fa7b';
    await loadProfileData(currentUser); // Muat ulang data yang sudah diperbarui
    toggleEditMode(false);
    
  } catch (error) {
    console.error("Gagal menyimpan profil:", error);
    formStatus.textContent = 'Gagal menyimpan profil. Coba lagi.';
    formStatus.style.color = '#ff5555';
  } finally {
    saveBtn.disabled = false;
  }
});
