// =========================================
// 1. KONFIGURASI SUPABASE
// =========================================
const SUPABASE_URL = "https://dqsuulqubwgpyxigxzln.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BA2m4dTKoaz-QkKKxrVmKw_66m8HP20";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elemen HTML
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const logoutBtn = document.getElementById("logout-btn");
const loginForm = document.getElementById("login-form");
const loginAlert = document.getElementById("login-alert");

const saleForm = document.getElementById("sale-form");
const saleAlert = document.getElementById("sale-alert");
const salesTableBody = document.getElementById("sales-table-body");

const productForm = document.getElementById("product-form");
const prodAlert = document.getElementById("prod-alert");
const productsTableBody = document.getElementById("products-table-body");

document.getElementById("sale-date").valueAsDate = new Date();

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
}

// =========================================
// 2. NAVIGASI TAB ADMIN
// =========================================
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// =========================================
// 3. LOGIN & LOGOUT
// =========================================
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadProducts();
    loadSales();
  } else {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginAlert.classList.add("hidden");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginAlert.textContent = "Login gagal: " + error.message;
    loginAlert.classList.remove("hidden");
  } else {
    checkAuth();
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  checkAuth();
});

// =========================================
// 4. FUNGSI UPLOAD FOTO KE SUPABASE STORAGE
// =========================================
async function uploadImage(file, bucketName, prefix) {
  if (!file) return null;
  const fileExt = file.name.split(".").pop();
  const fileName = `${prefix}-${Date.now()}.${fileExt}`;

  const { error } = await supabaseClient.storage
    .from(bucketName)
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// =========================================
// 5. KELOLA PRODUK (MUAT, TAMBAH, UBAH STOK, HAPUS)
// =========================================
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    productsTableBody.innerHTML = `<tr><td colspan="6">Gagal memuat produk: ${error.message}</td></tr>`;
    return;
  }

  document.getElementById("stat-products").textContent = data.length;

  // Isi dropdown produk di Form Penjualan secara otomatis
  const saleSelect = document.getElementById("product-name");
  saleSelect.innerHTML = "";
  data.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = `${p.name} (${formatRupiah(p.price)})`;
    saleSelect.appendChild(opt);
  });
  const otherOpt = document.createElement("option");
  otherOpt.value = "Produk Lainnya";
  otherOpt.textContent = "Produk Lainnya";
  saleSelect.appendChild(otherOpt);

  if (data.length === 0) {
    productsTableBody.innerHTML = `<tr><td colspan="6">Belum ada produk.</td></tr>`;
    return;
  }

  productsTableBody.innerHTML = "";
  data.forEach((p) => {
    const statusClass = p.status === "Tersedia" ? "status-ready" : "status-empty";
    const imgUrl = p.image_url || "https://placehold.co/100x100/f1f5f9/0f172a?text=No+Img";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${imgUrl}" alt="${p.name}" class="thumb-img"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category_label}</td>
      <td>${formatRupiah(p.price)}</td>
      <td><span class="status-badge ${statusClass}">${p.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-toggle" onclick="toggleProductStatus(${p.id}, '${p.status}')">
            ${p.status === "Tersedia" ? "Set Habis" : "Set Tersedia"}
          </button>
          <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})">Hapus</button>
        </div>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById("save-prod-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan...";
  prodAlert.classList.add("hidden");

  try {
    const imageFile = document.getElementById("prod-image").files[0];
    const imageUrl = await uploadImage(imageFile, "foto-produk", "produk");

    const catValue = document.getElementById("prod-category").value;
    const catLabel = catValue === "mikrokontroler" ? "Mikrokontroler" : "Layar LCD";

    const newProduct = {
      name: document.getElementById("prod-name").value.trim(),
      category: catValue,
      category_label: catLabel,
      price: parseInt(document.getElementById("prod-price").value, 10),
      status: document.getElementById("prod-status").value,
      specs: document.getElementById("prod-specs").value.trim(),
      image_url: imageUrl
    };

    const { error } = await supabaseClient.from("products").insert([newProduct]);
    if (error) throw error;

    prodAlert.textContent = "Produk berhasil ditambahkan ke katalog!";
    prodAlert.className = "alert-msg alert-success";
    productForm.reset();
    loadProducts();
  } catch (err) {
    prodAlert.textContent = "Gagal menambah produk: " + err.message;
    prodAlert.className = "alert-msg alert-error";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Tambah Produk ke Katalog";
  }
});

window.toggleProductStatus = async function (id, currentStatus) {
  const nextStatus = currentStatus === "Tersedia" ? "Habis" : "Tersedia";
  const { error } = await supabaseClient
    .from("products")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) {
    alert("Gagal mengubah status: " + error.message);
  } else {
    loadProducts();
  }
};

window.deleteProduct = async function (id) {
  if (!confirm("Yakin ingin menghapus produk ini dari katalog?")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    alert("Gagal menghapus produk: " + error.message);
  } else {
    loadProducts();
  }
};

// =========================================
// 6. KELOLA PENJUALAN (SIMPAN, MUAT, HAPUS)
// =========================================
saleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById("save-sale-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan...";
  saleAlert.classList.add("hidden");

  try {
    const transferFile = document.getElementById("transfer-proof").files[0];
    const transactionFile = document.getElementById("transaction-photo").files[0];

    const transferUrl = await uploadImage(transferFile, "bukti-penjualan", "transfer");
    const transactionUrl = await uploadImage(transactionFile, "bukti-penjualan", "transaksi");

    const newSale = {
      product_name: document.getElementById("product-name").value,
      buyer_name: document.getElementById("buyer-name").value.trim(),
      quantity: parseInt(document.getElementById("quantity").value, 10),
      total_price: parseInt(document.getElementById("total-price").value, 10),
      sale_date: document.getElementById("sale-date").value,
      notes: document.getElementById("notes").value.trim(),
      transfer_proof_url: transferUrl,
      transaction_photo_url: transactionUrl
    };

    const { error } = await supabaseClient.from("sales").insert([newSale]);
    if (error) throw error;

    saleAlert.textContent = "Data penjualan berhasil disimpan!";
    saleAlert.className = "alert-msg alert-success";
    saleForm.reset();
    document.getElementById("sale-date").valueAsDate = new Date();
    loadSales();
  } catch (err) {
    saleAlert.textContent = "Gagal menyimpan: " + err.message;
    saleAlert.className = "alert-msg alert-error";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan Data Penjualan";
  }
});

async function loadSales() {
  const { data, error } = await supabaseClient
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    salesTableBody.innerHTML = `<tr><td colspan="7">Gagal memuat data: ${error.message}</td></tr>`;
    return;
  }

  const totalRevenue = data.reduce((sum, item) => sum + Number(item.total_price), 0);
  document.getElementById("stat-count").textContent = data.length;
  document.getElementById("stat-revenue").textContent = formatRupiah(totalRevenue);

  if (data.length === 0) {
    salesTableBody.innerHTML = `<tr><td colspan="7">Belum ada data penjualan.</td></tr>`;
    return;
  }

  salesTableBody.innerHTML = "";
  data.forEach((sale) => {
    const tr = document.createElement("tr");

    let proofHtml = `<div class="proof-links">`;
    if (sale.transfer_proof_url) {
      proofHtml += `<a href="${sale.transfer_proof_url}" target="_blank" class="proof-link">Lihat Bukti Transfer</a>`;
    }
    if (sale.transaction_photo_url) {
      proofHtml += `<a href="${sale.transaction_photo_url}" target="_blank" class="proof-link">Lihat Foto Transaksi</a>`;
    }
    if (!sale.transfer_proof_url && !sale.transaction_photo_url) {
      proofHtml += `<span style="color: var(--text-muted); font-size: 0.82rem;">Tidak ada foto</span>`;
    }
    proofHtml += `</div>`;

    tr.innerHTML = `
      <td>${sale.sale_date}</td>
      <td><strong>${sale.product_name}</strong>${sale.notes ? `<br><small style="color:var(--text-secondary)">${sale.notes}</small>` : ""}</td>
      <td>${sale.buyer_name}</td>
      <td>${sale.quantity}</td>
      <td><strong>${formatRupiah(sale.total_price)}</strong></td>
      <td>${proofHtml}</td>
      <td><button class="btn-sm btn-danger" onclick="deleteSale(${sale.id})">Hapus</button></td>
    `;
    salesTableBody.appendChild(tr);
  });
}

window.deleteSale = async function (id) {
  if (!confirm("Yakin ingin menghapus catatan penjualan ini?")) return;
  const { error } = await supabaseClient.from("sales").delete().eq("id", id);
  if (error) {
    alert("Gagal menghapus: " + error.message);
  } else {
    loadSales();
  }
};

checkAuth();