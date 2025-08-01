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

// Обработка сообщений от Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('Получено сообщение от ServiceWorker:', event.data);
        
        // Другие типы сообщений обрабатываются здесь
        if (event.data && event.data.type === 'status') {
            updateLoadingStatus(event.data.message);
        }
        else if (event.data && event.data.type === 'activated') {
            console.log('Service Worker активирован, версия:', event.data.version);
            markAppAsLoaded();
        }
        else if (event.data && event.data.type === 'error') {
            console.error('Ошибка Service Worker:', event.data.message);
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
        } catch (error) {
            console.error('Ошибка при регистрации ServiceWorker:', error);
        }
    });
}
