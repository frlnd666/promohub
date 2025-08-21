// promohub/js/admin.js

import { db, app } from './app.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDoc, // ✅ FIX: sebelumnya tidak diimport, tetapi dipakai di handleEditClick
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const UPLOAD_ENDPOINT = '/api/upload'; // ✅ FIX: gunakan path relatif agar bekerja di local & vercel
const CHECK_ECOMOBI_STATUS_ENDPOINT = '/api/check-ecomobi-status'; // ✅ relatif juga (sesuaikan jika route-mu berbeda)
const auth = getAuth(app);

// State untuk mode Edit
let isEditing = { product: false, store: false, promo: false, banner: false };
let currentId = { product: null, store: null, promo: null, banner: null };

// ==== Helper Admin Check (sesuai Firestore Rules kamu) ====
async function assertAdminOrRedirect(user) {
  try {
    const adminRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      alert('Akses ditolak. Akun ini bukan admin.');
      window.location.replace('index.html');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Gagal memverifikasi admin:', e);
    alert('Gagal memverifikasi admin.');
    window.location.replace('index.html');
    return false;
  }
}

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
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert('Anda tidak memiliki akses ke halaman ini. Silakan login terlebih dahulu.');
      window.location.replace('index.html');
      return;
    }

    // ✅ FIX: pastikan benar-benar admin sebelum subscribe data (sesuai rules)
    const ok = await assertAdminOrRedirect(user);
    if (!ok) return;

    // Event listeners untuk form
    document.getElementById('productForm')?.addEventListener('submit', (e) => handleProductForm(e));
    document.getElementById('storeForm')?.addEventListener('submit', (e) => handleStoreForm(e));
    document.getElementById('promoForm')?.addEventListener('submit', (e) => handlePromoForm(e));
    document.getElementById('bannerForm')?.addEventListener('submit', (e) => handleBannerForm(e));

    // Panggil fungsi untuk memuat data saat halaman dimuat (admin only)
    listenForProducts();
    listenForStores();
    listenForPromos();
    listenForBanners();
  });
});

// =========================================================
// FUNGSI BANTUAN
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
  if (!imageFile) return null;
  if (statusDiv) {
    statusDiv.textContent = 'Mengunggah gambar...';
    statusDiv.className = 'form-status';
  }

  const formData = new FormData();
  formData.append('file', imageFile);

  const uploadResponse = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: formData });

  // ✅ FIX: cek res.ok sebelum parsing JSON untuk hindari "Unexpected token T"
  let uploadData;
  try {
    uploadData = await uploadResponse.json();
  } catch (e) {
    throw new Error(`Gagal mengunggah gambar (invalid response)`);
  }

  if (!uploadResponse.ok) {
    throw new Error(uploadData?.error || uploadData?.message || 'Gagal mengunggah gambar');
  }

  return uploadData.url;
}

// =========================================================
// CRUD: PRODUCTS
// =========================================================
async function handleProductForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('productStatus');
  const name = document.getElementById('productName')?.value?.trim();
  const description = document.getElementById('productDescription')?.value?.trim();
  const price = document.getElementById('productPrice')?.value;
  const cashback = document.getElementById('productCashback')?.value;
  const imageFile = document.getElementById('productImage')?.files?.[0];
  const links = getAffiliateLinks('');

  if (!name || !description || !price || !cashback) {
    if (statusDiv) {
      statusDiv.textContent = 'Semua field wajib diisi.';
      statusDiv.className = 'form-status error';
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, statusDiv);
    }

    const dataToSave = {
      title: name,
      description,
      price: Number(price),
      cashback: Number(cashback),
      links,
      updatedAt: serverTimestamp()
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.product) {
      await updateDoc(doc(db, 'products', currentId.product), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Produk berhasil diperbarui!';
      isEditing.product = false;
      currentId.product = null;
      document.getElementById('productFormTitle').textContent = 'Tambahkan Produk Baru';
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, 'products'), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Produk berhasil disimpan!';
    }
    if (statusDiv) statusDiv.className = 'form-status success';
    e.target.reset();

  } catch (error) {
    console.error("Error:", error);
    if (statusDiv) {
      statusDiv.textContent = `Gagal menyimpan: ${error.message}`;
      statusDiv.className = 'form-status error';
    }
  }
}

function listenForProducts() {
  onSnapshot(collection(db, 'products'), (snapshot) => {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    snapshot.docs.forEach(docSnap => {
      const product = { id: docSnap.id, ...docSnap.data() };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.title || '-'}</td>
        <td>Rp ${Number(product.price || 0).toLocaleString('id-ID')}</td>
        <td>Rp ${Number(product.cashback || 0).toLocaleString('id-ID')}</td>
        <td>
          <button class="action-btn edit" data-id="${product.id}" data-type="product">Edit</button>
          <button class="action-btn delete" data-id="${product.id}" data-type="product">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    attachEventListeners();
  });
}

// =========================================================
// CRUD: STORES
// =========================================================
async function handleStoreForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('storeStatus');
  const name = document.getElementById('storeName')?.value?.trim();
  const description = document.getElementById('storeDescription')?.value?.trim();
  const imageFile = document.getElementById('storeLogo')?.files?.[0];
  const links = getAffiliateLinks('store');

  if (!name || !description) {
    if (statusDiv) {
      statusDiv.textContent = 'Nama dan deskripsi harus diisi.';
      statusDiv.className = 'form-status error';
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, statusDiv);
    }

    const dataToSave = {
      name,
      description,
      links,
      updatedAt: serverTimestamp()
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.store) {
      await updateDoc(doc(db, 'stores', currentId.store), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Toko berhasil diperbarui!';
      isEditing.store = false;
      currentId.store = null;
      document.getElementById('storeFormTitle').textContent = 'Tambahkan Toko Baru';
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, 'stores'), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Toko berhasil disimpan!';
    }
    if (statusDiv) statusDiv.className = 'form-status success';
    e.target.reset();

  } catch (error) {
    console.error("Error:", error);
    if (statusDiv) {
      statusDiv.textContent = `Gagal menyimpan: ${error.message}`;
      statusDiv.className = 'form-status error';
    }
  }
}

function listenForStores() {
  onSnapshot(collection(db, 'stores'), (snapshot) => {
    const tableBody = document.getElementById('storesTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    snapshot.docs.forEach(docSnap => {
      const store = { id: docSnap.id, ...docSnap.data() };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${store.name || '-'}</td>
        <td>
          <button class="action-btn edit" data-id="${store.id}" data-type="store">Edit</button>
          <button class="action-btn delete" data-id="${store.id}" data-type="store">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    attachEventListeners();
  });
}

// =========================================================
// CRUD: PROMOS
// =========================================================
async function handlePromoForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('promoStatus');
  const title = document.getElementById('promoTitle')?.value?.trim();
  const description = document.getElementById('promoDescription')?.value?.trim();
  const imageFile = document.getElementById('promoImage')?.files?.[0];
  const links = getAffiliateLinks('promo');

  if (!title || !description) {
    if (statusDiv) {
      statusDiv.textContent = 'Judul dan deskripsi harus diisi.';
      statusDiv.className = 'form-status error';
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, statusDiv);
    }

    const dataToSave = {
      title,
      description,
      links,
      updatedAt: serverTimestamp()
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.promo) {
      await updateDoc(doc(db, 'promos', currentId.promo), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Promo berhasil diperbarui!';
      isEditing.promo = false;
      currentId.promo = null;
      document.getElementById('promoFormTitle').textContent = 'Tambahkan Promo Baru';
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, 'promos'), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Promo berhasil disimpan!';
    }
    if (statusDiv) statusDiv.className = 'form-status success';
    e.target.reset();

  } catch (error) {
    console.error("Error:", error);
    if (statusDiv) {
      statusDiv.textContent = `Gagal menyimpan: ${error.message}`;
      statusDiv.className = 'form-status error';
    }
  }
}

function listenForPromos() {
  onSnapshot(collection(db, 'promos'), (snapshot) => {
    const tableBody = document.getElementById('promosTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    snapshot.docs.forEach(docSnap => {
      const promo = { id: docSnap.id, ...docSnap.data() };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${promo.title || '-'}</td>
        <td>
          <button class="action-btn edit" data-id="${promo.id}" data-type="promo">Edit</button>
          <button class="action-btn delete" data-id="${promo.id}" data-type="promo">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    attachEventListeners();
  });
}

// =========================================================
// CRUD: BANNERS
// =========================================================
async function handleBannerForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('bannerStatus');
  const title = document.getElementById('bannerTitle')?.value?.trim();
  const imageFile = document.getElementById('bannerImage')?.files?.[0];
  const link = document.getElementById('bannerLink')?.value?.trim();

  if (!link) {
    if (statusDiv) {
      statusDiv.textContent = 'Link wajib diisi.';
      statusDiv.className = 'form-status error';
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, statusDiv);
    }

    const dataToSave = {
      title: title || '',
      link,
      updatedAt: serverTimestamp()
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.banner) {
      await updateDoc(doc(db, 'banners', currentId.banner), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Banner berhasil diperbarui!';
      isEditing.banner = false;
      currentId.banner = null;
      document.getElementById('bannerFormTitle').textContent = 'Tambahkan Banner Baru';
    } else {
      if (!imageFile) {
        if (statusDiv) {
          statusDiv.textContent = 'Gambar banner wajib diisi untuk unggahan baru.';
          statusDiv.className = 'form-status error';
        }
        return;
      }
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, 'banners'), dataToSave);
      if (statusDiv) statusDiv.textContent = 'Banner berhasil disimpan!';
    }
    if (statusDiv) statusDiv.className = 'form-status success';
    e.target.reset();

  } catch (error) {
    console.error("Error:", error);
    if (statusDiv) {
      statusDiv.textContent = `Gagal menyimpan: ${error.message}`;
      statusDiv.className = 'form-status error';
    }
  }
}

function listenForBanners() {
  onSnapshot(collection(db, 'banners'), (snapshot) => {
    const tableBody = document.getElementById('bannersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    snapshot.docs.forEach(docSnap => {
      const banner = { id: docSnap.id, ...docSnap.data() };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${banner.title || banner.image || '-'}</td>
        <td>
          <button class="action-btn edit" data-id="${banner.id}" data-type="banner">Edit</button>
          <button class="action-btn delete" data-id="${banner.id}" data-type="banner">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    attachEventListeners();
  });
}

// =========================================================
// DASHBOARD MEMBER
// =========================================================
async function loadMemberDashboard() {
  const totalMembersEl = document.getElementById('totalMembers');
  const totalClicksEl = document.getElementById('totalClicks');
  const validOrdersEl = document.getElementById('validOrders');
  const memberListEl = document.getElementById('memberList');
  const loadingStatusEl = document.getElementById('loadingMemberStatus');

  if (totalMembersEl) totalMembersEl.textContent = '-';
  if (totalClicksEl) totalClicksEl.textContent = '-';
  if (validOrdersEl) validOrdersEl.textContent = '-';
  if (memberListEl) memberListEl.innerHTML = '';
  if (loadingStatusEl) loadingStatusEl.style.display = 'block';

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const clicksSnapshot = await getDocs(collection(db, 'clicks'));
    const ordersSnapshot = await getDocs(collection(db, 'orders'));

    const usersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const clicksData = clicksSnapshot.docs.map(d => d.data());
    const ordersData = ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (totalMembersEl) totalMembersEl.textContent = usersData.length;
    if (totalClicksEl) totalClicksEl.textContent = clicksData.length;

    // ✅ FIX: Samakan istilah status order dengan yang dipakai di wallet.js => 'approved'
    const approvedCount = ordersData.filter(o => o.status === 'approved').length;
    if (validOrdersEl) validOrdersEl.textContent = approvedCount;

    const memberStats = {};
    usersData.forEach(user => {
      memberStats[user.id] = {
        name: user.displayName || user.name || user.email || user.uid || '-',
        clicks: 0,
        pendingOrders: 0,
        validOrders: 0,
        rejectedOrders: 0,
        status: user.status || 'pending'
      };
    });

    clicksData.forEach(click => {
      if (click?.userId && memberStats[click.userId]) {
        memberStats[click.userId].clicks++;
      }
    });

    ordersData.forEach(order => {
      if (order?.userId && memberStats[order.userId]) {
        if (order.status === 'pending') memberStats[order.userId].pendingOrders++;
        else if (order.status === 'approved') memberStats[order.userId].validOrders++; // ✅ konsisten
        else if (order.status === 'rejected') memberStats[order.userId].rejectedOrders++;
      }
    });

    if (memberListEl) {
      for (const userId in memberStats) {
        const stats = memberStats[userId];
        const row = document.createElement('tr');
        const statusClass = stats.status === 'valid' ? 'status-valid' : 'status-pending';
        const statusText = stats.status === 'valid' ? 'VALID' : 'PENDING';

        row.innerHTML = `
          <td>${stats.name}</td>
          <td>${stats.clicks}</td>
          <td>${stats.pendingOrders}</td>
          <td>${stats.validOrders}</td>
          <td class="${statusClass}">${statusText}</td>
        `;
        memberListEl.appendChild(row);
      }
    }

    // Tampilkan daftar pesanan untuk admin
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (ordersTableBody) {
      ordersTableBody.innerHTML = '';
      ordersData.forEach(order => {
        const row = document.createElement('tr');
        let statusClass = '';
        if (order.status === 'pending') statusClass = 'status-pending';
        if (order.status === 'approved') statusClass = 'status-valid';
        if (order.status === 'rejected') statusClass = 'status-rejected';

        const statusText = (order.status || '').toUpperCase();

        row.innerHTML = `
          <td>${order.userId ? order.userId.slice(0, 6) + '...' : '-'}</td>
          <td>${order.adv_order_id || 'N/A'}</td>
          <td class="${statusClass}">${statusText || '-'}</td>
          <td>
            <button class="action-btn check-status-ecomobi" data-order-id="${order.id}">Cek Status</button>
          </td>
        `;
        ordersTableBody.appendChild(row);
      });

      document.querySelectorAll('.check-status-ecomobi').forEach(button => {
        button.addEventListener('click', async (e) => {
          const orderId = e.target.dataset.orderId;
          const statusDiv = document.getElementById('loadingMemberStatus');
          if (statusDiv) {
            statusDiv.textContent = 'Memeriksa status Ecomobi...';
            statusDiv.style.display = 'block';
          }

          try {
            const response = await fetch(CHECK_ECOMOBI_STATUS_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: orderId })
            });

            const result = await response.json();
            if (response.ok && result.success) {
              alert(result.message || 'Status berhasil diperbarui.');
            } else {
              alert('Gagal: ' + (result.message || response.statusText));
            }
          } catch (error) {
            alert('Gagal menghubungi server: ' + error.message);
          } finally {
            await loadMemberDashboard(); // refresh data
            if (statusDiv) statusDiv.style.display = 'none';
          }
        });
      });
    }

  } catch (error) {
    console.error("Gagal memuat data member:", error);
    if (memberListEl) {
      memberListEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
    }
    if (totalMembersEl) totalMembersEl.textContent = 'Err';
    if (totalClicksEl) totalClicksEl.textContent = 'Err';
    if (validOrdersEl) validOrdersEl.textContent = 'Err';
  } finally {
    if (loadingStatusEl) loadingStatusEl.style.display = 'none';
  }
}

// =========================================================
// ATTACH EVENT LISTENERS (EDIT & DELETE)
// =========================================================
function attachEventListeners() {
  document.querySelectorAll('.action-btn.edit').forEach(button => {
    button.removeEventListener('click', handleEditClick);
    button.addEventListener('click', handleEditClick);
  });

  document.querySelectorAll('.action-btn.delete').forEach(button => {
    button.removeEventListener('click', handleDeleteClick);
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
      if (!form) return;

      // Set mode edit dan ID saat ini
      isEditing[itemType] = true;
      currentId[itemType] = itemId;
      document.getElementById(`${itemType}FormTitle`).textContent =
        `Edit ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;

      // Isi form dengan data item
      const hidden = form.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = itemId;

      if (itemType === 'product') {
        document.getElementById('productName').value = itemData.title || '';
        document.getElementById('productDescription').value = itemData.description || '';
        document.getElementById('productPrice').value = itemData.price ?? '';
        document.getElementById('productCashback').value = itemData.cashback ?? '';
        setAffiliateLinks(itemData.links, '');
      } else if (itemType === 'store') {
        document.getElementById('storeName').value = itemData.name || '';
        document.getElementById('storeDescription').value = itemData.description || '';
        setAffiliateLinks(itemData.links, 'store');
      } else if (itemType === 'promo') {
        document.getElementById('promoTitle').value = itemData.title || '';
        document.getElementById('promoDescription').value = itemData.description || '';
        setAffiliateLinks(itemData.links, 'promo');
      } else if (itemType === 'banner') {
        document.getElementById('bannerTitle').value = itemData.title || '';
        document.getElementById('bannerLink').value = itemData.link || '';
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
      console.error('Gagal menghapus:', error);
      alert('Gagal menghapus item.');
    }
  }
}
