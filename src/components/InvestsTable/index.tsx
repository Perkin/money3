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

    const [totalInvests, setTotalInvests] = useState<Record<number, number>>({});
    const [totalIncome, setTotalIncome] = useState<Record<number, number>>({});
    const [totalDebt, setTotalDebt] = useState<Record<number, number>>({});

    const addInvestMoney = useCallback((id: number, amount: number) => {
        setTotalInvests(prev => ({ ...prev, [id]: amount }));
    }, []);

    const removeInvestMoney = useCallback((id: number) => {
        setTotalInvests(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
        setTotalIncome(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
        setTotalDebt(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
    }, []);

    const addIncomeMoney = useCallback((id: number, amount: number) => {
        setTotalIncome(prev => ({ ...prev, [id]: amount }));
    }, []);

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
        return Object.values(totalInvests)
            .reduce((acc, amount) => acc + (Number(amount) || 0), 0);
    }, [totalInvests]);

    const totalIncomeMoney = useMemo(() => {
        return Object.values(totalIncome)
            .reduce((acc, amount) => acc + (Number(amount) || 0), 0);
    }, [totalIncome]);

    const totalDebtMoney = useMemo(() => {
        return Object.values(totalDebt)
            .reduce((acc, amount) => acc + (Number(amount) || 0), 0);
    }, [totalDebt]);

    const processedInvests = useMemo(() => {
        return invests.reduce((acc, invest, index) => {
          const currentInvestDate = invest.createdDate.getDate();
  
          // Добавляем разделитель перед первым элементом с датой >= сегодня
          if (index === 0 && currentInvestDate >= today) {
            acc.push(<CurrentDateItem key={0} />);
          }
  
          // Добавляем текущий элемент
          acc.push(
            <InvestItem
              key={invest.id}
              invest={invest}
              onCloseInvest={() => {removeInvestMoney(invest.id!); }}
              showPayed={showPayed}
              isEven={index % 2 == 0}
              addInvestMoney={addInvestMoney}
              addIncomeMoney={addIncomeMoney}
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
            acc.push(<CurrentDateItem key={-1} />);
          }
  
          return acc;
        }, [] as React.ReactNode[]);
      }, [invests, showPayed, removeInvestMoney, addInvestMoney, addIncomeMoney, addDebtMoney, removeDebtMoney]);

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
