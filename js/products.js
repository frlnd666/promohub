// promo-hub/js/products.js

import { db } from './app.js';
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // Cek nama file HTML yang sedang dibuka
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'index.html' || currentPage === '') {
    // --- LOGIKA UNTUK HALAMAN UTAMA (HOMEPAGE) ---
    // Muat 6 item untuk setiap seksi dari Firestore
    loadItems('products', 'productsList', createProductCard, 6);
    loadItems('stores', 'storesList', createStorePromoCard, 6);
    loadItems('promos', 'promosList', createStorePromoCard, 6);
    // Auto-slide untuk banner
    initBannerSlider();
    
  } else if (currentPage === 'products.html') {
    // --- LOGIKA UNTUK HALAMAN PRODUK ---
    // Muat semua produk tanpa batas
    loadItems('products', 'fullProductsList', createProductCard);
    
  } else if (currentPage === 'stores.html') {
    // --- LOGIKA UNTUK HALAMAN TOKO ---
    loadItems('stores', 'fullStoresList', createStorePromoCard);
    
  } else if (currentPage === 'promos.html') {
    // --- LOGIKA UNTUK HALAMAN PROMO ---
    loadItems('promos', 'fullPromosList', createStorePromoCard);
  }
});

/**
 * Fungsi umum untuk memuat item dari Firestore.
 * @param {string} collectionName - Nama koleksi Firestore ('products', 'stores', 'promos').
 * @param {string} elementId - ID elemen kontainer di HTML.
 * @param {function} cardCreator - Fungsi untuk membuat kartu HTML.
 * @param {number|null} maxLimit - Batas jumlah item yang akan ditampilkan. Null berarti tanpa batas.
 */
async function loadItems(collectionName, elementId, cardCreator, maxLimit = null) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  try {
    let q = query(collection(db, collectionName));
    if (maxLimit) {
      q = query(collection(db, collectionName), limit(maxLimit));
    }
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    container.innerHTML = ''; // Kosongkan kontainer
    
    if (items.length === 0) {
      container.innerHTML = `<p style="color: #aaa; text-align: center;">Tidak ada data tersedia.</p>`;
      return;
    }
    
    items.forEach(item => {
      const card = cardCreator(item);
      container.appendChild(card);
    });
  } catch (error) {
    console.error(`Gagal memuat ${collectionName}:`, error);
    container.innerHTML = `<p style="color: #ff5555; text-align: center;">Gagal memuat data.</p>`;
  }
}

// ... sisa fungsi seperti createProductCard, createStorePromoCard, initBannerSlider tetap sama ...

function createProductCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.innerHTML = `
    <img src="${item.image}" alt="${item.title}">
    <h4>${item.title}</h4>
    <p>Cashback: Rp ${item.cashback}</p>
    <button class="buy-btn">Beli Disini</button>
  `;
  card.querySelector('.buy-btn').addEventListener('click', () => {
    showModal(item, 'product');
  });
  return card;
}

function createStorePromoCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.innerHTML = `
    <img src="${item.image}" alt="${item.name || item.title}">
    <h4>${item.name || item.title}</h4>
    <p>${item.description.substring(0, 30)}...</p>
    <button class="view-btn">Lihat Detail</button>
  `;
  card.querySelector('.view-btn').addEventListener('click', () => {
    showModal(item, 'store/promo');
  });
  return card;
}

function initBannerSlider() {
  const slides = document.querySelector('.slides');
  if (!slides) return;
  
  let currentIndex = 0;
  const totalSlides = slides.children.length;
  
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  }, 4000);
}
