/**
 * Утилиты для проверки задолженностей
 */

/**
 * Функция для ручной проверки новых долгов через Service Worker
 * @returns Promise<void>
 */
export const checkForDebts = async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) {
        console.error('Service Worker не поддерживается');
        return;
    }

    try {
        // Получаем регистрацию Service Worker
        const registration = await navigator.serviceWorker.ready;
        
        // Отправляем сообщение Service Worker для проверки долгов
        registration.active?.postMessage({ type: 'check-debts' });
        
        console.log('Запрос на проверку долгов отправлен');
    } catch (error) {
        console.error('Ошибка при проверке долгов:', error);
    }
};

/**
 * Функция для запроса разрешения на отправку уведомлений
 * @returns Promise<boolean> - возвращает true, если разрешение получено
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.error('Уведомления не поддерживаются');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Ошибка при запросе разрешения на уведомления:', error);
        return false;
    }
}; 