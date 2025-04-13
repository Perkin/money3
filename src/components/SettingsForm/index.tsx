import { useState } from 'react';
import styles from './index.module.css';
import { toast } from 'react-toastify';
import { requestNotificationPermission, checkForDebts } from '@/utils/debtCheckUtils';
import { APP_VERSION, BUILD_DATE } from '@/version';

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
            toast.error('Разрешение на уведомления не получено');
        }
    };

    const handleTestNotification = async () => {
        await checkForDebts(true);
        toast.info('Запрос на проверку долгов отправлен');
    };


    // Форматируем дату сборки
    const formattedBuildDate = new Date(BUILD_DATE).toLocaleString('ru-RU', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={styles.settingsForm}>
            <h2>Настройки</h2>
            
            <div className={styles.formGroup}>
                <label>Управление уведомлениями</label>
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
            
            <div className={styles.formGroup}>
                <label>О приложении</label>
                <div className={styles.appInfoBlock}>
                    <div className={styles.appInfoRow}>
                        <span className={styles.appInfoLabel}>Версия:</span>
                        <span className={styles.appInfoValue}>{APP_VERSION}</span>
                    </div>
                    <div className={styles.appInfoRow}>
                        <span className={styles.appInfoLabel}>Дата сборки:</span>
                        <span className={styles.appInfoValue}>{formattedBuildDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsForm; 