/* ── State ────────────────────────────────────────────────────────────────── */
let currentPage = "dashboard";
let allParts = [];
let pendingDeleteId = null;

/* ── Navigation ───────────────────────────────────────────────────────────── */
function navigate(page, partId) {
  currentPage = page;
  document.querySelectorAll(".page").forEach((el) => el.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page ||
      (page === "add-part" && el.dataset.page === "add-part") ||
      (page === "edit-part" && el.dataset.page === "inventory"));
  });

  if (page === "dashboard") {
    document.getElementById("page-dashboard").classList.remove("hidden");
    loadDashboard();
  } else if (page === "inventory") {
    document.getElementById("page-inventory").classList.remove("hidden");
    loadInventory();
  } else if (page === "add-part") {
    document.getElementById("page-add-part").classList.remove("hidden");
    resetForm();
  } else if (page === "edit-part" && partId) {
    document.getElementById("page-add-part").classList.remove("hidden");
    loadEditForm(partId);
  }
}

/* ── API Helpers ─────────────────────────────────────────────────────────── */
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ── Format Helpers ──────────────────────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function vehicleBadge(v) {
  const map = { Bike: "badge-amber", Car: "badge-blue", Truck: "badge-gray" };
  return `<span class="badge ${map[v] || "badge-gray"}">${v}</span>`;
}

function qtyBadge(q) {
  if (q === 0) return `<span class="badge badge-red">OUT</span> 0`;
  if (q <= 5)  return `<span class="badge badge-amber">LOW</span> ${q}`;
  return `<span class="badge badge-green">OK</span> ${q}`;
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
async function loadDashboard() {
  const [stats, lowParts] = await Promise.all([
    api("/dashboard/stats"),
    api("/parts?lowStock=true"),
  ]);

  document.getElementById("kpi-total").textContent = stats.totalParts;
  document.getElementById("kpi-value").textContent = fmt(stats.totalValue);
  document.getElementById("kpi-low").textContent = stats.lowStockCount;
  document.getElementById("kpi-out").textContent = stats.outOfStockCount;

  // Category bars
  const maxVal = Math.max(...stats.byCategory.map((c) => c.totalValue), 1);
  document.getElementById("category-bars").innerHTML = stats.byCategory
    .map((c) => `
      <div class="cat-row">
        <div class="cat-meta">
          <span class="cat-name">${c.category}</span>
          <span class="cat-val">${fmt(c.totalValue)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round((c.totalValue / maxVal) * 100)}%"></div>
        </div>
      </div>
    `).join("");

  // Vehicle type list
  document.getElementById("vehicle-list").innerHTML = stats.byVehicleType
    .map((v) => `
      <div class="vehicle-row">
        <div class="vehicle-left">
          <div class="vehicle-badge">${v.vehicleType[0]}</div>
          <span class="vehicle-name">${v.vehicleType}</span>
        </div>
        <div>
          <span class="vehicle-count">${v.count}</span>
          <span class="vehicle-parts"> parts</span>
        </div>
      </div>
    `).join("");

  // Low stock alerts
  const alertSection = document.getElementById("alert-section");
  if (lowParts.length > 0) {
    alertSection.style.display = "block";
    document.getElementById("alert-body").innerHTML = lowParts.map((p) => `
      <tr>
        <td>#${p.id}</td>
        <td><strong>${p.partName}</strong></td>
        <td>${p.category}</td>
        <td>${qtyBadge(p.quantity)}</td>
        <td>${vehicleBadge(p.vehicleType)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="navigate('edit-part', ${p.id})">Update Stock</button></td>
      </tr>
    `).join("");
  } else {
    alertSection.style.display = "none";
  }
}

/* ── Inventory ────────────────────────────────────────────────────────────── */
async function loadInventory() {
  // Populate filters
  const [cats, vehicles] = await Promise.all([
    api("/parts/meta/categories"),
    api("/parts/meta/vehicle-types"),
  ]);

  const catSel = document.getElementById("filter-category");
  const curCat = catSel.value;
  catSel.innerHTML = '<option value="">All Categories</option>' +
    cats.map((c) => `<option value="${c}" ${c === curCat ? "selected" : ""}>${c}</option>`).join("");

  const vehSel = document.getElementById("filter-vehicle");
  const curVeh = vehSel.value;
  vehSel.innerHTML = '<option value="">All Vehicles</option>' +
    vehicles.map((v) => `<option value="${v}" ${v === curVeh ? "selected" : ""}>${v}</option>`).join("");

  await fetchAndRender();

  // Populate datalist for form
  document.getElementById("category-list").innerHTML =
    cats.map((c) => `<option value="${c}">`).join("");
}

async function fetchAndRender() {
  const search = document.getElementById("search-input").value.trim();
  const category = document.getElementById("filter-category").value;
  const vehicleType = document.getElementById("filter-vehicle").value;
  const lowStock = document.getElementById("filter-low-stock").checked;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (vehicleType) params.set("vehicleType", vehicleType);
  if (lowStock) params.set("lowStock", "true");

  allParts = await api(`/parts?${params}`);
  renderTable(allParts);
}

function applyFilters() { fetchAndRender(); }

function renderTable(parts) {
  const tbody = document.getElementById("parts-tbody");
  const empty = document.getElementById("parts-empty");

  if (parts.length === 0) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  tbody.innerHTML = parts.map((p) => {
    const rowClass = p.quantity === 0 ? "row-out-of-stock" : p.quantity <= 5 ? "row-low-stock" : "";
    return `
      <tr class="${rowClass}" data-testid="row-part-${p.id}">
        <td><span style="color:var(--muted);font-size:11px">#${p.id}</span></td>
        <td><strong>${p.partName}</strong></td>
        <td>${p.category}</td>
        <td style="color:var(--muted)">${p.sizeSpecification}</td>
        <td>${qtyBadge(p.quantity)}</td>
        <td>${fmt(p.price)}</td>
        <td>${vehicleBadge(p.vehicleType)}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-ghost btn-sm" onclick="navigate('edit-part', ${p.id})" data-testid="btn-edit-${p.id}">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="confirmDelete(${p.id}, '${p.partName.replace(/'/g, "\\'")}')" data-testid="btn-delete-${p.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ── Delete ───────────────────────────────────────────────────────────────── */
function confirmDelete(id, name) {
  pendingDeleteId = id;
  document.getElementById("modal-part-name").textContent = name;
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("modal-confirm-btn").onclick = () => doDelete(id);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  pendingDeleteId = null;
}

async function doDelete(id) {
  try {
    await api(`/parts/${id}`, { method: "DELETE" });
    closeModal();
    toast("Part deleted successfully.");
    await fetchAndRender();
  } catch (e) {
    toast("Error: " + e.message);
  }
}

/* ── Form ─────────────────────────────────────────────────────────────────── */
function resetForm() {
  document.getElementById("edit-id").value = "";
  document.getElementById("form-title").textContent = "Add Spare Part";
  document.getElementById("form-sub").textContent = "NEW INVENTORY ENTRY";
  document.getElementById("submit-btn").textContent = "SAVE PART";
  document.getElementById("part-form").reset();
  ["name","category","size","vehicle","qty","price"].forEach(clearErr);
}

async function loadEditForm(id) {
  document.getElementById("form-title").textContent = "Edit Spare Part";
  document.getElementById("form-sub").textContent = "UPDATE INVENTORY ENTRY";
  document.getElementById("submit-btn").textContent = "UPDATE PART";

  try {
    const p = await api(`/parts/${id}`);
    document.getElementById("edit-id").value = p.id;
    document.getElementById("f-name").value = p.partName;
    document.getElementById("f-category").value = p.category;
    document.getElementById("f-size").value = p.sizeSpecification;
    document.getElementById("f-vehicle").value = p.vehicleType;
    document.getElementById("f-qty").value = p.quantity;
    document.getElementById("f-price").value = p.price;
  } catch (e) {
    toast("Could not load part: " + e.message);
    navigate("inventory");
  }
}

function clearErr(field) {
  document.getElementById(`err-${field}`).textContent = "";
}

function setErr(field, msg) {
  document.getElementById(`err-${field}`).textContent = msg;
}

function validateForm() {
  let valid = true;
  const name = document.getElementById("f-name").value.trim();
  const category = document.getElementById("f-category").value.trim();
  const size = document.getElementById("f-size").value.trim();
  const vehicle = document.getElementById("f-vehicle").value;
  const qty = document.getElementById("f-qty").value;
  const price = document.getElementById("f-price").value;

  if (!name) { setErr("name", "Part name is required."); valid = false; } else clearErr("name");
  if (!category) { setErr("category", "Category is required."); valid = false; } else clearErr("category");
  if (!size) { setErr("size", "Size / Specification is required."); valid = false; } else clearErr("size");
  if (!vehicle) { setErr("vehicle", "Vehicle type is required."); valid = false; } else clearErr("vehicle");
  if (qty === "" || Number(qty) < 0) { setErr("qty", "Quantity must be 0 or more."); valid = false; } else clearErr("qty");
  if (price === "" || Number(price) < 0) { setErr("price", "Price must be 0 or more."); valid = false; } else clearErr("price");

  return valid;
}

async function submitForm(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const editId = document.getElementById("edit-id").value;
  const body = {
    partName: document.getElementById("f-name").value.trim(),
    category: document.getElementById("f-category").value.trim(),
    sizeSpecification: document.getElementById("f-size").value.trim(),
    vehicleType: document.getElementById("f-vehicle").value,
    quantity: Number(document.getElementById("f-qty").value),
    price: Number(document.getElementById("f-price").value),
  };

  const btn = document.getElementById("submit-btn");
  btn.textContent = "SAVING...";
  btn.disabled = true;

  try {
    if (editId) {
      await api(`/parts/${editId}`, { method: "PATCH", body: JSON.stringify(body) });
      toast("Part updated successfully.");
    } else {
      await api("/parts", { method: "POST", body: JSON.stringify(body) });
      toast("Part added successfully.");
    }
    navigate("inventory");
  } catch (err) {
    toast("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? "UPDATE PART" : "SAVE PART";
  }
}

/* ── Init ─────────────────────────────────────────────────────────────────── */
navigate("dashboard");
