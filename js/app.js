// =========================================
// 1. PENGATURAN WHATSAPP & SUPABASE
// =========================================
// Ganti dengan nomor WhatsApp kamu (format 628...)
const WHATSAPP_NUMBER = "628113777537";

const SUPABASE_URL = "https://dqsuulqubwgpyxigxzln.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BA2m4dTKoaz-QkKKxrVmKw_66m8HP20";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProducts = [];

// =========================================
// 2. DATA GALERI FOTO
// =========================================
const galleryItems = [
  {
    image: "https://placehold.co/600x400/e2e8f0/0f172a?text=Uji+Coba+ESP32-S3",
    caption: "Pengetesan board ESP32-S3 sebelum dikirim"
  },
  {
    image: "https://placehold.co/600x400/e2e8f0/0f172a?text=Tampilan+TFT+2.8",
    caption: "Contoh tampilan UI di layar TFT LCD 2.8 inch"
  },
  {
    image: "https://placehold.co/600x400/e2e8f0/0f172a?text=Tampilan+TFT+4.0",
    caption: "Tampilan dashboard sensor di TFT LCD 4 inch"
  },
  {
    image: "https://placehold.co/600x400/e2e8f0/0f172a?text=Packing+Aman",
    caption: "Packing aman menggunakan bubble wrap & box"
  }
];

// =========================================
// 3. FUNGSI PEMBANTU
// =========================================
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
}

function createWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// =========================================
// 4. AMBIL DATA PRODUK DARI SUPABASE
// =========================================
async function fetchProducts() {
  const productListEl = document.getElementById("product-list");
  productListEl.innerHTML = `<p class="loading-text">Memuat katalog produk...</p>`;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    productListEl.innerHTML = `<p class="loading-text">Gagal memuat produk: ${error.message}</p>`;
    return;
  }

  allProducts = data || [];
  renderProducts("all");
  renderPriceTable();
}

// =========================================
// 5. MENAMPILKAN KATALOG & TABEL HARGA
// =========================================
function renderProducts(filter = "all") {
  const productListEl = document.getElementById("product-list");
  productListEl.innerHTML = "";

  const filtered = filter === "all"
    ? allProducts
    : allProducts.filter((item) => item.category === filter);

  if (filtered.length === 0) {
    productListEl.innerHTML = `<p class="loading-text">Belum ada produk di kategori ini.</p>`;
    return;
  }

  filtered.forEach((product) => {
    const waMessage = `Halo, saya tertarik memesan *${product.name}* (${formatRupiah(product.price)}). Apakah stoknya masih tersedia?`;
    const waLink = createWhatsAppLink(waMessage);
    const imgUrl = product.image_url || "https://placehold.co/600x400/f1f5f9/0f172a?text=No+Image";

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-wrap">
        <span class="product-badge">${product.status}</span>
        <img src="${imgUrl}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="product-category">${product.category_label}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-specs">${product.specs || ""}</p>
        <div class="product-price">${formatRupiah(product.price)}</div>
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-wa">
          Beli via WhatsApp
        </a>
      </div>
    `;
    productListEl.appendChild(card);
  });
}

function renderPriceTable() {
  const tableBody = document.getElementById("price-table-body");
  tableBody.innerHTML = "";

  if (allProducts.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">Belum ada produk.</td></tr>`;
    return;
  }

  allProducts.forEach((product) => {
    const statusClass = product.status === "Tersedia" ? "status-ready" : "status-empty";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${product.name}</strong></td>
      <td>${product.category_label}</td>
      <td>${formatRupiah(product.price)}</td>
      <td><span class="status-badge ${statusClass}">${product.status}</span></td>
    `;
    tableBody.appendChild(row);
  });
}

function renderGallery() {
  const galleryEl = document.getElementById("gallery-grid");
  galleryEl.innerHTML = "";

  galleryItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.caption}" loading="lazy">
      <div class="gallery-caption">${item.caption}</div>
    `;
    galleryEl.appendChild(div);
  });
}

// =========================================
// 6. INTERAKSI FILTER, KONTAK & MENU HP
// =========================================
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.filter);
  });
});

const contactForm = document.getElementById("contact-form");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama").value.trim();
  const pesan = document.getElementById("pesan").value.trim();

  const fullMessage = `Halo, saya *${nama}*.\n\n${pesan}`;
  window.open(createWhatsAppLink(fullMessage), "_blank");
  contactForm.reset();
});

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// Jalankan saat halaman dibuka
fetchProducts();
renderGallery();