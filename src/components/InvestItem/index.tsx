import { useCallback, useEffect, useState } from 'react';
import styles from './index.module.css';
import { closeInvest, Invest } from '@/db/DbInvests.ts';
import { closePayment, getPayments, Payment, PaymentFilter } from '@/db/DbPayments.ts';
import { toast } from 'react-toastify';
import PaymentItem from '@/components/PaymentItem';
import { defaultIncomeRatio, updateRemoteData } from '@/db/DbUtils';
import { formatDate, formatMoney } from '@/utils/formatUtils.ts';

interface InvestItemProps {
    invest: Invest;
    onCloseInvest: () => void;
    showPayed: boolean;
    isEven: boolean;
    addInvestMoney: (id: number, amount: number) => void;
    addIncomeMoney: (id: number, amount: number) => void;
    addDebtMoney: (id: number, amount: number) => void;
}

const InvestItem = ({ invest, onCloseInvest, showPayed, isEven, addInvestMoney, addIncomeMoney, addDebtMoney}: InvestItemProps) => {
    const today = new Date();

    const [payments, setPayments] = useState<Payment[]>([]);

    const fetchPayments = useCallback(async () => {
        const filter : PaymentFilter = {id: invest.id};
        const allPayments = await getPayments(filter);
        const filteredPayments = allPayments.filter(payment => showPayed || !payment.isPayed);

        filteredPayments.forEach((payment: Payment) => {
            if (!payment.isPayed && payment.paymentDate < today && invest.id !== undefined) {
                addDebtMoney(invest.id, payment.money);
            }
        })

        setPayments(filteredPayments);
    }, [showPayed, invest, addDebtMoney]);

    useEffect(() => {
        fetchPayments().catch((error: Error) => {
            console.error("Ошибка в fetchPayments:", error);
        });
    }, [fetchPayments]);

    useEffect(() => {
        if (invest.isActive && invest.id !== undefined) {
            addInvestMoney(invest.id, invest.money);
            addIncomeMoney(invest.id, invest.money * (invest.incomeRatio || defaultIncomeRatio));
        }
    }, [invest, addInvestMoney, addIncomeMoney]);

    const handleCloseInvest = async (investId: number | undefined) => {
        if (!investId || !confirm('Точно закрыть?')) {
            return;
        }

        try {
            const closedInvestId = await closeInvest(investId);
            if (Number.isInteger(closedInvestId) && closedInvestId === investId) {
                // Закрываем все открытые платежи
                const payments = await getPayments({id: investId});
                for (const payment of payments) {
                    if (!payment.isPayed && payment.id !== undefined) {
                        try {
                            const closedPaymentId = await closePayment(payment.id);
                            if (Number.isInteger(closedPaymentId) && closedPaymentId === payment.id) {
                                toast.info('Долг автоматически оплачен');
                            } else {
                                toast.error('Не удалось закрыть активный долг');
                            }
                        } catch (error: unknown) {
                            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                        }
                    }
                }

                toast.success('Инвестиция закрыта');
                onCloseInvest();
                window.dispatchEvent(new CustomEvent('fetchInvests'));
                await updateRemoteData();
            } else {
                toast.error('Не удалось закрыть инвестицию');
            }
        } catch (error: unknown) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    }

    return (
        <>
            <div className={`${styles.dataItem} ${isEven ? styles.even : ''} ${invest.closedDate ? styles.closed : ''}`}>
                <div>{formatDate(invest.createdDate)}</div>
                <div>{formatDate(invest.closedDate)}</div>
                <div className={styles.itemMoney}>{formatMoney(invest.money)} ({(100 * (invest.incomeRatio || defaultIncomeRatio))}%)</div>
                <div className={styles.itemActions}>
                    {invest.isActive == 1 && (
                        <button
                            className={styles.investCloseButton}
                            title="Закрыть инвестицию"
                            onClick={() => invest.id !== undefined && handleCloseInvest(invest.id)}
                        >
                            X
                        </button>
                    )}
                </div>
            </div>
            {payments.map((payment: Payment) => 
                payment.id !== undefined ? (
                    <PaymentItem
                        key={payment.id}
                        payment={payment}
                        isEven={isEven}
                        isDebt={!payment.isPayed && payment.paymentDate < today}
                        onClosePayment={fetchPayments}
                    />
                ) : null
            )}
        </>
    );
};

export default InvestItem;
