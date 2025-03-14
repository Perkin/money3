import styles from './index.module.css';

const Filters = ({ activeFilter, setActiveFilter, showPayed, setShowPayed }) => {
    return (
        <div className={styles.dataFilter}>
            <div className={styles.filterItem}>
                <label>
                    <input type="checkbox" checked={activeFilter} onChange={() => setActiveFilter(!activeFilter)} />
                    С закрытыми
                </label>
            </div>
            <div className={styles.filterItem}>
                <label>
                    <input type="checkbox" checked={showPayed} onChange={() => setShowPayed(!showPayed)} />
                    С оплаченными
                </label>
            </div>
        </div>
    );
};

export default Filters;
