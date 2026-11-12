const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(__dirname, "data", "message.json");
const DEFAULT = { to: "", message: "Écris ton message sur /admin.html 💜" };

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD manquant : crée le fichier .env");
  process.exit(1);
}

// --- Stockage : le message vit dans un petit fichier JSON ---
function readGift() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return DEFAULT; // fichier absent la 1re fois
  }
}
function saveGift(gift) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(gift, null, 2));
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Lire le message (utilisé par la page du cadeau)
app.get("/api/message", (req, res) => {
  res.set("Cache-Control", "no-store"); // toujours la dernière version
  res.json(readGift());
});

// Changer le message (protégé par mot de passe)
app.put("/api/message", (req, res) => {
  if (req.get("x-admin-password") !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }
  const { to = "", message = "" } = req.body || {};
  if (
    typeof to !== "string" || typeof message !== "string" ||
    !message.trim() || message.length > 1000 || to.length > 60
  ) {
    return res.status(400).json({ error: "Message vide ou trop long (1000 caractères max)." });
  }
  saveGift({ to: to.trim(), message: message.trim() });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Serveur prêt : http://localhost:${PORT}`));
