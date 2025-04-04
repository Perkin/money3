import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './index.module.css';
import { importData } from '@/db/DbUtils';

interface ImportFormProps {
    onSuccess: () => void;
}

const ImportForm = ({ onSuccess }: ImportFormProps) => {
    const [json, setJson] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const trimmedJson = json.trim();

        try {
            const importJson = JSON.parse(trimmedJson);
            await importData(importJson, true);
            toast.success('Импорт завершен');
            onSuccess();

            window.dispatchEvent(new CustomEvent('fetchInvests'));
        } catch (err) {
            toast.error('Не удалось распарсить данные');
        }
    };

    return (
        <form className={styles.importForm} onSubmit={handleSubmit}>
            <h2>Импорт</h2>
            <div className={styles.formGroup}>
                <label htmlFor="import-string">JSON:</label>
                <textarea 
                    rows={10} 
                    id="import-string" 
                    value={json} 
                    onChange={(e) => setJson(e.target.value)} 
                    required 
                />
            </div>
            <div className={styles.formActions}>
                <button type="submit">Импортировать</button>
            </div>
        </form>
    );
};

export default ImportForm; 