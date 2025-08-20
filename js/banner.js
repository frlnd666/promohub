// promo-hub/js/banners.js

import { db } from './app.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const bannerContainer = document.getElementById('bannerCarousel');
  
  if (!bannerContainer) return;
  
  try {
    const bannersCol = collection(db, 'banners');
    const bannerSnapshot = await getDocs(bannersCol);
    const banners = bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (banners.length === 0) {
      bannerContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Tidak ada banner tersedia.</p>';
      return;
    }
    
    // Tampilkan banner pertama (contoh sederhana)
    const banner = banners[0];
    const bannerLink = document.createElement('a');
    bannerLink.href = banner.link;
    bannerLink.innerHTML = `<img src="${banner.image}" alt="${banner.title || 'Banner Promo'}" style="width:100%; height:auto; border-radius:10px;">`;
    bannerContainer.appendChild(bannerLink);
    
    // Catatan: Jika Anda ingin carousel atau slider, Anda perlu menambahkan
    // library JavaScript seperti Swiper.js atau Slick.js dan logika yang lebih kompleks di sini.
    // Kode di atas hanya menampilkan banner pertama.
    
  } catch (error) {
    console.error("Gagal memuat banner dari Firestore:", error);
    bannerContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat banner.</p>';
  }
});