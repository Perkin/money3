import { useRef, useState } from 'react';
import styles from './index.module.css';
import { toast } from 'react-toastify';
import { addInvest } from '@/db/DbInvests.ts';
import { calculatePayments } from '@/db/DbUtils.ts';

const InvestForm = () => {
    const formRef = useRef<HTMLFormElement | null>(null);

    const [money, setMoney] = useState<number>(0);
    const [incomeRatio, setIncomeRatio] = useState<number>(0.025);
    const [createdDate, setCreatedDate] = useState<Date>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!money || !incomeRatio || !createdDate) {
            toast.error('Заполните все поля');
            return;
        }

        createdDate.setHours(0, 0, 0);

        try {
            const investId = await addInvest(money, incomeRatio, createdDate);
            if (Number.isInteger(investId)) {
                // Рассчитываем новые платежи
                await calculatePayments();
                // await updateRemoteData();
                formRef.current?.reset();
                toast.success('Инвестиция добавлена');

                window.dispatchEvent(new CustomEvent('fetchInvests'));
            } else {
                toast.error('Не удалось добавить инвестицию');
            }
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    return (
        <form className={styles.addInvestForm} ref={formRef} onSubmit={handleSubmit}>
            <div className={styles.moneyRow}>
                <input type="text" placeholder="Сколько инвестируем" onChange={(e) => setMoney(parseFloat(e.target.value))} required />
                <select onChange={(e) => setIncomeRatio(parseFloat(e.target.value))} required>
                    <option value="0.025">2.5%</option>
                    <option value="0.05">5%</option>
                </select>
            </div>
            <div className={styles.dateRow}>
                <input type="date" placeholder="Дата инвестиции" onChange={(e) => setCreatedDate(new Date(e.target.value))} onClick={(e) => e.currentTarget.showPicker()} required />
            </div>
            <div className={styles.buttonRow}>
                <button type="submit">Добавить</button>
            </div>
        </form>
    );
};

export default InvestForm;
