// PAIXAOFLIX Service Worker — PWA offline support
const CACHE = 'paixaoflix-v2'
const STATIC = ['/', '/filmes', '/series', '/ao-vivo', '/logo.png', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // Não interceptar chamadas de API externas para evitar erros de CORS/Response
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  e.respondWith(
    fetch(e.request).catch(async () => {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      return new Response("Rede indisponível", { status: 503, headers: { "Content-Type": "text/plain" } });
    })
  );
});
