const CACHE = 'packlist-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // Navigation: network-first so updates land on next visit, fall back to cached shell when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { store(e.request, r.clone()); return r })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/PackList/')))
    )
    return
  }

  // Hashed assets: cache-first (content hash guarantees freshness)
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(r => { store(e.request, r.clone()); return r })
      })
    )
    return
  }

  // Everything else (fonts, icons, manifest): network-first
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) store(e.request, r.clone()); return r })
      .catch(() => caches.match(e.request))
  )
})

async function store(request, response) {
  if (!response || !response.ok) return
  const cache = await caches.open(CACHE)
  cache.put(request, response)
}
