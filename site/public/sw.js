/**
 * Service Worker · Painel dos Corretores
 * Estratégia: network-first pra HTML, cache-first pra assets estáticos.
 * Mantém o site funcionando offline (parcialmente) após a primeira visita.
 */

const CACHE_NAME = 'pj-corretores-v2-2026-08-04'
const OFFLINE_URL = '/painel'
const STATIC_ASSETS = [
  '/painel',
  '/manifest.webmanifest',
  '/imoveis/casa-icone.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => null))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Ignora chamadas cross-origin (Nominatim, OSRM, tiles) — deixa network cuidar
  if (url.origin !== self.location.origin) return

  // Navegações (HTML): network-first, fallback pro cache/offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => null)
          return res
        })
        .catch(() => caches.match(request).then((c) => c || caches.match(OFFLINE_URL)))
    )
    return
  }

  // Assets estáticos (js/css/imagens/fontes): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => null)
        }
        return res
      })
    })
  )
})
