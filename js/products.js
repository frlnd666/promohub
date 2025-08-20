// promo-hub/js/products.js

import { db } from './app.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// === FUNGSI UNTUK MERENDER KARTU ITEM ===

// Fungsi untuk merender kartu produk
const renderProduct = (doc) => {
  const product = doc.data();
  return `
        <div class="item-card" onclick="window.showModal({ id: '${doc.id}', ...JSON.parse(JSON.stringify(${JSON.stringify(product)})) }, 'product')">
            <img src="${product.image || 'images/placeholder.png'}" alt="${product.title}">
            <h4>${product.title}</h4>
            <p class="price">Rp ${product.price.toLocaleString('id-ID')}</p>
            <p class="cashback">Cashback Rp ${product.cashback.toLocaleString('id-ID')}</p>
        </div>
    `;
};

// Fungsi untuk merender kartu toko
const renderStore = (doc) => {
  const store = doc.data();
  return `
        <div class="item-card" onclick="window.showModal({ id: '${doc.id}', ...JSON.parse(JSON.stringify(${JSON.stringify(store)})) }, 'store')">
            <img src="${store.image || 'images/placeholder.png'}" alt="${store.name}">
            <h4>${store.name}</h4>
            <p>${store.description.substring(0, 50)}...</p>
        </div>
    `;
};

// Fungsi untuk merender kartu promo
const renderPromo = (doc) => {
  const promo = doc.data();
  return `
        <div class="item-card" onclick="window.showModal({ id: '${doc.id}', ...JSON.parse(JSON.stringify(${JSON.stringify(promo)})) }, 'promo')">
            <img src="${promo.image || 'images/placeholder.png'}" alt="${promo.title}">
            <h4>${promo.title}</h4>
            <p>${promo.description.substring(0, 50)}...</p>
        </div>
    `;
};

// === FUNGSI UTAMA UNTUK MENGAMBIL DAN MENAMPILKAN DATA ===

/**
 * Mengambil data dari koleksi Firestore dan menampilkannya di elemen target.
 * @param {string} collectionName Nama koleksi di Firestore.
 * @param {string} targetElementId ID elemen HTML tempat data akan ditampilkan.
 * @param {Function} renderFunction Fungsi untuk merender setiap dokumen.
 * @param {number|null} docLimit Batas jumlah dokumen yang diambil (null untuk semua).
 */
const fetchAndDisplayItems = async (collectionName, targetElementId, renderFunction, docLimit = null) => {
  const container = document.getElementById(targetElementId);
  if (!container) return; // Jangan jalankan jika elemen tidak ada di halaman
  
  try {
    let q;
    const collectionRef = collection(db, collectionName);
    
    if (docLimit) {
      // Jika ada limit, ambil data terbaru dengan batas
      q = query(collectionRef, orderBy('createdAt', 'desc'), limit(docLimit));
    } else {
      // Ambil semua data, urutkan berdasarkan yang terbaru
      q = query(collectionRef, orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      container.innerHTML = `<p>Belum ada data tersedia.</p>`;
      return;
    }
    
    let itemsHTML = '';
    querySnapshot.forEach(doc => {
      itemsHTML += renderFunction(doc);
    });
    container.innerHTML = itemsHTML;
    
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    container.innerHTML = `<p style="color: #ff5555;">Gagal memuat data. Coba lagi nanti.</p>`;
  }
};


// === EKSEKUSI SAAT HALAMAN DIMUAT ===

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('index.html') || path === '/') {
    // Halaman utama: tampilkan beberapa item saja
    fetchAndDisplayItems('products', 'productsList', renderProduct, 4);
    fetchAndDisplayItems('stores', 'storesList', renderStore, 4);
    fetchAndDisplayItems('promos', 'promosList', renderPromo, 4);
  } else if (path.includes('products.html')) {
    // Halaman produk: tampilkan semua produk
    fetchAndDisplayItems('products', 'fullProductsList', renderProduct);
  } else if (path.includes('stores.html')) {
    // Halaman toko: tampilkan semua toko
    fetchAndDisplayItems('stores', 'fullStoresList', renderStore);
  } else if (path.includes('promos.html')) {
    // Halaman promo: tampilkan semua promo
    fetchAndDisplayItems('promos', 'fullPromosList', renderPromo);
  }
});
