// Текущая версия приложения
const APP_VERSION = '1.0.4';
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

// Добавляем хранилище для отслеживания показанных уведомлений
let shownNotifications = {
    payments: new Set(), // Хранит ID платежей, о которых уже были уведомления
    lastShown: {} // Время последнего показа уведомления
};

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
            }),
            // Пытаемся загрузить состояние уведомлений
            loadNotificationState()
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

// Функция загрузки информации о показанных уведомлениях из localStorage
async function loadNotificationState() {
    try {
        // В Service Worker нет прямого доступа к localStorage, поэтому используем клиент
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            // Отправляем запрос клиенту на получение данных из localStorage
            clients[0].postMessage({
                type: 'get-notification-state'
            });
            
            // Данные будут получены как сообщение от клиента
            console.log('[ServiceWorker] Запрос на загрузку состояния уведомлений отправлен клиенту');
        } else {
            console.log('[ServiceWorker] Нет доступных клиентов для загрузки состояния');
        }
    } catch (error) {
        console.error('[ServiceWorker] Ошибка при загрузке состояния уведомлений:', error);
    }
}

// Функция сохранения информации о показанных уведомлениях в localStorage
async function saveNotificationState() {
    try {
        // В Service Worker нет прямого доступа к localStorage, поэтому используем клиент
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            // Преобразуем Set в массив для хранения
            const state = {
                payments: Array.from(shownNotifications.payments),
                lastShown: shownNotifications.lastShown,
                updatedAt: new Date().toISOString()
            };
            
            // Отправляем данные клиенту для сохранения в localStorage
            clients[0].postMessage({
                type: 'save-notification-state',
                state: state
            });
            
            console.log('[ServiceWorker] Запрос на сохранение состояния уведомлений отправлен клиенту');
        } else {
            console.log('[ServiceWorker] Нет доступных клиентов для сохранения состояния');
        }
    } catch (error) {
        console.error('[ServiceWorker] Ошибка при сохранении состояния уведомлений:', error);
    }
}

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

// Функция для проверки новых долгов
async function checkForNewDebts() {
    try {
        // Получаем только неоплаченные платежи
        const unpaidPayments = await getPayments();
        console.log('Получено неоплаченных платежей:', unpaidPayments.length);
        
        // Получаем сегодняшнюю дату (начало дня)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Конец сегодняшнего дня
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Фильтруем платежи, которые становятся должными сегодня
        // Поскольку мы уже получили только неоплаченные, проверяем только дату
        const todayDebts = unpaidPayments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            paymentDate.setHours(0, 0, 0, 0);
            
            return paymentDate.getTime() >= today.getTime() && 
                   paymentDate.getTime() < tomorrow.getTime();
        });
        
        console.log('Найдено долгов на сегодня:', todayDebts.length);
        
        // Проверяем, есть ли новые долги (которые ещё не показывались)
        // и прошло ли достаточно времени с последнего уведомления
        const now = Date.now();
        const lastNotificationTime = shownNotifications.lastShown['today'] || 0;
        const timeSinceLastNotification = now - lastNotificationTime;
        
        // Не показываем уведомления чаще, чем раз в час (3600000 мс)
        const minimumInterval = 3600000;
        
        // Фильтруем только те долги, о которых еще не было уведомлений
        const newDebts = todayDebts.filter(payment => !shownNotifications.payments.has(payment.id));
        
        if (newDebts.length > 0 && (timeSinceLastNotification > minimumInterval)) {
            const totalDebt = newDebts.reduce((sum, payment) => sum + payment.money, 0);
            
            // Отправляем уведомление только о новых долгах
            self.registration.showNotification('Новые платежи на сегодня', {
                body: `У вас ${newDebts.length} новых платежей на сумму ${totalDebt.toLocaleString()} ₽`,
                icon: '/money3/icon-192x192.png',
                badge: '/money3/favicon-32x32.png',
                tag: 'new-debts',
                vibrate: [200, 100, 200],
                data: {
                    dateOfArrival: Date.now(),
                    debtCount: newDebts.length,
                    debtAmount: totalDebt
                },
                actions: [
                    {
                        action: 'open-app',
                        title: 'Открыть'
                    }
                ]
            });
            
            // Сохраняем информацию о показанных уведомлениях
            shownNotifications.lastShown['today'] = now;
            newDebts.forEach(payment => shownNotifications.payments.add(payment.id));
            
            // Сохраняем обновленное состояние
            saveNotificationState();
            
            // Информируем клиентов
            sendMessageToClients({
                type: 'notification-shown',
                count: newDebts.length,
                amount: totalDebt
            });
        } else if (todayDebts.length > 0 && newDebts.length === 0) {
            console.log('Все долги на сегодня уже были показаны в уведомлениях');
        } else {
            console.log('Долгов на сегодня не найдено или интервал между уведомлениями слишком мал');
        }
    } catch (error) {
        console.error('Ошибка при проверке долгов:', error);
    }
}

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open-app') {
        // Открываем приложение
        clients.openWindow('/money3/');
    } else {
        // Действие по умолчанию - также открываем приложение
        clients.openWindow('/money3/');
    }
});

// Функция очистки старых уведомлений
function cleanupOldNotifications() {
    try {
        // Получаем текущую дату
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // Удаляем записи старше 3 дней
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        
        // Ограничиваем количество сохраняемых ID платежей (максимум 100)
        const maxPaymentIds = 100;
        
        // Если сохранено слишком много ID
        if (shownNotifications.payments.size > maxPaymentIds) {
            console.log(`[ServiceWorker] Очистка хранилища уведомлений: было ${shownNotifications.payments.size} записей`);
            
            // Преобразуем Set в массив, чтобы работать с индексами
            const paymentsArray = Array.from(shownNotifications.payments);
            
            // Оставляем только последние maxPaymentIds записей
            const newPaymentsArray = paymentsArray.slice(-maxPaymentIds);
            
            // Обновляем хранилище
            shownNotifications.payments = new Set(newPaymentsArray);
            
            console.log(`[ServiceWorker] После очистки: ${shownNotifications.payments.size} записей`);
            
            // Также удаляем старые записи в lastShown
            const daysToKeep = ['today'];
            for (const day in shownNotifications.lastShown) {
                if (!daysToKeep.includes(day)) {
                    delete shownNotifications.lastShown[day];
                }
            }
            
            // Сохраняем обновленное состояние
            return saveNotificationState();
        }
        
        return Promise.resolve();
    } catch (error) {
        console.error('[ServiceWorker] Ошибка при очистке уведомлений:', error);
        return Promise.resolve();
    }
}

// Обработка сообщений от основного скрипта
self.addEventListener('message', event => {
    console.log('[ServiceWorker] Получено сообщение:', event.data);
    
    if (event.data && event.data.type === 'check-debts') {
        // Если это явный запрос на проверку долгов (например, из кнопки "Проверить долги"),
        // то сбрасываем таймер ограничения частоты и проверяем снова
        if (event.data.force) {
            shownNotifications.lastShown['today'] = 0; // Сброс таймера
        }
        
        // Очищаем старые уведомления перед проверкой
        cleanupOldNotifications().then(() => {
            checkForNewDebts();
        });
    } else if (event.data && event.data.type === 'skipWaiting') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'get-version') {
        // Отправляем информацию о версии
        event.source.postMessage({
            type: 'app-version',
            version: APP_VERSION
        });
    } else if (event.data && event.data.type === 'reset-notifications') {
        // Сбрасываем хранилище показанных уведомлений
        shownNotifications = {
            payments: new Set(),
            lastShown: {}
        };
        // Сохраняем обновленное состояние
        saveNotificationState();
        console.log('[ServiceWorker] Хранилище уведомлений сброшено');
        event.source.postMessage({
            type: 'notifications-reset',
            success: true
        });
    } else if (event.data && event.data.type === 'notification-state-from-client') {
        // Получаем состояние от клиента (из localStorage)
        if (event.data.state) {
            const state = event.data.state;
            console.log('[ServiceWorker] Получено состояние уведомлений от клиента:', state);
            // Преобразуем массив ID обратно в Set
            shownNotifications = {
                payments: new Set(state.payments || []),
                lastShown: state.lastShown || {}
            };
            
            // Очищаем старые уведомления
            cleanupOldNotifications();
        }
    } else if (event.data && event.data.type === 'cleanup-notifications') {
        // Ручная очистка хранилища уведомлений
        cleanupOldNotifications().then(() => {
            event.source.postMessage({
                type: 'notifications-cleaned',
                count: shownNotifications.payments.size
            });
        });
    }
});

// Обработка периодической синхронизации для проверки долгов
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-debts') {
        event.waitUntil(checkForNewDebts());
    }
});

// Обработка события синхронизации
self.addEventListener('sync', event => {
    if (event.tag === 'check-debts') {
        event.waitUntil(checkForNewDebts());
    }
});
