import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);

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

// Регистрация Service Worker для поддержки PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/money3/service-worker.js');
            console.log('ServiceWorker успешно зарегистрирован:', registration.scope);
            
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
