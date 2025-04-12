import { useRef, useState } from 'react';
import styles from './index.module.css';
import { toast } from 'react-toastify';
import { Payment, updatePayment } from '@/db/DbPayments.ts';
import { updateRemoteData } from '@/db/DbUtils.ts';

interface EditPaymentFormProps {
    payment: Payment;
    onClose: () => void;
}

const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const EditPaymentForm = ({ payment, onClose }: EditPaymentFormProps) => {
    const formRef = useRef<HTMLFormElement | null>(null);

    const [money, setMoney] = useState<number>(payment.money);
    const [paymentDate, setPaymentDate] = useState<Date>(payment.paymentDate);
    const [isPayed, setIsPayed] = useState<number>(payment.isPayed);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!money || money <= 0 || !paymentDate) {
            toast.error('Заполните все поля');
            return;
        }

        try {
            await updatePayment(payment.id!, {
                money,
                paymentDate,
                isPayed
            });
            await updateRemoteData();
            toast.success('Платёж обновлен');
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    return (
        <form className={styles.editPaymentForm} ref={formRef} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
                <label>Сумма:</label>
                <input 
                    type="number" 
                    value={money} 
                    onChange={(e) => setMoney(parseFloat(e.target.value))} 
                    required 
                />
            </div>
            <div className={styles.formRow}>
                <label>Дата платежа:</label>
                <input 
                    type="date" 
                    value={formatDateForInput(paymentDate)} 
                    onChange={(e) => {
                        const dateString = e.target.value;
                        
                        if (dateString) {
                            const [yearStr, monthStr, dayStr] = dateString.split('-');
                            const year = parseInt(yearStr, 10);
                            const month = parseInt(monthStr, 10) - 1;
                            const day = parseInt(dayStr, 10);
                            
                            const newDate = new Date();
                            
                            newDate.setFullYear(year, month, day);
                            
                            newDate.setHours(0, 0, 0, 0);
                            
                            setPaymentDate(newDate);
                        }
                    }} 
                    required 
                />
            </div>
            <div className={styles.formRow}>
                <label>Статус:</label>
                <select 
                    value={isPayed} 
                    onChange={(e) => setIsPayed(parseInt(e.target.value))}
                >
                    <option value={0}>Не оплачен</option>
                    <option value={1}>Оплачен</option>
                </select>
            </div>
            <div className={styles.buttonRow}>
                <button type="submit">Сохранить</button>
                <button type="button" onClick={onClose}>Отмена</button>
            </div>
        </form>
    );
};

export default EditPaymentForm; 