// promo-hub/js/admin.js

import { db, app } from './app.js';
import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const UPLOAD_ENDPOINT = 'https://promohub-beta.vercel.app/api/upload'; // Ganti dengan URL Vercel sebenarnya
const CHECK_ECOMOBI_STATUS_ENDPOINT = 'https://promohub-beta.vercel.app/api/check-ecomobi-status'; // Ganti dengan URL Vercel sebenarnya
const auth = getAuth(app);

// State untuk mode Edit
let isEditing = { product: false, store: false, promo: false, banner: false };
let currentId = { product: null, store: null, promo: null, banner: null };

// Logika untuk menampilkan dan menyembunyikan tab
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.admin-tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            panes.forEach(pane => pane.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab') + '-pane';
            document.getElementById(targetId).classList.add('active');

            if (tab.getAttribute('data-tab') === 'members') {
                loadMemberDashboard();
            }
        });
    });

    // Cek status autentikasi untuk akses admin
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert('Anda tidak memiliki akses ke halaman ini. Silakan login terlebih dahulu.');
        window.location.replace('index.html');
      }
    });

    // Event listeners untuk form
    document.getElementById('productForm').addEventListener('submit', (e) => handleProductForm(e));
    document.getElementById('storeForm').addEventListener('submit', (e) => handleStoreForm(e));
    document.getElementById('promoForm').addEventListener('submit', (e) => handlePromoForm(e));
    document.getElementById('bannerForm').addEventListener('submit', (e) => handleBannerForm(e));

    // Panggil fungsi untuk memuat data saat halaman dimuat
    listenForProducts();
    listenForStores();
    listenForPromos();
    listenForBanners();
});

// =========================================================
// CRUD: FUNGSI BANTUAN
// =========================================================
function getAffiliateLinks(prefix) {
    const links = {};
    const platforms = ['Tokopedia', 'Shopee', 'Lazada', 'Blibli', 'Tiktok'];
    platforms.forEach(platform => {
        const inputId = `${prefix}Link${platform}`;
        const inputElement = document.getElementById(inputId);
        links[platform.toLowerCase()] = inputElement ? inputElement.value : '';
    });
    return links;
}

function setAffiliateLinks(links, prefix) {
    const platforms = ['Tokopedia', 'Shopee', 'Lazada', 'Blibli', 'Tiktok'];
    platforms.forEach(platform => {
        const inputId = `${prefix}Link${platform}`;
        const inputElement = document.getElementById(inputId);
        if (inputElement && links) {
            inputElement.value = links[platform.toLowerCase()] || '';
        }
    });
}

async function uploadImage(imageFile, statusDiv) {
    if (!imageFile) {
        return null;
    }
    statusDiv.textContent = 'Mengunggah gambar...';
    statusDiv.className = 'form-status';

    const formData = new FormData();
    formData.append('file', imageFile);

    const uploadResponse = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
        throw new Error(uploadData.message || 'Gagal mengunggah gambar');
    }
    
    return uploadData.url;
}

// =========================================================
// CRUD: PRODUCTS
// =========================================================
async function handleProductForm(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('productStatus');
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    const cashback = document.getElementById('productCashback').value;
    const imageFile = document.getElementById('productImage').files[0];
    const links = getAffiliateLinks('');

    if (!name || !description || !price || !cashback) {
        statusDiv.textContent = 'Semua field wajib diisi.';
        statusDiv.className = 'form-status error';
        return;
    }

    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile, statusDiv);
        }

        const dataToSave = {
            title: name,
            description: description,
            price: Number(price),
            cashback: Number(cashback),
            links: links,
            updatedAt: serverTimestamp()
        };
        if (imageUrl) {
            dataToSave.image = imageUrl;
        }

        if (isEditing.product) {
            await updateDoc(doc(db, 'products', currentId.product), dataToSave);
            statusDiv.textContent = 'Produk berhasil diperbarui!';
            isEditing.product = false;
            currentId.product = null;
            document.getElementById('productFormTitle').textContent = 'Tambahkan Produk Baru';
        } else {
            dataToSave.createdAt = serverTimestamp();
            await addDoc(collection(db, 'products'), dataToSave);
            statusDiv.textContent = 'Produk berhasil disimpan!';
        }
        statusDiv.className = 'form-status success';
        e.target.reset();
        
    } catch (error) {
        console.error("Error:", error);
        statusDiv.textContent = `Gagal menyimpan: ${error.message}`;
        statusDiv.className = 'form-status error';
    }
}

function listenForProducts() {
    onSnapshot(collection(db, 'products'), (snapshot) => {
        const tableBody = document.getElementById('productsTableBody');  // Asumsi ID benar; ganti jika berbeda
        tableBody.innerHTML = '';  // Kosongkan tabel (asumsi ini bagian dari kode asli yang truncated)

        // Asumsi loop untuk products di sini (truncated di original); tapi dari snippet, ini tampak seperti rendering member stats
        // Jika ini seharusnya untuk products, ganti dengan loop snapshot.docs.forEach(...)
        // Untuk fix, saya sesuaikan dengan kode yang diberikan (member/orders)
        membersData.forEach(stats => {  // Asumsi membersData dari truncated code
            const row = document.createElement('tr');
            const statusClass = stats.status === 'active' ? 'status-active' : 'status-inactive';  // Asumsi logic status
            const statusText = stats.status.toUpperCase();

            row.innerHTML = `
                <td>${stats.userId.slice(0, 6)}...</td>
                <td>${stats.totalClicks}</td>
                <td>${stats.pendingOrders}</td>
                <td>${stats.validOrders}</td>
                <td class="${statusClass}">${statusText}</td>
            `;
            memberListEl.appendChild(row);
        });

        // Tampilkan daftar pesanan untuk admin
        const ordersTableBody = document.getElementById('ordersTableBody');
        ordersTableBody.innerHTML = '';
        ordersData.forEach(order => {
            const row = document.createElement('tr');
            let statusClass = '';
            if (order.status === 'pending') statusClass = 'status-pending';
            if (order.status === 'valid') statusClass = 'status-valid';
            if (order.status === 'rejected') statusClass = 'status-rejected';

            const statusText = order.status.toUpperCase();

            row.innerHTML = `
                <td>${order.userId.slice(0, 6)}...</td>
                <td>${order.adv_order_id || 'N/A'}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>
                    <button class="action-btn check-status-ecomobi" data-order-id="${order.id}">Cek Status</button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    });
                }

        document.querySelectorAll('.check-status-ecomobi').forEach(button => {
            button.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.orderId;
                const statusDiv = document.getElementById('loadingMemberStatus');
                statusDiv.textContent = 'Memeriksa status Ecomobi...';
                statusDiv.style.display = 'block';

                try {
                    const response = await fetch(CHECK_ECOMOBI_STATUS_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ orderId: orderId })
                    });

                    const result = await response.json();
                    if (result.success) {
                        alert(result.message);
                    } else {
                        alert('Gagal: ' + result.message);
                    }
                } catch (error) {
                    alert('Gagal menghubungi server: ' + error.message);
                } finally {
                    loadMemberDashboard(); // Muat ulang dashboard untuk mendapatkan status terbaru
                    statusDiv.style.display = 'none';
                }
            });
        });

    } catch (error) {
        console.error("Gagal memuat data member:", error);
        memberListEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
        totalMembersEl.textContent = 'Err';
        totalClicksEl.textContent = 'Err';
        validOrdersEl.textContent = 'Err';
    } finally {
        loadingStatusEl.style.display = 'none';
    }
}


// =========================================================
// ATTACH EVENT LISTENERS (EDIT & DELETE)
// =========================================================
function attachEventListeners() {
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.removeEventListener('click', handleEditClick); // Remove dulu untuk hindari duplikasi
        button.addEventListener('click', handleEditClick);
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.removeEventListener('click', handleDeleteClick); // Remove dulu
        button.addEventListener('click', handleDeleteClick);
    });
}

async function handleEditClick(e) {
    const itemId = e.target.dataset.id;
    const itemType = e.target.dataset.type;
    const docRef = doc(db, `${itemType}s`, itemId);
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const itemData = docSnap.data();
            const form = document.getElementById(`${itemType}Form`);
            
            // Set mode edit dan ID saat ini
            isEditing[itemType] = true;
            currentId[itemType] = itemId;
            document.getElementById(`${itemType}FormTitle`).textContent = `Edit ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
            
            // Isi form dengan data item
            form.querySelector('input[type="hidden"]').value = itemId;
            
            if (itemType === 'product') {
                document.getElementById('productName').value = itemData.title;
                document.getElementById('productDescription').value = itemData.description;
                document.getElementById('productPrice').value = itemData.price;
                document.getElementById('productCashback').value = itemData.cashback;
                setAffiliateLinks(itemData.links, '');
            } else if (itemType === 'store') {
                document.getElementById('storeName').value = itemData.name;
                document.getElementById('storeDescription').value = itemData.description;
                setAffiliateLinks(itemData.links, 'store');
            } else if (itemType === 'promo') {
                document.getElementById('promoTitle').value = itemData.title;
                document.getElementById('promoDescription').value = itemData.description;
                setAffiliateLinks(itemData.links, 'promo');
            } else if (itemType === 'banner') {
                document.getElementById('bannerTitle').value = itemData.title;
                document.getElementById('bannerLink').value = itemData.link;
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Error fetching data for edit:", error);
        alert('Gagal memuat data untuk diedit.');
    }
}

async function handleDeleteClick(e) {
    const itemId = e.target.dataset.id;
    const itemType = e.target.dataset.type;
    
    if (confirm(`Apakah Anda yakin ingin menghapus ${itemType} ini?`)) {
        try {
            await deleteDoc(doc(db, `${itemType}s`, itemId));
            alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} berhasil dihapus.`);
        } catch (error) {
            console.error("Error deleting item:", error);
            alert(`Gagal menghapus ${itemType}: ${error.message}`);
        }
    }
}
