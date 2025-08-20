// promo-hub/service-worker.js

const CACHE_NAME = 'promohub-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  
  '/wallet.html',
  '/profile.html',
  '/login.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/products.js',
  
  '/js/firebase-config.js',
  // Tambahkan path ke gambar dan ikon penting
  '/images/step1.png',
  '/images/step2.png',
  '/images/step3.png'
];

// Event 'install': Cache semua aset statis
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => {
      console.log('Cache dibuka');
      return cache.addAll(urlsToCache);
    })
  );
});

// Event 'fetch': Sajikan aset dari cache jika tersedia
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      // Jika ada di cache, kembalikan dari cache
      if (response) {
        return response;
      }
      // Jika tidak, fetch dari jaringan
      return fetch(event.request);
    })
  );
});

// Catatan untuk fitur offline klaim (workflow.txt):
// Untuk memungkinkan pengguna mengisi form klaim saat offline,
// Anda perlu menyimpan data form di IndexedDB.
// Kemudian, gunakan 'background sync' API untuk mengirim data
// ke Firestore secara otomatis saat koneksi internet kembali pulih.
// Ini adalah fungsionalitas PWA yang lebih canggih.