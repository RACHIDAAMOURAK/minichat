// ============================================================
//  Service Worker : tourne en arrière-plan, même app fermée
// ============================================================
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Le serveur push a envoyé un message
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Chat", body: "Nouveau message" };

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Si l'app est visible à l'écran, inutile de notifier
      if (clients.some((c) => c.visibilityState === "visible")) return;
      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "chat-message", // remplace la notification précédente
        vibrate: [100, 50, 100],
      });
    })
  );
});

// Clic sur la notification : ouvrir / mettre au premier plan l'app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
