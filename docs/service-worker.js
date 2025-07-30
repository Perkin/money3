// Текущая версия приложения
const APP_VERSION = '1.1.0';
// Имя кэша, чтобы различать версии
const CACHE_NAME = 'money3-cache-v' + APP_VERSION;

// Резервные значения для конфигурации БД, если db-config.js не загрузится
const DEFAULT_DB_CONFIG = {
    DB_NAME: 'money',
    DB_VERSION: 8
};

// Файлы, которые будут кэшироваться при установке
const CACHE_ASSETS = [
    '/money3/',
    '/money3/index.html',
    '/money3/favicon.ico',
    '/money3/icon-192x192.png',
    '/money3/icon-512x512.png',
    '/money3/apple-touch-icon.png',
    '/money3/favicon-16x16.png',
    '/money3/favicon-32x32.png',
    '/money3/manifest.json',
    '/money3/db-config.js'
];

// Отправляем сообщение клиентам
function sendMessageToClients(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}

// Устанавливаем кэш
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Установка');
    sendMessageToClients({ 
        type: 'status', 
        message: 'Установка Service Worker...',
        version: APP_VERSION
    });
    
    // Принудительно активируем новый service worker сразу
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Кэшируем файлы...');
                sendMessageToClients({ 
                    type: 'status', 
                    message: 'Кэширование файлов...',
                    version: APP_VERSION
                });
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                sendMessageToClients({ 
                    type: 'status', 
                    message: 'Кэширование завершено',
                    version: APP_VERSION
                });
            })
    );
});

// Активируем воркер и удаляем старые кэши
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Активация');
    sendMessageToClients({ 
        type: 'status', 
        message: 'Активация Service Worker...',
        version: APP_VERSION 
    });
    
    // Загружаем состояние уведомлений
    event.waitUntil(
        Promise.all([
            // Берем контроль над всеми клиентами сразу
            clients.claim(),
            // Удаляем старые версии кэша
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cache => {
                        if (cache !== CACHE_NAME) {
                            console.log('[ServiceWorker] Удаляем старый кэш:', cache);
                            sendMessageToClients({ 
                                type: 'status', 
                                message: 'Удаление старого кэша...',
                                version: APP_VERSION 
                            });
                            return caches.delete(cache);
                        }
                    })
                );
            })
        ]).then(() => {
            sendMessageToClients({ 
                type: 'status', 
                message: 'Service Worker активирован',
                version: APP_VERSION 
            });
            sendMessageToClients({ 
                type: 'activated', 
                version: APP_VERSION 
            });
        })
    );
});

// Интерсептируем запросы и обслуживаем из кэша
self.addEventListener('fetch', event => {
    // Не кэшируем запросы к API
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    // Не кэшируем запросы с методом, отличным от GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Стратегия Stale-While-Revalidate
    // Сначала показываем из кэша, но обновляем кэш свежими данными
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        // Если получен успешный ответ, обновляем кэш
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('[ServiceWorker] Ошибка при получении ответа:', error);
                        sendMessageToClients({ 
                            type: 'error', 
                            message: 'Ошибка сети при получении ресурса',
                            url: event.request.url,
                            version: APP_VERSION
                        });
                        
                        // Возвращаем ошибку, чтобы цепочка промисов не прерывалась
                        return new Response('Network error', { 
                            status: 500, 
                            headers: new Headers({ 'Content-Type': 'text/plain' })
                        });
                    });
                
                // Возвращаем закэшированный ответ или результат запроса к сети
                return cachedResponse || fetchPromise;
            });
        })
    );
});

// Функция открытия базы данных
function openDB() {
    return new Promise((resolve, reject) => {
        // Используем конфигурацию из глобального объекта или резервные значения
        const config = self.DB_CONFIG || DEFAULT_DB_CONFIG;
        const { DB_NAME, DB_VERSION } = config;
        
        console.log('Открываем БД:', DB_NAME, 'версия:', DB_VERSION);
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Ошибка открытия БД:', event.target.error);
            reject('Не удалось открыть базу данных');
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

// Функция для получения неоплаченных платежей из IndexedDB
async function getPayments() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('payments', 'readonly');
            const store = transaction.objectStore('payments');
            const request = store.index('isPayedIdx').getAll(0);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Ошибка получения платежей:', event.target.error);
                reject('Не удалось получить платежи');
            };
        });
    } catch (error) {
        console.error('Ошибка при получении платежей:', error);
        return [];
    }
}

// Обработка сообщений от основного скрипта
self.addEventListener('message', event => {
    console.log('[ServiceWorker] Получено сообщение:', event.data);
});