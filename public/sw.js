const CACHE_NAME = 'cinema-em-casa-cache-v1';
const urlsToCache = [
  '/',
  '/filmes',
  '/series',
  // Adicione aqui outros assets estáticos que você queira pré-cachear
  // ex: '/logo.png', '/styles/globals.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia: Stale-While-Revalidate
  // Serve do cache primeiro para velocidade, depois atualiza em segundo plano.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});