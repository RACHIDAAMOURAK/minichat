// ============================================================
//  Démo "Web mobile : Messaging"
//  - Chat temps réel : WebSocket via Socket.IO
//  - Notifications push : Web Push (VAPID) + Service Worker
// ============================================================
const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const webpush = require("web-push");

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- 1. Clés VAPID (identité du serveur push) ----------
// Générées une seule fois puis sauvegardées dans vapid.json
// Si le système de fichiers est en lecture seule (comme sur Enzonic), on bascule en mémoire.
const VAPID_FILE = path.join(__dirname, "vapid.json");
let vapid;

try {
  if (fs.existsSync(VAPID_FILE)) {
    vapid = JSON.parse(fs.readFileSync(VAPID_FILE, "utf8"));
  } else {
    vapid = webpush.generateVAPIDKeys();
    try {
      fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid, null, 2));
      console.log("Clés VAPID générées et sauvegardées dans vapid.json");
    } catch (writeError) {
      console.log("Impossible d'écrire vapid.json (lecture seule). Clés générées en mémoire.");
    }
  }
} catch (err) {
  console.log("Erreur avec vapid.json. Génération de nouvelles clés en mémoire.");
  vapid = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails("mailto:demo@example.com", vapid.publicKey, vapid.privateKey);

// ---------- 2. Abonnements push (en mémoire) ----------
// endpoint -> { subscription, user }
const subscriptions = new Map();

app.get("/vapidPublicKey", (req, res) => res.json({ key: vapid.publicKey }));

app.post("/subscribe", (req, res) => {
  const { subscription, user } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "abonnement invalide" });
  }
  subscriptions.set(subscription.endpoint, { subscription, user });
  console.log(`Abonnement push : ${user} (${subscriptions.size} au total)`);
  res.status(201).json({ ok: true });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  subscriptions.delete(endpoint);
  res.json({ ok: true });
});

function sendPush(msg) {
  const payload = JSON.stringify({ title: `Nouveau message de ${msg.user}`, body: msg.text });
  for (const [endpoint, { subscription, user }] of subscriptions) {
    if (user === msg.user) continue; // pas de push pour l'expéditeur
    webpush.sendNotification(subscription, payload).catch((err) => {
      // 404 / 410 = abonnement expiré -> on le supprime
      if (err.statusCode === 404 || err.statusCode === 410) subscriptions.delete(endpoint);
      else console.error("Erreur push :", err.statusCode || err.message);
    });
  }
}

// ---------- 3. Chat temps réel (WebSocket) ----------
const history = []; // 50 derniers messages
const MAX_HISTORY = 50;

function onlineUsers() {
  return [...io.sockets.sockets.values()].map((s) => s.data.name).filter(Boolean);
}

io.on("connection", (socket) => {
  // L'utilisateur choisit un pseudo
  socket.on("join", (name) => {
    socket.data.name = String(name || "Anonyme").trim().slice(0, 20) || "Anonyme";
    socket.emit("history", history);
    io.emit("system", `${socket.data.name} a rejoint le chat`);
    io.emit("users", onlineUsers());
  });

  // Nouveau message -> diffusé à tous + push
  socket.on("message", (text) => {
    if (!socket.data.name) return;
    text = String(text || "").trim().slice(0, 500);
    if (!text) return;
    const msg = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      user: socket.data.name,
      text,
      time: new Date().toISOString(),
    };
    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();
    io.emit("message", msg);
    sendPush(msg);
  });

  // Indicateur "est en train d'écrire…"
  socket.on("typing", () => {
    if (socket.data.name) socket.broadcast.emit("typing", socket.data.name);
  });

  socket.on("disconnect", () => {
    if (socket.data.name) {
      io.emit("system", `${socket.data.name} a quitté le chat`);
      io.emit("users", onlineUsers());
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur prêt : http://localhost:${PORT}`);
});