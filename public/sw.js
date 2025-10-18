const CACHE_NAME = 'vibe-coding-v1'
const RUNTIME_CACHE = 'vibe-coding-runtime'

// Assets para cache inicial
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching precache assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Estratégia de cache: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return

  // Ignorar requisições de API do Supabase (sempre buscar da rede)
  if (event.request.url.includes('supabase.co')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta
        const responseClone = response.clone()
        
        // Cachear a resposta
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseClone)
        })
        
        return response
      })
      .catch(() => {
        // Se a rede falhar, tentar buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Se não houver cache, retornar página offline
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
        })
      })
  )
})

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
})

// Notificações push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'vibe-coding-notification'
  }
  
  event.waitUntil(
    self.registration.showNotification('Vibe Coding', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})
