import { useRef, useState } from 'react';
import styles from './index.module.css';
import { toast } from 'react-toastify';
import { Invest, updateInvest } from '@/db/DbInvests.ts';
import { updateRemoteData } from '@/db/DbUtils.ts';

interface EditInvestFormProps {
    invest: Invest;
    onClose: () => void;
}

const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const EditInvestForm = ({ invest, onClose }: EditInvestFormProps) => {
    const formRef = useRef<HTMLFormElement | null>(null);

    const [money, setMoney] = useState<number>(invest.money);
    const [createdDate, setCreatedDate] = useState<Date>(invest.createdDate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!money || !createdDate) {
            toast.error('Заполните все поля');
            return;
        }

        try {
            await updateInvest(invest.id!, {
                money,
                createdDate
            });
            await updateRemoteData();
            toast.success('Инвестиция обновлена');
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    return (
        <form className={styles.editInvestForm} ref={formRef} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
                <label htmlFor="money-input">Сумма:</label>
                <input 
                    id="money-input"
                    type="number" 
                    value={money} 
                    onChange={(e) => setMoney(parseFloat(e.target.value))} 
                    required 
                />
            </div>
            <div className={styles.formRow}>
                <label htmlFor="date-input">Дата создания:</label>
                <input 
                    id="date-input"
                    type="date" 
                    value={formatDateForInput(createdDate)} 
                    onChange={(e) => setCreatedDate(new Date(e.target.value))} 
                    required 
                />
            </div>
            <div className={styles.buttonRow}>
                <button type="submit">Сохранить</button>
                <button type="button" onClick={onClose}>Отмена</button>
            </div>
        </form>
    );
};

export default EditInvestForm; 