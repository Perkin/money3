/**
 * Утилиты для проверки задолженностей
 */

/**
 * Функция для ручной проверки новых долгов через Service Worker
 * @param force Если true, то игнорировать кэш и принудительно проверить долги
 * @returns Promise<void>
 */
export const checkForDebts = async (force: boolean = false): Promise<void> => {
    // Проверяем поддержку уведомлений
    if (!('Notification' in window)) {
        console.error('Уведомления не поддерживаются');
        return;
    }
    
    // Проверяем разрешение на уведомления
    if (Notification.permission !== 'granted') {
        console.log('Нет разрешения на отправку уведомлений');
        return;
    }
    
    try {
        // Сначала проверяем, есть ли активный Service Worker
        if ('serviceWorker' in navigator) {
            try {
                // Получаем регистрацию Service Worker
                const registration = await navigator.serviceWorker.ready;
                
                // Проверяем, активен ли Service Worker
                if (registration.active) {
                    // Отправляем сообщение Service Worker для проверки долгов
                    registration.active.postMessage({ 
                        type: 'check-debts',
                        force: force // Передаем флаг force для сброса кэша
                    });
                    console.log('Запрос на проверку долгов отправлен через Service Worker');
                    return; // Выходим, так как уведомление будет обработано в Service Worker
                }
            } catch (error) {
                console.warn('Service Worker не активен, используем обычные уведомления:', error);
                // Продолжаем выполнение и используем обычные уведомления
            }
        }
        
        // Запасной вариант: используем обычные уведомления (для десктопа)
        // В реальном приложении здесь должна быть логика получения долгов из IndexedDB
        
        // Простое тестовое уведомление для проверки работы
        new Notification(force ? 'Принудительная проверка долгов' : 'Проверка долгов', {
            body: 'Уведомления о долгах работают',
            icon: '/money3/icon-192x192.png'
        });
        
        console.log('Запрос на проверку долгов выполнен через обычные уведомления');
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