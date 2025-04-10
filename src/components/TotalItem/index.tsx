import styles from './index.module.css';
import { formatMoney } from '@/utils/formatUtils.ts';

interface TotalItemProps {
    amount: number;
    title: string;
    isDebt?: boolean;
  }

const TotalItem = ({ amount, title, isDebt = false }: TotalItemProps) => {
    return (
        <div className={`${styles.dataItem} ${isDebt ? styles.debt : ''}`}>
            <div>{title}</div>
            <div></div>
            <div className={styles.itemMoney}>{formatMoney(amount)}</div>
            <div className={styles.itemActions}></div>
        </div>
    );
};

export default TotalItem;
