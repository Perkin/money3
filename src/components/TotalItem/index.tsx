import styles from './index.module.css';
import { formatMoney } from '@/utils/formatUtils.ts';

const TotalItem = ({ amount, title, isDebt }) => {
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
