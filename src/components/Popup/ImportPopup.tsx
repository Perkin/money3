import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './Popup.module.css';
import { importData } from '@/db/DbUtils.ts';

const ImportPopup = ({onClose, onUpdate}) => {
    const [json, setJson] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedJson = json.trim();

        try {
            const importJson = JSON.parse(trimmedJson);
            await importData(importJson, true);
            toast.success('Импорт завершен');
            onUpdate();
            onClose();
        } catch (err) {
            toast.error('Не удалось распарсить данные');
        }
    };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
                <span className={styles.popupClose} onClick={onClose}>&times;</span>
                <h2>Импорт</h2>
                <form className={styles.popupForm} onSubmit={handleSubmit}>
                    <label htmlFor="import-string">JSON:</label>
                    <textarea rows={10} id="import-string" value={json} onChange={(e) => setJson(e.target.value)} required />

                    <button type="submit" className={styles.popupButton}>
                        Импортировать
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ImportPopup;
