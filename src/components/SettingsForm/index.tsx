import { useState } from 'react';
import styles from './index.module.css';
import { toast } from 'react-toastify';
import { requestNotificationPermission, checkForDebts } from '@/utils/debtCheckUtils';

const SettingsForm = () => {
    const [notificationStatus, setNotificationStatus] = useState<string>(
        Notification.permission || 'default'
    );

    const handleRequestNotifications = async () => {
        const granted = await requestNotificationPermission();
        
        if (granted) {
            setNotificationStatus('granted');
            toast.success('Разрешение на уведомления получено');
            
            // Проверяем наличие долгов сразу после получения разрешения
            await checkForDebts();
        } else {
            setNotificationStatus('denied');
            toast.warn('Разрешение на уведомления не получено');
        }
    };

    const handleTestNotification = async () => {
        await checkForDebts();
        toast.info('Запрос на проверку долгов отправлен');
    };

    return (
        <div className={styles.settingsForm}>
            <h2>Настройки</h2>
            <div className={styles.formGroup}>
                <label>Уведомления</label>
                <div className={styles.notificationStatus}>
                    Статус: {
                        notificationStatus === 'granted' ? 'Разрешены' :
                        notificationStatus === 'denied' ? 'Заблокированы' : 'Не запрошены'
                    }
                </div>
                <div className={styles.notificationButtons}>
                    <button 
                        onClick={handleRequestNotifications}
                        disabled={notificationStatus === 'denied'}
                        className={styles.settingsButton}
                    >
                        {notificationStatus === 'granted' ? 'Уведомления разрешены' : 'Разрешить уведомления'}
                    </button>
                    {notificationStatus === 'granted' && (
                        <button 
                            onClick={handleTestNotification}
                            className={styles.testButton}
                        >
                            Проверить долги
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsForm; 