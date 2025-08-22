// promo-hub/js/products.js

// Import Firestore database instance from app.js
import { db } from './app.js';
import { collection, getDocs, limit as firestoreLimit, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'index.html' || currentPage === '') {
    // --- LOGIKA UNTUK HALAMAN UTAMA (HOMEPAGE) ---
    // Muat 6 item dari setiap koleksi Firestore
    loadItems('products', 'productsList', createProductCard, 6);
    loadItems('stores', 'storesList', createStorePromoCard, 6);
    loadItems('promos', 'promosList', createStorePromoCard, 6);
    initBannerSlider();
    
  } else if (currentPage === 'products.html') {
    // Muat semua produk dari koleksi 'products'
    loadItems('products', 'fullProductsList', createProductCard);
    
  } else if (currentPage === 'stores.html') {
    // Muat semua toko dari koleksi 'stores'
    loadItems('stores', 'fullStoresList', createStorePromoCard);
    
  } else if (currentPage === 'promos.html') {
    // Muat semua promo dari koleksi 'promos'
    loadItems('promos', 'fullPromosList', createStorePromoCard);
  }
});

/**
 * Fungsi umum untuk memuat item dari koleksi Firestore.
 * @param {string} collectionName - Nama koleksi di Firestore ('products', 'stores', etc.).
 * @param {string} elementId - ID elemen kontainer di HTML.
 * @param {function} cardCreator - Fungsi untuk membuat kartu HTML.
 * @param {number|null} limit - Batas jumlah item yang akan ditampilkan. Null berarti tanpa batas.
 */
async function loadItems(collectionName, elementId, cardCreator, limit = null) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  try {
    // Buat query ke Firestore, terapkan limit jika ada
    const collectionRef = collection(db, collectionName);
    const q = limit ? query(collectionRef, firestoreLimit(limit)) : collectionRef;
    
    const querySnapshot = await getDocs(q);
    
    container.innerHTML = ''; // Kosongkan kontainer
    
    if (querySnapshot.empty) {
      container.innerHTML = `<p style="text-align: center;">Belum ada data tersedia.</p>`;
      return;
    }
    
    querySnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      const card = cardCreator(item);
      container.appendChild(card);
    });
  } catch (error) {
    console.error(`Gagal memuat data dari koleksi ${collectionName}:`, error);
    container.innerHTML = `<p style="color: #ff5555; text-align: center;">Gagal memuat data.</p>`;
  }
}

// ... sisa fungsi seperti createProductCard, createStorePromoCard, initBannerSlider tetap sama ...

function createProductCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  // Menggunakan 'title' dan 'cashback' sesuai struktur data di Firestore
  card.innerHTML = `
    <img src="${item.image}" alt="${item.title}">
    <h4>${item.title}</h4>
    <p>Cashback: Rp ${item.cashback.toLocaleString('id-ID')}</p>
    <button class="buy-btn">Beli Disini</button>
  `;
  card.querySelector('.buy-btn').addEventListener('click', () => {
    // Pastikan showModal tersedia secara global atau diimpor
    window.showModal(item, 'product');
  });
  return card;
}

function createStorePromoCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  // Menggunakan 'name' untuk stores/promos
  const title = item.name || item.title;
  card.innerHTML = `
    <img src="${item.image}" alt="${title}">
    <h4>${title}</h4>
    <p>${item.description.substring(0, 30)}...</p>
    <button class="view-btn">Lihat Detail</button>
  `;
  card.querySelector('.view-btn').addEventListener('click', () => {
    window.showModal(item, 'store/promo');
  });
  return card;
}

function initBannerSlider() {
  // Fungsi ini dipanggil dari products.js, tapi elemen .slides ada di banner.js
  // Sebaiknya dipindahkan atau dipastikan elemen ada sebelum dijalankan.
  // Untuk saat ini, guard clause sudah cukup aman.
  const slides = document.querySelector('.slides');
  if (!slides) return;
  
  let currentIndex = 0;
  const totalSlides = slides.children.length;
  
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  }, 4000);
}
