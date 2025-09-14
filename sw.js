
self.addEventListener("install", event => {
  console.log("SW installé");
  self.skipWaiting(); // ⚠ Force l'activation immédiate
});

self.addEventListener("activate", event => {
  console.log("SW activé");
  clients.claim(); // Prend le contrôle sans rechargement manuel
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
