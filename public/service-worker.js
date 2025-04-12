// Имя кэша, чтобы различать версии
const CACHE_NAME = 'money3-cache-v13';

// Резервные значения для конфигурации БД, если db-config.js не загрузится
const DEFAULT_DB_CONFIG = {
    DB_NAME: 'money',
    DB_VERSION: 8
};

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
    '/money3/manifest.json',
    '/money3/db-config.js'
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

// Обработка сообщений от основного скрипта
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'check-debts') {
        checkForNewDebts();
    }
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
        console.table(todayDebts);
        
        // Если есть новые долги, отправляем уведомление
        if (todayDebts.length > 0) {
            const totalDebt = todayDebts.reduce((sum, payment) => sum + payment.money, 0);
            
            self.registration.showNotification('Новые платежи на сегодня', {
                body: `У вас ${todayDebts.length} новых платежей на сумму ${totalDebt.toLocaleString()} ₽`,
                icon: '/money3/icon-192x192.png',
                badge: '/money3/favicon-32x32.png',
                tag: 'new-debts',
                vibrate: [200, 100, 200],
                data: {
                    dateOfArrival: Date.now(),
                    debtCount: todayDebts.length,
                    debtAmount: totalDebt
                },
                actions: [
                    {
                        action: 'open-app',
                        title: 'Открыть'
                    }
                ]
            });
        } else {
            console.log('Долгов на сегодня не найдено');
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
