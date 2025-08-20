// promo-hub/js/wallet.js

// Impor service dan fungsi yang dibutuhkan
import { auth, db } from './app.js';
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen dari DOM
    const balanceEl = document.getElementById('totalBalance');
    const historyContainer = document.getElementById('transactionHistory');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const MIN_WITHDRAWAL = 150000;
    
    // Cek status login pengguna
    onAuthStateChanged(auth, user => {
        if (user) {
            // Jika pengguna login, ambil data wallet-nya secara real-time
            fetchWalletData(user.uid);
        } else {
            console.log("Pengguna tidak login, tidak dapat memuat data wallet.");
            // Anda bisa menampilkan pesan di UI jika perlu
            balanceEl.textContent = 'Rp 0';
            historyContainer.innerHTML = '<p>Silakan login untuk melihat riwayat.</p>';
        }
    });
    
    /**
     * Mengambil data orders dari Firestore dan memperbarui UI.
     * @param {string} userId - ID pengguna yang sedang login.
     */
    function fetchWalletData(userId) {
        // Buat query untuk mendapatkan semua orders milik pengguna ini
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        
        // Gunakan onSnapshot untuk mendengarkan perubahan data secara real-time
        onSnapshot(q, (querySnapshot) => {
            let totalBalance = 0;
            let transactionsHTML = '';
            
            if (querySnapshot.empty) {
                historyContainer.innerHTML = '<p>Belum ada riwayat transaksi.</p>';
            } else {
                querySnapshot.forEach((doc) => {
                    const order = doc.data();
                    const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString('id-ID') : 'Tanggal tidak tersedia';
                    
                    // Hanya pesanan yang disetujui ('approved') yang masuk ke saldo
                    if (order.status === 'approved') {
                        totalBalance += order.amount;
                    }
                    
                    // Tambahkan kelas CSS berdasarkan status transaksi
                    let statusClass = 'pending';
                    if (order.status === 'approved') {
                        statusClass = 'approved';
                    } else if (order.status === 'rejected') {
                        statusClass = 'rejected';
                    }
                    
                    // Buat elemen HTML untuk setiap riwayat transaksi
                    transactionsHTML += `
                    <div class="history-item ${statusClass}">
                        <div>
                            <strong>Order #${order.adv_order_id || 'N/A'}</strong>
                            <small style="display:block; color:#b0c4de;">${date}</small>
                        </div>
                        <strong style="text-transform: capitalize;">
                            ${order.status === 'approved' ? `+ Rp ${order.amount.toLocaleString('id-ID')}` : order.status}
                        </strong>
                    </div>`;
                });
                historyContainer.innerHTML = transactionsHTML;
            }
            
            // Perbarui total saldo di UI
            balanceEl.textContent = `Rp ${totalBalance.toLocaleString('id-ID')}`;
            
            // Atur status tombol withdraw berdasarkan saldo
            withdrawBtn.disabled = totalBalance < MIN_WITHDRAWAL;
        });
    }
    
    // Tambahkan event listener untuk tombol "Tarik Saldo"
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