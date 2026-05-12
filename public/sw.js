// PAIXAOFLIX Service Worker — PWA offline support
const CACHE = 'paixaoflix-v1'
const STATIC = ['/', '/filmes', '/series', '/ao-vivo', '/logo.png', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('api.themoviedb.org') || e.request.url.includes('supabase.co')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
