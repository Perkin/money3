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
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Получено сообщение от ServiceWorker:', event.data);
        
        if (event.data && event.data.type === 'status') {
            updateLoadingStatus(event.data.message);
        } else if (event.data && event.data.type === 'activated') {
            // Когда Service Worker активирован, показываем приложение
            setTimeout(markAppAsLoaded, 500);
        } else if (event.data && event.data.type === 'error') {
            console.error('Ошибка Service Worker:', event.data.message);
            // Можно добавить всплывающее уведомление для пользователя
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
                        
                        // Автоматически перезагружаем страницу после небольшой задержки,
                        // чтобы применить новую версию
                        setTimeout(() => {
                            updateLoadingStatus('Применяю обновление...');
                            window.location.reload();
                        }, 1000);
                    } else if (newWorker.state === 'installing') {
                        updateLoadingStatus('Установка обновления...');
                    } else if (newWorker.state === 'activated') {
                        updateLoadingStatus('Обновление активировано');
                    }
                });
            });
            
            // Запрашиваем разрешение на уведомления
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                console.log('Разрешение на уведомления:', permission);
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
                        // Запускаем разовую проверку долгов при загрузке
                        registration.active?.postMessage({ type: 'check-debts' });
                    }
                } catch (error) {
                    console.error('Ошибка при регистрации периодической синхронизации:', error);
                    // Запускаем разовую проверку долгов при загрузке
                    registration.active?.postMessage({ type: 'check-debts' });
                }
            } else {
                console.log('Периодическая синхронизация не поддерживается');
                // Запускаем разовую проверку долгов при загрузке
                registration.active?.postMessage({ type: 'check-debts' });
                
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
