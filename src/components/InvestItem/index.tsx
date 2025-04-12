import { useState } from 'react';
import styles from './index.module.css';
import { closeInvest, Invest } from '@/db/DbInvests.ts';
import { closePayment, Payment } from '@/db/DbPayments.ts';
import { toast } from 'react-toastify';
import PaymentItem from '@/components/PaymentItem';
import { defaultIncomeRatio, updateRemoteData } from '@/db/DbUtils';
import { formatDate, formatMoney } from '@/utils/formatUtils.ts';
import EditInvestForm from '@/components/EditInvestForm';
import Popup from '@/components/Popup';

interface InvestItemProps {
    invest: Invest;
    showPayed: boolean;
    isEven: boolean;
    payments: Payment[];
    onRefreshData: () => void;
}

const InvestItem = ({ invest, showPayed, isEven, payments, onRefreshData }: InvestItemProps) => {
    const today = new Date();
    const [showEditForm, setShowEditForm] = useState(false);

    const handleCloseInvest = async (investId: number | undefined) => {
        if (!investId || !confirm('Точно закрыть?')) {
            return;
        }

        try {
            const closedInvestId = await closeInvest(investId);
            if (Number.isInteger(closedInvestId) && closedInvestId === investId) {
                // Закрываем все открытые платежи
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
                onRefreshData();
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
                        <>
                            <button
                                className={styles.investEditButton}
                                title="Редактировать инвестицию"
                                onClick={() => setShowEditForm(true)}
                            >
                                ✎
                            </button>
                            <button
                                className={styles.investCloseButton}
                                title="Закрыть инвестицию"
                                onClick={() => invest.id !== undefined && handleCloseInvest(invest.id)}
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            </div>
            {showEditForm && (
                <Popup onClose={() => setShowEditForm(false)}>
                    <EditInvestForm 
                        invest={invest} 
                        onClose={() => {
                            setShowEditForm(false);
                            onRefreshData();
                        }} 
                    />
                </Popup>
            )}
            {payments.map((payment: Payment) => 
                payment.id !== undefined ? (
                    <PaymentItem
                        key={payment.id}
                        payment={payment}
                        isEven={isEven}
                        isDebt={!payment.isPayed && payment.paymentDate < today}
                        onClosePayment={onRefreshData}
                    />
                ) : null
            )}
        </>
    );
};

export default InvestItem;
