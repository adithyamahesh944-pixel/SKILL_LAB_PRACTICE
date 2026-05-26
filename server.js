const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// ── Data helpers (JSON file storage — no database needed) ───────────────────
function readParts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeParts(parts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(parts, null, 2), "utf8");
}

function nextId(parts) {
  return parts.length === 0 ? 1 : Math.max(...parts.map((p) => p.id)) + 1;
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ───────────────────────────────────────────────────────────────

// GET /api/parts/meta/categories
app.get("/api/parts/meta/categories", (req, res) => {
  const parts = readParts();
  const cats = [...new Set(parts.map((p) => p.category))].sort();
  res.json(cats);
});

// GET /api/parts/meta/vehicle-types
app.get("/api/parts/meta/vehicle-types", (req, res) => {
  const parts = readParts();
  const types = [...new Set(parts.map((p) => p.vehicleType))].sort();
  res.json(types);
});

// GET /api/parts
app.get("/api/parts", (req, res) => {
  let parts = readParts();
  const { search, category, vehicleType, lowStock } = req.query;

  if (search) {
    const s = search.toLowerCase();
    parts = parts.filter(
      (p) =>
        p.partName.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        String(p.id) === search
    );
  }
  if (category) parts = parts.filter((p) => p.category === category);
  if (vehicleType) parts = parts.filter((p) => p.vehicleType === vehicleType);
  if (lowStock === "true") parts = parts.filter((p) => p.quantity <= 5);

  res.json(parts);
});

// POST /api/parts
app.post("/api/parts", (req, res) => {
  const { partName, category, sizeSpecification, quantity, price, vehicleType } = req.body;
  if (!partName || !category || !sizeSpecification || quantity == null || price == null || !vehicleType) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const parts = readParts();
  const newPart = {
    id: nextId(parts),
    partName,
    category,
    sizeSpecification,
    quantity: Number(quantity),
    price: Number(price),
    vehicleType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  parts.push(newPart);
  writeParts(parts);
  res.status(201).json(newPart);
});

// GET /api/parts/:id
app.get("/api/parts/:id", (req, res) => {
  const parts = readParts();
  const part = parts.find((p) => p.id === Number(req.params.id));
  if (!part) return res.status(404).json({ error: "Part not found." });
  res.json(part);
});

// PATCH /api/parts/:id
app.patch("/api/parts/:id", (req, res) => {
  const parts = readParts();
  const idx = parts.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Part not found." });

  const { partName, category, sizeSpecification, quantity, price, vehicleType } = req.body;
  const p = parts[idx];
  parts[idx] = {
    ...p,
    partName: partName ?? p.partName,
    category: category ?? p.category,
    sizeSpecification: sizeSpecification ?? p.sizeSpecification,
    quantity: quantity != null ? Number(quantity) : p.quantity,
    price: price != null ? Number(price) : p.price,
    vehicleType: vehicleType ?? p.vehicleType,
    updatedAt: new Date().toISOString(),
  };
  writeParts(parts);
  res.json(parts[idx]);
});

// DELETE /api/parts/:id
app.delete("/api/parts/:id", (req, res) => {
  const parts = readParts();
  const idx = parts.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Part not found." });
  parts.splice(idx, 1);
  writeParts(parts);
  res.sendStatus(204);
});

// GET /api/dashboard/stats
app.get("/api/dashboard/stats", (req, res) => {
  const parts = readParts();

  const totalParts = parts.length;
  const totalValue = parts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStockCount = parts.filter((p) => p.quantity <= 5).length;
  const outOfStockCount = parts.filter((p) => p.quantity === 0).length;

  const catMap = {};
  parts.forEach((p) => {
    if (!catMap[p.category]) catMap[p.category] = { count: 0, totalValue: 0 };
    catMap[p.category].count++;
    catMap[p.category].totalValue += p.price * p.quantity;
  });
  const byCategory = Object.entries(catMap)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const vehMap = {};
  parts.forEach((p) => {
    vehMap[p.vehicleType] = (vehMap[p.vehicleType] || 0) + 1;
  });
  const byVehicleType = Object.entries(vehMap)
    .map(([vehicleType, count]) => ({ vehicleType, count }))
    .sort((a, b) => a.vehicleType.localeCompare(b.vehicleType));

  res.json({ totalParts, totalValue, lowStockCount, outOfStockCount, byCategory, byVehicleType });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  AUTO.SYS Inventory running at http://localhost:${PORT}\n`);
});
