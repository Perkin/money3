import styles from './index.module.css';

interface MenuButtonProps {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
}

const MenuButton = ({ onClick, children }: MenuButtonProps) => {
    return (
        <button className={styles.menuButton} type="button" onClick={onClick}>{children}</button>
    );
};

export default MenuButton;
