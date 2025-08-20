// promo-hub/js/products.js

document.addEventListener('DOMContentLoaded', () => {
  // Cek nama file HTML yang sedang dibuka
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'index.html' || currentPage === '') {
    // --- LOGIKA UNTUK HALAMAN UTAMA (HOMEPAGE) ---
    // Muat 6 item untuk setiap seksi
    loadItems('data/products.json', 'productsList', createProductCard, 6);
    loadItems('data/stores.json', 'storesList', createStorePromoCard, 6);
    loadItems('data/promos.json', 'promosList', createStorePromoCard, 6);
    // Auto-slide untuk banner
    initBannerSlider();
    
  } else if (currentPage === 'products.html') {
    // --- LOGIKA UNTUK HALAMAN PRODUK ---
    // Muat semua produk tanpa batas
    loadItems('data/products.json', 'fullProductsList', createProductCard);
    
  } else if (currentPage === 'stores.html') {
    // --- LOGIKA UNTUK HALAMAN TOKO ---
    loadItems('data/stores.json', 'fullStoresList', createStorePromoCard);
    
  } else if (currentPage === 'promos.html') {
    // --- LOGIKA UNTUK HALAMAN PROMO ---
    loadItems('data/promos.json', 'fullPromosList', createStorePromoCard);
  }
});

/**
 * Fungsi umum untuk memuat item dari file JSON.
 * @param {string} jsonFile - Nama file JSON.
 * @param {string} elementId - ID elemen kontainer di HTML.
 * @param {function} cardCreator - Fungsi untuk membuat kartu HTML.
 * @param {number|null} limit - Batas jumlah item yang akan ditampilkan. Null berarti tanpa batas.
 */
async function loadItems(jsonFile, elementId, cardCreator, limit = null) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const items = await response.json();
    
    container.innerHTML = ''; // Kosongkan kontainer
    
    // Terapkan batas jika ada, jika tidak, ambil semua item
    const itemsToShow = limit ? items.slice(0, limit) : items;
    
    itemsToShow.forEach(item => {
      const card = cardCreator(item);
      container.appendChild(card);
    });
  } catch (error) {
    console.error(`Gagal memuat ${jsonFile}:`, error);
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
    <img src="${item.image}" alt="${item.name}">
    <h4>${item.name}</h4>
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