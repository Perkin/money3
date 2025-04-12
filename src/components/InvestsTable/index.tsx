import styles from './index.module.css';
import InvestItem from '@/components/InvestItem';
import CurrentDateItem from '@/components/CurrentDateItem';
import { useMemo, useState, useEffect } from 'react';
import TotalItem from '@/components/TotalItem';
import { Invest } from '@/db/DbInvests';
import { getPayments, Payment } from '@/db/DbPayments';

interface InvestsTableProps {
    invests: Invest[];
    showPayed: boolean;
}

const InvestsTable = ({ invests, showPayed }: InvestsTableProps) => {
    const today = new Date();
    const todayDate = today.getDate();
    
    const [paymentsData, setPaymentsData] = useState<{[key: number]: Payment[]}>({});
    
    // Загружаем платежи для всех инвестиций
    useEffect(() => {
        const fetchAllPayments = async () => {
            const paymentsByInvestId: {[key: number]: Payment[]} = {};
            
            for (const invest of invests) {
                if (invest.id !== undefined) {
                    const allPayments = await getPayments({ id: invest.id });
                    const filteredPayments = allPayments.filter(payment => showPayed || !payment.isPayed);
                    paymentsByInvestId[invest.id] = filteredPayments;
                }
            }
            
            setPaymentsData(paymentsByInvestId);
        };
        
        fetchAllPayments().catch(error => {
            console.error("Ошибка при загрузке платежей:", error);
        });
    }, [invests, showPayed]);

    const totalInvestedMoney = useMemo(() => {
        return invests.reduce((acc, invest) => acc + (invest.isActive ? invest.money : 0), 0);
    }, [invests]);

    const totalIncomeMoney = useMemo(() => {
        return invests.reduce((acc, invest) => acc + (invest.isActive ? invest.money * (invest.incomeRatio || 0.05) : 0), 0);
    }, [invests]);

    const totalDebtMoney = useMemo(() => {
        let total = 0;
        
        Object.entries(paymentsData).forEach(([investId, payments]) => {
            payments.forEach(payment => {
                if (!payment.isPayed && payment.paymentDate < today) {
                    total += payment.money;
                }
            });
        });
        
        return total;
    }, [paymentsData, today]);

    // Формирование списка инвестиций и разделителей
    const processedInvests = useMemo(() => {
        return invests.map((invest, index) => {
            const currentInvestDate = invest.createdDate.getDate();
            let result = [];

            // Добавляем разделитель перед первым элементом с датой >= сегодня
            if (index === 0 && currentInvestDate >= todayDate) {
                result.push(<CurrentDateItem key="current-date-first" />);
            }

            // Добавляем текущий элемент с платежами
            if (invest.id !== undefined) {
                const investPayments = paymentsData[invest.id] || [];
                
                result.push(
                    <InvestItem
                        key={invest.id}
                        invest={invest}
                        showPayed={showPayed}
                        isEven={index % 2 === 0}
                        payments={investPayments}
                        onRefreshData={() => window.dispatchEvent(new CustomEvent('fetchInvests'))}
                    />
                );
            }

            // Добавляем разделитель между элементами
            if (
                index < invests.length - 1 &&
                currentInvestDate < todayDate &&
                invests[index + 1].createdDate.getDate() >= todayDate
            ) {
                result.push(<CurrentDateItem key="current-date-middle" />);
            }

            return result;
        }).flat();
    }, [invests, paymentsData, showPayed, todayDate]);

    return (
        <div className={styles.dataList}>
            <div>
                <div className={styles.dataItem}>
                    <div>Создано</div>
                    <div>Закрыто/Оплата</div>
                    <div>Сумма</div>
                    <div>Действия</div>
                </div>
            </div>
            <div>
                {processedInvests}
                <TotalItem title="Итого" amount={totalInvestedMoney} />
                <TotalItem title="Прибыль" amount={totalIncomeMoney} />
                {totalDebtMoney > 0 && <TotalItem title="Долг" amount={totalDebtMoney} isDebt={true} />}
            </div>
        </div>
    );
};

export default InvestsTable;
