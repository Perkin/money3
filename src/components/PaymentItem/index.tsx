import { useState } from 'react';
import styles from './index.module.css';
import { closePayment, Payment } from '@/db/DbPayments.ts';
import { toast } from 'react-toastify';
import { calculatePayments, updateRemoteData } from '@/db/DbUtils.ts';
import { formatDate, formatMoney } from '@/utils/formatUtils.ts';
import EditPaymentForm from '@/components/EditPaymentForm';
import Popup from '@/components/Popup';

interface PaymentItemProps {
    payment: Payment;
    isEven: boolean;
    isDebt: boolean;
    onClosePayment: () => void;
}

const PaymentItem = ({ payment, isEven, isDebt, onClosePayment }: PaymentItemProps) => {
    const [showEditForm, setShowEditForm] = useState(false);

    const handleClosePayment = async (paymentId: number) => {
        try {
            const closedPaymentId = await closePayment(paymentId);
            if (Number.isInteger(closedPaymentId) && closedPaymentId === paymentId) {
                toast.success('Долг оплачен');

                // Рассчитываем новые платежи
                await calculatePayments();
                onClosePayment();

                await updateRemoteData();
            } else {
                toast.error('Не удалось оплатить платеж');
            }
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    }

    return (
        <>
            <div className={`${styles.dataItem} ${isEven ? styles.even : ''} ${isDebt ? styles.debt : ''} ${payment.isPayed == 1 ? styles.payed : ''}`}>
                <div></div>
                <div>{formatDate(payment.paymentDate)}</div>
                <div className={styles.itemMoney}>{formatMoney(payment.money)}</div>
                <div className={styles.itemActions}>
                    {payment.isPayed == 0 && (
                        <>
                            <button
                                className={styles.paymentEditButton}
                                title="Редактировать платёж"
                                onClick={() => setShowEditForm(true)}
                            >
                                ✎
                            </button>
                            <button
                                className={styles.paymentCloseButton}
                                title="Оплата произведена"
                                onClick={() => handleClosePayment(payment.id!)}
                            >
                                ✓
                            </button>
                        </>
                    )}
                </div>
            </div>
            {showEditForm && (
                <Popup onClose={() => setShowEditForm(false)}>
                    <EditPaymentForm 
                        payment={payment} 
                        onClose={() => {
                            setShowEditForm(false);
                            onClosePayment();
                        }} 
                    />
                </Popup>
            )}
        </>
    );
};

export default PaymentItem;
