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
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('api.themoviedb.org') || e.request.url.includes('supabase.co')) return

  // Sempre buscar novos ícones do servidor para garantir atualização
  if (e.request.url.includes('logo.png') || e.request.url.includes('icon')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Atualizar cache com nova versão
          const responseClone = response.clone()
          caches.open(CACHE).then(cache => {
            cache.put(e.request, responseClone)
          })
          return response
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
