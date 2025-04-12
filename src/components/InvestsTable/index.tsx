import styles from './index.module.css';
import InvestItem from '@/components/InvestItem';
import CurrentDateItem from '@/components/CurrentDateItem';
import { useCallback, useMemo, useState } from 'react';
import TotalItem from '@/components/TotalItem';
import { Invest } from '@/db/DbInvests';

interface InvestsTableProps {
    invests: Invest[];
    showPayed: boolean;
}

const InvestsTable = ({ invests, showPayed }: InvestsTableProps) => {
    const today = (new Date()).getDate();

    const [totalDebt, setTotalDebt] = useState<Record<number, number>>({});

    const addDebtMoney = useCallback((id: number, amount: number) => {
        setTotalDebt(prev => ({ ...prev, [id]: amount }));
    }, []);

    const removeDebtMoney = useCallback((id: number) => {
        setTotalDebt(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
    }, []);

    const totalInvestedMoney = useMemo(() => {
        return invests.reduce((acc, invest) => acc + (invest.isActive ? invest.money : 0), 0);
    }, [invests]);

    const totalIncomeMoney = useMemo(() => {
        return invests.reduce((acc, invest) => acc + (invest.isActive ? invest.money * (invest.incomeRatio || 0.05) : 0), 0);
    }, [invests]);

    const totalDebtMoney = useMemo(() => {
        return Object.values(totalDebt)
            .reduce((acc, amount) => acc + (Number(amount) || 0), 0);
    }, [totalDebt]);

    const processedInvests = useMemo(() => {
        return invests.map((invest, index) => {
            const currentInvestDate = invest.createdDate.getDate();
            let result = [];

            // Добавляем разделитель перед первым элементом с датой >= сегодня
            if (index === 0 && currentInvestDate >= today) {
                result.push(<CurrentDateItem key="current-date-first" />);
            }

            // Добавляем текущий элемент
            result.push(
                <InvestItem
                    key={invest.id}
                    invest={invest}
                    showPayed={showPayed}
                    isEven={index % 2 == 0}
                    addDebtMoney={addDebtMoney}
                    removeDebtMoney={removeDebtMoney}
                />
            );

            // Добавляем разделитель между элементами
            if (
                index < invests.length - 1 &&
                currentInvestDate < today &&
                invests[index + 1].createdDate.getDate() >= today
            ) {
                result.push(<CurrentDateItem key="current-date-middle" />);
            }

            return result;
        });
    }, [invests, showPayed, addDebtMoney, removeDebtMoney]);

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
