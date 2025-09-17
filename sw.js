const CACHE_NAME = "mon-cache-v1";
const ASSETS = [
  " /", // à adapter selon ton hébergement (sur GitHub Pages, mets '/')
  " /index.html",
  " /js/app.js",
  " /main.css",
   "/manifest.json", 
  " /images/icon-192.png",
  " /images/icon-512.png",
  // ajoute ici tous les autres fichiers nécessaires pour ton app offline
];

self.addEventListener("install", event => {
  console.log("SW installé");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("SW activé");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
    .catch(() => caches.match(event.request))
      .then((response) => response || caches.match("/index.html"))
  );
});

