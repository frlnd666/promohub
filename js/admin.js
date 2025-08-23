// promohub/js/admin.js

// ====== IMPORTS ======
import { app, db, auth } from "./app.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ====== CONSTANTS ======
const UPLOAD_ENDPOINT = 'https://promohub-beta.vercel.app/api/upload'; // gunakan API Vercel milikmu
const CHECK_ECOMOBI_STATUS_ENDPOINT = 'https://promohub-beta.vercel.app/api/check-ecomobi-status'; // opsional, aman jika belum ada

// ====== EDIT STATE ======
let isEditing = { product: false, store: false, promo: false, banner: false };
let currentId = { product: null, store: null, promo: null, banner: null };

// ====== READY ======
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const panes = document.querySelectorAll(".tab-pane");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab") + "-pane";
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add("active");
      if (tab.getAttribute("data-tab") === "members") {
        loadMemberDashboard();
      }
    });
  });

  // Auth guard + admin check
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Anda tidak memiliki akses ke halaman ini. Silakan login terlebih dahulu.");
      window.location.replace("login.html");
      return;
    }
    const isAdmin = await checkIfAdmin(user.uid);
    if (!isAdmin) {
      alert("❌ Akses admin diperlukan.");
      window.location.replace("index.html");
      return;
    }

    // listeners realtime
    listenForProducts();
    listenForStores();
    listenForPromos();
    listenForBanners();
  });

  // Form listeners (optional chaining agar aman bila elemen tak ada)
  document.getElementById("productForm")?.addEventListener("submit", handleProductForm);
  document.getElementById("storeForm")?.addEventListener("submit", handleStoreForm);
  document.getElementById("promoForm")?.addEventListener("submit", handlePromoForm);
  document.getElementById("bannerForm")?.addEventListener("submit", handleBannerForm);
});

// ====== HELPERS ======
async function checkIfAdmin(uid) {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  return snap.exists();
}

function getAffiliateLinks(prefix) {
  // prefix: '', 'store', 'promo' → input id: `${prefix}LinkTokopedia`, dst.
  const links = {};
  const platforms = ["Tokopedia", "Shopee", "Lazada", "Blibli", "Tiktok"];
  platforms.forEach((platform) => {
    const id = `${prefix ? prefix : ""}${prefix ? "Link" : "Link"}${platform}`;
    const el = document.getElementById(id);
    links[platform.toLowerCase()] = el ? (el.value || "") : "";
  });
  return links;
}

function setAffiliateLinks(links, prefix) {
  const platforms = ["Tokopedia", "Shopee", "Lazada", "Blibli", "Tiktok"];
  platforms.forEach((platform) => {
    const id = `${prefix ? prefix : ""}${prefix ? "Link" : "Link"}${platform}`;
    const el = document.getElementById(id);
    if (!el) return;
    const key = platform.toLowerCase();
    el.value = links?.[key] || "";
  });
}

function toNumber(v) {
  const n = typeof v === "string" ? v.replace(/[^\d.]/g, "") : v;
  const out = Number(n);
  return Number.isFinite(out) ? out : 0;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function uploadImage(fileOrBase64, statusDiv) {
  try {
    if (statusDiv) {
      statusDiv.textContent = "Mengunggah gambar...";
      statusDiv.className = "form-status info";
    }

    const base64 = typeof fileOrBase64 === "string" && fileOrBase64.startsWith("data:")
      ? fileOrBase64
      : await toBase64(fileOrBase64);

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: base64, folder: "promohub/banners" }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Upload API tidak mengembalikan JSON. Response: ${text}`);
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `Upload gagal dengan status ${res.status}`);
    }
    if (statusDiv) {
      statusDiv.textContent = "✅ Gambar terunggah";
      statusDiv.className = "form-status success";
    }
    return data.url;
  } catch (err) {
    if (statusDiv) {
      statusDiv.textContent = `❌ Upload gagal: ${err.message}`;
      statusDiv.className = "form-status error";
    }
    throw err;
  }
}

function attachEventListeners() {
  document.querySelectorAll(".action-btn.edit").forEach((btn) => {
    btn.removeEventListener("click", handleEditClick);
    btn.addEventListener("click", handleEditClick);
  });
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.removeEventListener("click", handleDeleteClick);
    btn.addEventListener("click", handleDeleteClick);
  });
}

// ====== PRODUCTS ======
async function handleProductForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById("productStatus");
  const name = document.getElementById("productName")?.value?.trim() || "";
  const description = document.getElementById("productDescription")?.value?.trim() || "";
  const price = toNumber(document.getElementById("productPrice")?.value || 0);
  const cashback = toNumber(document.getElementById("productCashback")?.value || 0);
  const imageFile = document.getElementById("productImage")?.files?.[0] || null;
  const links = getAffiliateLinks("");

  if (!name || !description) {
    if (statusDiv) {
      statusDiv.textContent = "Nama dan deskripsi wajib diisi.";
      statusDiv.className = "form-status error";
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) imageUrl = await uploadImage(imageFile, statusDiv);

    const dataToSave = {
      name,
      description,
      price,
      cashback,
      links,
      updatedAt: serverTimestamp(),
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.product && currentId.product) {
      await updateDoc(doc(db, "products", currentId.product), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Produk diperbarui!";
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Produk disimpan!";
    }

    if (statusDiv) statusDiv.className = "form-status success";
    // reset
    document.getElementById("productForm")?.reset();
    isEditing.product = false;
    currentId.product = null;
    document.getElementById("productFormTitle") && (document.getElementById("productFormTitle").textContent = "Tambah Produk Baru");
  } catch (err) {
    console.error(err);
    if (statusDiv) {
      statusDiv.textContent = `❌ Gagal menyimpan: ${err.message}`;
      statusDiv.className = "form-status error";
    }
  }
}

function listenForProducts() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;
  onSnapshot(collection(db, "products"), (snap) => {
    tbody.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.name || "-"}</td>
        <td>${Number.isFinite(p.price) ? p.price : "-"}</td>
        <td>${Number.isFinite(p.cashback) ? p.cashback : "-"}</td>
        <td>
          <button class="action-btn edit" data-id="${p.id}" data-type="product">Edit</button>
          <button class="action-btn delete" data-id="${p.id}" data-type="product">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachEventListeners();
  });
}

// ====== STORES ======
async function handleStoreForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById("storeStatus");
  const name = document.getElementById("storeName")?.value?.trim() || "";
  const description = document.getElementById("storeDescription")?.value?.trim() || "";
  const logoFile = document.getElementById("storeLogo")?.files?.[0] || null;
  const links = getAffiliateLinks("store");

  if (!name || !description) {
    if (statusDiv) {
      statusDiv.textContent = "Nama & deskripsi toko wajib diisi.";
      statusDiv.className = "form-status error";
    }
    return;
  }

  try {
    let logoUrl = null;
    if (logoFile) logoUrl = await uploadImage(logoFile, statusDiv);

    const dataToSave = {
      name,
      description,
      links,
      updatedAt: serverTimestamp(),
    };
    if (logoUrl) dataToSave.logo = logoUrl;

    if (isEditing.store && currentId.store) {
      await updateDoc(doc(db, "stores", currentId.store), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Toko diperbarui!";
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, "stores"), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Toko disimpan!";
    }

    if (statusDiv) statusDiv.className = "form-status success";
    document.getElementById("storeForm")?.reset();
    isEditing.store = false;
    currentId.store = null;
    document.getElementById("storeFormTitle") && (document.getElementById("storeFormTitle").textContent = "Tambahkan Toko Baru");
  } catch (err) {
    console.error(err);
    if (statusDiv) {
      statusDiv.textContent = `❌ Gagal menyimpan: ${err.message}`;
      statusDiv.className = "form-status error";
    }
  }
}

function listenForStores() {
  const tbody = document.getElementById("storesTableBody");
  if (!tbody) return;
  onSnapshot(collection(db, "stores"), (snap) => {
    tbody.innerHTML = "";
    snap.forEach((docSnap) => {
      const s = { id: docSnap.id, ...docSnap.data() };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.name || "-"}</td>
        <td>${(s.links?.tokopedia || s.links?.shopee || s.links?.lazada || s.links?.blibli || s.links?.tiktok) ? "✓" : "-"}</td>
        <td>
          <button class="action-btn edit" data-id="${s.id}" data-type="store">Edit</button>
          <button class="action-btn delete" data-id="${s.id}" data-type="store">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachEventListeners();
  });
}

// ====== PROMOS ======
async function handlePromoForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById("promoStatus");
  const title = document.getElementById("promoTitle")?.value?.trim() || "";
  const description = document.getElementById("promoDescription")?.value?.trim() || "";
  const imageFile = document.getElementById("promoImage")?.files?.[0] || null;
  const links = getAffiliateLinks("promo");

  if (!title || !description) {
    if (statusDiv) {
      statusDiv.textContent = "Judul & deskripsi promo wajib diisi.";
      statusDiv.className = "form-status error";
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) imageUrl = await uploadImage(imageFile, statusDiv);

    const dataToSave = {
      title,
      description,
      links,
      updatedAt: serverTimestamp(),
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.promo && currentId.promo) {
      await updateDoc(doc(db, "promos", currentId.promo), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Promo diperbarui!";
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, "promos"), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Promo disimpan!";
    }

    if (statusDiv) statusDiv.className = "form-status success";
    document.getElementById("promoForm")?.reset();
    isEditing.promo = false;
    currentId.promo = null;
    document.getElementById("promoFormTitle") && (document.getElementById("promoFormTitle").textContent = "Tambahkan Promo Baru");
  } catch (err) {
    console.error(err);
    if (statusDiv) {
      statusDiv.textContent = `❌ Gagal menyimpan: ${err.message}`;
      statusDiv.className = "form-status error";
    }
  }
}

function listenForPromos() {
  const tbody = document.getElementById("promosTableBody");
  if (!tbody) return;
  onSnapshot(collection(db, "promos"), (snap) => {
    tbody.innerHTML = "";
    snap.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.title || "-"}</td>
        <td>
          <button class="action-btn edit" data-id="${p.id}" data-type="promo">Edit</button>
          <button class="action-btn delete" data-id="${p.id}" data-type="promo">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachEventListeners();
  });
}

// ====== BANNERS ======
async function handleBannerForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById("bannerStatus");
  const title = document.getElementById("bannerTitle")?.value?.trim() || "";
  const link = document.getElementById("bannerLink")?.value?.trim() || "";
  const imageFile = document.getElementById("bannerImage")?.files?.[0] || null;

  if (!title) {
    if (statusDiv) {
      statusDiv.textContent = "Judul banner wajib diisi.";
      statusDiv.className = "form-status error";
    }
    return;
  }

  try {
    let imageUrl = null;
    if (imageFile) imageUrl = await uploadImage(imageFile, statusDiv);

    const dataToSave = {
      title,
      link: link || "",
      updatedAt: serverTimestamp(),
    };
    if (imageUrl) dataToSave.image = imageUrl;

    if (isEditing.banner && currentId.banner) {
      await updateDoc(doc(db, "banners", currentId.banner), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Banner diperbarui!";
    } else {
      dataToSave.createdAt = serverTimestamp();
      await addDoc(collection(db, "banners"), dataToSave);
      if (statusDiv) statusDiv.textContent = "✅ Banner disimpan!";
    }

    if (statusDiv) statusDiv.className = "form-status success";
    document.getElementById("bannerForm")?.reset();
    isEditing.banner = false;
    currentId.banner = null;
    document.getElementById("bannerFormTitle") && (document.getElementById("bannerFormTitle").textContent = "Tambahkan Banner");
  } catch (err) {
    console.error(err);
    if (statusDiv) {
      statusDiv.textContent = `❌ Gagal menyimpan: ${err.message}`;
      statusDiv.className = "form-status error";
    }
  }
}

function listenForBanners() {
  const tbody = document.getElementById("bannersTableBody");
  if (!tbody) return;
  onSnapshot(collection(db, "banners"), (snap) => {
    tbody.innerHTML = "";
    snap.forEach((docSnap) => {
      const b = { id: docSnap.id, ...docSnap.data() };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.title || "-"}</td>
        <td>${b.link ? `<a href="${b.link}" target="_blank" rel="noopener">Link</a>` : "-"}</td>
        <td>
          <button class="action-btn edit" data-id="${b.id}" data-type="banner">Edit</button>
          <button class="action-btn delete" data-id="${b.id}" data-type="banner">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachEventListeners();
  });
}

// ====== DASHBOARD MEMBERS & ORDERS ======
async function loadMemberDashboard() {
  const totalMembersEl = document.getElementById("totalMembers");
  const totalClicksEl = document.getElementById("totalClicks");
  const validOrdersEl = document.getElementById("validOrders");
  const memberListEl = document.getElementById("memberList");
  const loadingStatusEl = document.getElementById("loadingMemberStatus");
  const ordersTableBody = document.getElementById("ordersTableBody");

  if (totalMembersEl) totalMembersEl.textContent = "-";
  if (totalClicksEl) totalClicksEl.textContent = "-";
  if (validOrdersEl) validOrdersEl.textContent = "-";
  if (memberListEl) memberListEl.innerHTML = "";
  if (ordersTableBody) ordersTableBody.innerHTML = "";
  if (loadingStatusEl) loadingStatusEl.style.display = "block";

  try {
    const [usersSnapshot, clicksSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "clicks")),
      getDocs(collection(db, "orders")),
    ]);

    const users = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const clicks = clicksSnapshot.docs.map((d) => d.data());
    const orders = ordersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (totalMembersEl) totalMembersEl.textContent = String(users.length);
    if (totalClicksEl) totalClicksEl.textContent = String(clicks.length);
    if (validOrdersEl) validOrdersEl.textContent = String(orders.filter((o) => o.status === "valid").length);

    // Aggregate member stats
    const memberStats = {};
    users.forEach((u) => {
      memberStats[u.id] = {
        name: u.name || u.email || u.id,
        clicks: 0,
        pendingOrders: 0,
        validOrders: 0,
        rejectedOrders: 0,
        status: u.status || "pending",
      };
    });
    clicks.forEach((c) => {
      if (c?.userId && memberStats[c.userId]) {
        memberStats[c.userId].clicks++;
      }
    });
    orders.forEach((o) => {
      if (!o?.userId || !memberStats[o.userId]) return;
      if (o.status === "pending") memberStats[o.userId].pendingOrders++;
      else if (o.status === "valid") memberStats[o.userId].validOrders++;
      else if (o.status === "rejected") memberStats[o.userId].rejectedOrders++;
    });

    // Render member table
    if (memberListEl) {
      memberListEl.innerHTML = "";
      Object.entries(memberStats).forEach(([uid, stats]) => {
        const tr = document.createElement("tr");
        const statusClass =
          stats.status === "approved" ? "status-approved" :
          stats.status === "rejected" ? "status-rejected" : "status-pending";
        tr.innerHTML = `
          <td>${stats.name}</td>
          <td>${stats.clicks}</td>
          <td>${stats.pendingOrders}</td>
          <td>${stats.validOrders}</td>
          <td class="${statusClass}">${stats.status}</td>
        `;
        memberListEl.appendChild(tr);
      });
    }

    // Render orders for admin
    if (ordersTableBody) {
      ordersTableBody.innerHTML = "";
      orders.forEach((o) => {
        const tr = document.createElement("tr");
        const statusClass =
          o.status === "valid" ? "status-approved" :
          o.status === "rejected" ? "status-rejected" : "status-pending";
        tr.innerHTML = `
          <td>${o.id}</td>
          <td>${o.userId || "-"}</td>
          <td>${o.productId || "-"}</td>
          <td class="${statusClass}">${o.status || "pending"}</td>
          <td>
            <button class="btn small check-status-ecomobi" data-order-id="${o.id}">Cek Ecomobi</button>
          </td>
        `;
        ordersTableBody.appendChild(tr);
      });

      // Action: check ecomobi
      document.querySelectorAll(".check-status-ecomobi").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          const orderId = ev.currentTarget.getAttribute("data-order-id");
          const s = document.getElementById("loadingMemberStatus");
          if (s) {
            s.textContent = "Memeriksa status Ecomobi...";
            s.style.display = "block";
          }
          try {
            const res = await fetch(CHECK_ECOMOBI_STATUS_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            if (res.status === 404) {
              alert("Endpoint /api/check-ecomobi-status belum tersedia di project Vercel kamu.");
              return;
            }
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
              alert(data.message || "Status diperbarui.");
            } else {
              alert(data?.message || `Gagal memeriksa status. HTTP ${res.status}`);
            }
          } catch (err) {
            alert("Gagal menghubungi server: " + err.message);
          } finally {
            await loadMemberDashboard();
            if (s) s.style.display = "none";
          }
        });
      });
    }
  } catch (err) {
    console.error(err);
    alert("Gagal memuat dashboard: " + err.message);
  } finally {
    if (loadingStatusEl) loadingStatusEl.style.display = "none";
  }
}

// ====== EDIT/DELETE HANDLERS ======
async function handleEditClick(e) {
  const itemId = e.currentTarget.getAttribute("data-id");
  const itemType = e.currentTarget.getAttribute("data-type"); // product | store | promo | banner
  const ref = doc(db, `${itemType}s`, itemId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Data tidak ditemukan.");
      return;
    }
    const data = snap.data();

    if (itemType === "product") {
      isEditing.product = true;
      currentId.product = itemId;
      document.getElementById("productFormTitle") && (document.getElementById("productFormTitle").textContent = "Edit Produk");
      document.getElementById("productName") && (document.getElementById("productName").value = data.name || "");
      document.getElementById("productDescription") && (document.getElementById("productDescription").value = data.description || "");
      document.getElementById("productPrice") && (document.getElementById("productPrice").value = data.price ?? "");
      document.getElementById("productCashback") && (document.getElementById("productCashback").value = data.cashback ?? "");
      setAffiliateLinks(data.links, "");
    }

    if (itemType === "store") {
      isEditing.store = true;
      currentId.store = itemId;
      document.getElementById("storeFormTitle") && (document.getElementById("storeFormTitle").textContent = "Edit Toko");
      document.getElementById("storeName") && (document.getElementById("storeName").value = data.name || "");
      document.getElementById("storeDescription") && (document.getElementById("storeDescription").value = data.description || "");
      setAffiliateLinks(data.links, "store");
    }

    if (itemType === "promo") {
      isEditing.promo = true;
      currentId.promo = itemId;
      document.getElementById("promoFormTitle") && (document.getElementById("promoFormTitle").textContent = "Edit Promo");
      document.getElementById("promoTitle") && (document.getElementById("promoTitle").value = data.title || "");
      document.getElementById("promoDescription") && (document.getElementById("promoDescription").value = data.description || "");
      setAffiliateLinks(data.links, "promo");
    }

    if (itemType === "banner") {
      isEditing.banner = true;
      currentId.banner = itemId;
      document.getElementById("bannerFormTitle") && (document.getElementById("bannerFormTitle").textContent = "Edit Banner");
      document.getElementById("bannerTitle") && (document.getElementById("bannerTitle").value = data.title || "");
      document.getElementById("bannerLink") && (document.getElementById("bannerLink").value = data.link || "");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data untuk diedit: " + err.message);
  }
}

async function handleDeleteClick(e) {
  const itemId = e.currentTarget.getAttribute("data-id");
  const itemType = e.currentTarget.getAttribute("data-type");
  if (!itemId || !itemType) return;
  if (!confirm(`Hapus ${itemType} ini?`)) return;
  try {
    await deleteDoc(doc(db, `${itemType}s`, itemId));
    alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} berhasil dihapus.`);
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus: " + err.message);
  }
}
