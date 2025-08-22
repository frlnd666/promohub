// promo-hub/js/wallet.js

import { auth, db } from './app.js';
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const balanceEl = document.getElementById('totalBalance');
  const historyContainer = document.getElementById('transactionHistory');
  const withdrawBtn = document.getElementById('withdrawBtn');
  const MIN_WITHDRAWAL = 150000;
  
  onAuthStateChanged(auth, user => {
    if (user) {
      fetchWalletData(user.uid);
    } else {
      console.log("Pengguna tidak login, tidak dapat memuat data wallet.");
      balanceEl.textContent = 'Rp 0';
      historyContainer.innerHTML = '<p>Silakan login untuk melihat riwayat.</p>';
    }
  });
  
  function fetchWalletData(userId) {
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    
    onSnapshot(q, (querySnapshot) => {
      let totalBalance = 0;
      let transactionsHTML = '';
      
      if (querySnapshot.empty) {
        historyContainer.innerHTML = '<p>Belum ada riwayat transaksi.</p>';
      } else {
        const orders = [];
        querySnapshot.forEach(doc => orders.push(doc.data()));
        
        // Urutkan transaksi berdasarkan tanggal, terbaru di atas
        orders.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        
        orders.forEach(order => {
          const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString('id-ID') : 'Tanggal tidak tersedia';
          
          // FIXED: Saldo dihitung dari status 'valid', bukan 'approved'
          if (order.status === 'valid') {
            totalBalance += order.amount;
          }
          
          // FIXED: Logika kelas CSS disesuaikan dengan status yang benar
          let statusClass = 'pending'; // Default
          if (order.status === 'valid') {
            statusClass = 'approved'; // Gunakan kelas 'approved' untuk styling hijau
          } else if (order.status === 'rejected') {
            statusClass = 'rejected';
          }
          
          // Teks yang akan ditampilkan
          const statusText = order.status === 'valid' ?
            `+ Rp ${order.amount.toLocaleString('id-ID')}` :
            order.status;
          
          transactionsHTML += `
                    <div class="history-item ${statusClass}">
                        <div>
                            <strong>Order #${order.adv_order_id || 'N/A'}</strong>
                            <small style="display:block; color:#b0c4de;">${date}</small>
                        </div>
                        <strong style="text-transform: capitalize;">
                            ${statusText}
                        </strong>
                    </div>`;
        });
        historyContainer.innerHTML = transactionsHTML;
      }
      
      balanceEl.textContent = `Rp ${totalBalance.toLocaleString('id-ID')}`;
      withdrawBtn.disabled = totalBalance < MIN_WITHDRAWAL;
    });
  }
  
  withdrawBtn.addEventListener('click', async () => {
const user = auth.currentUser;
if (!user) return;

// Cek kelengkapan data profil sebelum melanjutkan
const userRef = doc(db, 'users', user.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  const data = userSnap.data();
  // Jika nomor HP atau nomor rekening kosong, beri peringatan
  if (!data.phoneNumber || !data.bankAccountNumber) {
    alert('Harap lengkapi Nomor Handphone dan Nomor Rekening di halaman Profil sebelum melakukan penarikan.');
    window.location.href = 'profile.html'; // Arahkan ke halaman profil
    return;
  }
} else {
  // Ini terjadi jika user login via Google dan belum pernah menyimpan profil
  alert('Data profil tidak ditemukan. Harap lengkapi profil Anda terlebih dahulu.');
  window.location.href = 'profile.html';
  return;
}

// Jika profil lengkap, lanjutkan logika penarikan
// TODO: Implementasikan logika backend untuk memproses penarikan
alert('Profil Anda lengkap! Proses penarikan saldo akan dijalankan.');
});
});
