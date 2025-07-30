import styles from './index.module.css';
import { APP_VERSION, BUILD_DATE } from '@/version';

const SettingsForm = () => {
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