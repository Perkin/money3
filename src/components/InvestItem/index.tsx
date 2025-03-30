import { useCallback, useEffect, useState } from 'react';
import styles from './index.module.css';
import { closeInvest } from '@/db/DbInvests.ts';
import { closePayment, getPayments, Payment, PaymentFilter } from '@/db/DbPayments.ts';
import { toast } from 'react-toastify';
import PaymentItem from '@/components/PaymentItem';
import { defaultIncomeRatio } from '@/db/DbUtils';
import { formatDate, formatMoney } from '@/utils/formatUtils.ts';

const InvestItem = ({ invest, onCloseInvest, showPayed, isEven, addInvestMoney, addIncomeMoney, addDebtMoney}) => {
    const today = new Date();

    const [payments, setPayments] = useState<Payment[]>([]);

    const fetchPayments = useCallback(async () => {
        const filter : PaymentFilter = {id: invest.id};
        const allPayments = await getPayments(filter);
        const filteredPayments = allPayments.filter(payment => showPayed || !payment.isPayed);

        filteredPayments.forEach((payment: Payment) => {
            if (!payment.isPayed && payment.paymentDate < today) {
                addDebtMoney(invest.id, payment.money);
            }
        })

        setPayments(filteredPayments);
    }, [showPayed, invest, addDebtMoney]);

    useEffect(() => {
        fetchPayments().catch((error) => {
            console.error("Ошибка в fetchPayments:", error);
        });
    }, [fetchPayments]);

    useEffect(() => {
        if (invest.isActive) {
            addInvestMoney(invest.id, invest.money);
            addIncomeMoney(invest.id, invest.money * (invest.incomeRatio || defaultIncomeRatio));
        }
    }, [invest, addInvestMoney, addIncomeMoney]);

    const handleCloseInvest = async (investId) => {
        if (!confirm('Точно закрыть?')) {
            return;
        }

        try {
            const closedInvestId = await closeInvest(investId);
            if (Number.isInteger(closedInvestId) && closedInvestId === investId) {
                toast.success('Инвестиция закрыта');

                // await updateRemoteData();

                onCloseInvest();
                window.dispatchEvent(new CustomEvent('fetchInvests'));
            } else {
                toast.error('Не удалось закрыть инвестицию');
            }
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }

        // Закрываем все открытые платежи
        const payments = await getPayments({id: investId});
        for (const payment of payments) {
            if (!payment.isPayed) {
                try {
                    const closedPaymentId = await closePayment(payment.id!);
                    if (Number.isInteger(closedPaymentId) && closedPaymentId === payment.id) {
                        toast.info('Долг автоматически оплачен');
                    } else {
                        toast.error('Не удалось закрыть активный долг');
                    }
                } catch (error) {
                    toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                }
            }
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
                            onClick={() => handleCloseInvest(invest.id)}
                        >
                            X
                        </button>
                    )}
                </div>
            </div>
            {payments.map((payment: Payment) => (
                <PaymentItem
                    key={payment.id}
                    payment={payment}
                    isEven={isEven}
                    isDebt={!payment.isPayed && payment.paymentDate < today}
                    onClosePayment={fetchPayments}
                />
            ))}
        </>
    );
};

export default InvestItem;
