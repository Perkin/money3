// Имя кэша, чтобы различать версии
const CACHE_NAME = 'money3-cache-v12';

// Файлы, которые будут кэшироваться
const CACHE_ASSETS = [
    '/money3/',
    '/money3/index.html',
    '/money3/favicon.ico',
    '/money3/icon-192x192.png',
    '/money3/icon-512x512.png',
    '/money3/apple-touch-icon.png',
    '/money3/favicon-16x16.png',
    '/money3/favicon-32x32.png',
    '/money3/manifest.json'
];

// Устанавливаем кэш
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэшируем файлы...');
                return cache.addAll(CACHE_ASSETS);
            })
    );
});

// Активируем воркер и удаляем старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Удаляем старый кэш:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Интерсептируем запросы и обслуживаем из кэша
self.addEventListener('fetch', event => {
    // Не кэшируем запросы к API
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
