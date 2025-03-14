import styles from './index.module.css';

const MenuButton = ({ onClick, children }) => {
    return (
        <button className={styles.menuButton} type="button" onClick={onClick}>{children}</button>
    );
};

export default MenuButton;
