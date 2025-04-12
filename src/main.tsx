import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Функция для отметки приложения как загруженного
function markAppAsLoaded() {
    document.body.classList.add('app-loaded');
    console.log('Приложение загружено');
}

// Функция обновления статуса загрузки
function updateLoadingStatus(message: string) {
    const statusElement = document.getElementById('app-loading-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Рендерим приложение и после загрузки скрываем индикатор загрузки
const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Отмечаем приложение как загруженное после рендеринга компонентов
// Используем requestAnimationFrame для гарантии, что DOM обновлен
window.requestAnimationFrame(() => {
    // Даем немного времени для загрузки ресурсов и рендеринга
    setTimeout(markAppAsLoaded, 500);
});

// Объявление интерфейсов для Periodic Background Sync API
declare global {
    interface ServiceWorkerRegistration {
        periodicSync?: {
            register(tag: string, options?: { minInterval: number }): Promise<void>;
            unregister(tag: string): Promise<void>;
            getTags(): Promise<string[]>;
        };
        sync?: {
            register(tag: string): Promise<void>;
            getTags(): Promise<string[]>;
        };
    }
}

// Расширение типа PermissionName
declare global {
    interface PermissionNameMap {
        'periodic-background-sync': void;
    }
}

// Обработка сообщений от Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('Получено сообщение от ServiceWorker:', event.data);
        
        // Обработка запроса на загрузку состояния уведомлений из localStorage
        if (event.data && event.data.type === 'get-notification-state') {
            try {
                const storedState = localStorage.getItem('notificationState');
                let state = null;
                
                if (storedState) {
                    state = JSON.parse(storedState);
                    console.log('Загружено состояние уведомлений из localStorage:', state);
                }
                
                // Отправляем состояние в Service Worker
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'notification-state-from-client',
                        state: state
                    });
                }
            } catch (error) {
                console.error('Ошибка при загрузке состояния уведомлений из localStorage:', error);
            }
        }
        
        // Обработка запроса на сохранение состояния уведомлений в localStorage
        else if (event.data && event.data.type === 'save-notification-state') {
            try {
                const state = event.data.state;
                localStorage.setItem('notificationState', JSON.stringify(state));
                console.log('Состояние уведомлений сохранено в localStorage:', state);
            } catch (error) {
                console.error('Ошибка при сохранении состояния уведомлений в localStorage:', error);
            }
        }
        
        // Другие типы сообщений обрабатываются здесь
        else if (event.data && event.data.type === 'status') {
            updateLoadingStatus(event.data.message);
        }
        else if (event.data && event.data.type === 'activated') {
            console.log('Service Worker активирован, версия:', event.data.version);
            markAppAsLoaded();
        }
        else if (event.data && event.data.type === 'app-version') {
            console.log('Версия приложения:', event.data.version);
        }
        else if (event.data && event.data.type === 'error') {
            console.error('Ошибка Service Worker:', event.data.message);
        }
        else if (event.data && event.data.type === 'notification-shown') {
            console.log(`Показано уведомление о ${event.data.count} долгах на сумму ${event.data.amount}`);
        }
    });
}

// Регистрация Service Worker для поддержки PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            updateLoadingStatus('Регистрация Service Worker...');
            
            const registration = await navigator.serviceWorker.register('/money3/service-worker.js', {
                updateViaCache: 'none' // Запрещаем использовать HTTP-кэш для service worker
            });
            console.log('ServiceWorker успешно зарегистрирован:', registration.scope);
            updateLoadingStatus('Service Worker зарегистрирован');
            
            // Проверка и обработка обновлений
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;
                
                console.log('Обнаружена новая версия ServiceWorker');
                updateLoadingStatus('Обнаружена новая версия приложения');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('Новый Service Worker установлен и готов к использованию');
                        updateLoadingStatus('Обновление готово к установке');
                        
                        // Показываем пользователю сообщение с возможностью обновления
                        if (confirm('Доступна новая версия приложения. Обновить сейчас?')) {
                            updateLoadingStatus('Применяю обновление...');
                            window.location.reload();
                        }
                    } else if (newWorker.state === 'installing') {
                        updateLoadingStatus('Установка обновления...');
                    } else if (newWorker.state === 'activated') {
                        updateLoadingStatus('Обновление активировано');
                    }
                });
            });
            
            // Запрашиваем разрешение на уведомления
            if ('Notification' in window) {
                let permission = Notification.permission;
                
                if (permission !== 'granted' && permission !== 'denied') {
                    permission = await Notification.requestPermission();
                }
                
                console.log('Разрешение на уведомления:', permission);
                
                // Если разрешение получено, отправляем тестовое уведомление при первом запуске
                if (permission === 'granted') {
                    // Небольшая задержка, чтобы не мешать загрузке приложения
                    setTimeout(() => {
                        try {
                            // Проверяем на десктопе - можем использовать обычное API уведомлений
                            if (!('serviceWorker' in navigator) || !registration.active) {
                                // Просто показываем уведомление о запуске приложения
                                new Notification('Money Debt готов к работе', {
                                    body: 'Приложение успешно загружено',
                                    icon: '/money3/icon-192x192.png'
                                });
                            } else {
                                // Тихая проверка долгов (без обязательного показа уведомления)
                                // force=false означает, что уведомление покажется только при новых долгах
                                registration.active.postMessage({ 
                                    type: 'check-debts',
                                    force: false 
                                });
                            }
                        } catch (e) {
                            console.error('Ошибка при отправке тестового уведомления:', e);
                        }
                    }, 3000);
                }
            }
            
            // Регистрируем периодическую синхронизацию
            if (registration.periodicSync) {
                try {
                    // Проверяем, есть ли разрешение на периодическую синхронизацию
                    const status = await navigator.permissions.query({
                        name: 'periodic-background-sync' as PermissionName
                    });
                    
                    if (status.state === 'granted') {
                        // Регистрируем периодическую синхронизацию для ежедневной проверки долгов
                        await registration.periodicSync.register('check-debts', {
                            minInterval: 20 * 60 * 60 * 1000 // один раз в день (мс)
                        });
                        console.log('Периодическая синхронизация успешно зарегистрирована');
                    } else {
                        console.log('Нет разрешения на периодическую синхронизацию');
                        // Запускаем тихую проверку долгов при загрузке
                        registration.active?.postMessage({ 
                            type: 'check-debts',
                            force: false
                        });
                    }
                } catch (error) {
                    console.error('Ошибка при регистрации периодической синхронизации:', error);
                    // Запускаем тихую проверку долгов при загрузке
                    registration.active?.postMessage({ 
                        type: 'check-debts',
                        force: false 
                    });
                }
            } else {
                console.log('Периодическая синхронизация не поддерживается');
                // Запускаем тихую проверку долгов при загрузке
                registration.active?.postMessage({ 
                    type: 'check-debts',
                    force: false
                });
                
                // Регистрируем обычную фоновую синхронизацию в качестве резервного варианта
                if (registration.sync) {
                    try {
                        await registration.sync.register('check-debts');
                        console.log('Фоновая синхронизация успешно зарегистрирована');
                    } catch (error) {
                        console.error('Ошибка при регистрации фоновой синхронизации:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при регистрации ServiceWorker:', error);
        }
    });
}
