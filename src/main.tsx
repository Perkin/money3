import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Регистрация Service Worker для поддержки PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/money3/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker успешно зарегистрирован:', registration.scope);
            })
            .catch(error => {
                console.error('Ошибка при регистрации ServiceWorker:', error);
            });
    });
}
