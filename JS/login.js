// login.js - BARU

// Impor fungsi yang diperlukan
import { loginUser, registerUser } from './app.js';

function toggleAuth(mode) {
  document.getElementById('loginForm').classList.toggle('active', mode === 'login');
  document.getElementById('registerForm').classList.toggle('active', mode === 'register');
  document.getElementById('authStatus').textContent = '';
}

// Attach to window so it can be called from inline HTML (onclick="toggleAuth('register')")
window.toggleAuth = toggleAuth;

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi tampilan awal
  toggleAuth('login');
  
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const error = await loginUser(email, password); // Gunakan fungsi impor
    if (error) document.getElementById('authStatus').textContent = error;
  });
  
  document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const error = await registerUser(email, password); // Gunakan fungsi impor
    if (error) document.getElementById('authStatus').textContent = error;
  });
  
  // Event listener untuk tombol Google juga perlu di-setup di sini jika ada
  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const error = await window.signInWithGoogle(); // signInWithGoogle masih perlu diimpor
      if (error) document.getElementById('authStatus').textContent = error;
    });
  }
});