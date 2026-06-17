const CACHE_NAME = 'cinema-em-casa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/home',
  '/logo.png',
  '/manifest.json'
];

// Estratégia Cache-First para Fontes e Ícones (Crítico para TVs)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // IGNORAR: SDKs de terceiros, APIs e domínios externos para evitar erros de rede/CORS
  if (
    url.hostname.includes('lge.com') || 
    url.hostname.includes('supabase.co') || 
    url.hostname.includes('google.com') ||
    !url.origin.startsWith(self.location.origin) && url.hostname !== 'image.tmdb.org'
  ) {
    return;
  }

  // Cache para imagens do TMDB (Stale-While-Revalidate)
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open('tmdb-images').then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-First para assets locais
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});