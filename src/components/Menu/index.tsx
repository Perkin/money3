import { useState, useRef, useEffect } from 'react';
import styles from './index.module.css';
import MenuButton from '@/components/MenuButton';
import User from '@/components/User';
import { useUser } from '../UserContext';
import { toast } from 'react-toastify';
import LoginPopup from '@/components/Popup/LoginPopup.tsx';
import RegisterPopup from '@/components/Popup/RegisterPopup.tsx';
import ImportPopup from '@/components/Popup/ImportPopup.tsx';
import { exportData, syncUpdates } from '@/db/DbUtils.ts';

const Menu = () => {
    const { user, logout } = useUser();

    const [isMenuVisible, setMenuVisible] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const dropdownContentRef = useRef<HTMLDivElement | null>(null);

    // Закрываем меню при клике снаружи
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownContentRef.current && !dropdownContentRef.current.contains(event.target as Node) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)
            ) {
                setMenuVisible(false);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleMenuButtonClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setMenuVisible(prevState => !prevState);
    };

    const [isLoginPopupActive, setLoginPopupActive] = useState(false);
    const [isRegisterPopupActive, setRegisterPopupActive] = useState(false);
    const [isImportPopupActive, setImportPopupActive] = useState(false);

    const handleExport = async () => {
        await exportData();
    }

    const handleImport = () => {
        setMenuVisible(false);
        setImportPopupActive(true);
    }

    const handleSyncUpdates = async () => {
        await syncUpdates();
    }

    const handleLogin = () => {
        setMenuVisible(false);
        setLoginPopupActive(true);
    };

    const handleRegister = () => {
        setMenuVisible(false);
        setRegisterPopupActive(true);
    };

    const handleLogout = () => {
        logout();
        toast.success("Вы успешно вышли");
    };

    return (
        <div className={styles.menuContainer}>
            <User />
            <button className={styles.menuButton} ref={menuButtonRef} onClick={handleMenuButtonClick}>☰</button>
            {isMenuVisible && (
                <div className={styles.menuDropdownContent} ref={dropdownContentRef}>
                    <MenuButton onClick={handleExport}>Экспорт</MenuButton>
                    <MenuButton onClick={handleImport}>Импорт</MenuButton>
                    {user
                        ? (
                            <>
                                <MenuButton onClick={handleSyncUpdates}>Обновить данные</MenuButton>
                                <MenuButton onClick={handleLogout}>Выход</MenuButton>
                            </>
                        )
                        : (
                            <>
                                <MenuButton onClick={handleRegister}>Регистрация</MenuButton>
                                <MenuButton onClick={handleLogin}>Авторизация</MenuButton>
                            </>
                        )
                    }
                </div>
            )}
            {isLoginPopupActive && (<LoginPopup onClose={() => setLoginPopupActive(false)}/>)}
            {isRegisterPopupActive && (<RegisterPopup onClose={() => setRegisterPopupActive(false)}/>)}
            {isImportPopupActive && (<ImportPopup onClose={() => setImportPopupActive(false)}/>)}
        </div>
    );
};

export default Menu;
