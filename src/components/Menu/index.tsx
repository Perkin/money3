import { useState, useRef, useEffect } from 'react';
import styles from './index.module.css';
import MenuButton from '@/components/MenuButton';
import User from '@/components/User';
import { useUser } from '../UserContext';
import { toast } from 'react-toastify';
import ImportForm from '@/components/ImportForm';
import { exportData, syncUpdates } from '@/db/DbUtils.ts';
import Popup from '../Popup';
import LoginForm from '../LoginForm';
import RegisterForm from '../RegisterForm';
import SettingsForm from '../SettingsForm';

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

    const [isImportPopupActive, setImportPopupActive] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showSettingsForm, setShowSettingsForm] = useState(false);

    const handleExport = async () => {
        try {
            await exportData();
            toast.success('Данные успешно экспортированы');
        } catch (error) {
            toast.error(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    }

    const handleImport = () => {
        setMenuVisible(false);
        setImportPopupActive(true);
    }

    const handleSettings = () => {
        setMenuVisible(false);
        setShowSettingsForm(true);
    }

    const handleSyncUpdates = async () => {
        try {
            await syncUpdates();
            toast.success('Данные успешно синхронизированы');
        } catch (error) {
            toast.error(`Ошибка синхронизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    }

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
                    <MenuButton onClick={handleSettings}>Настройки</MenuButton>
                    {user
                        ? (
                            <>
                                <MenuButton onClick={handleSyncUpdates}>Обновить данные</MenuButton>
                                <MenuButton onClick={handleLogout}>Выход</MenuButton>
                            </>
                        )
                        : (
                            <>
                                <MenuButton onClick={() => setShowRegisterForm(true)}>Регистрация</MenuButton>
                                <MenuButton onClick={() => setShowLoginForm(true)}>Авторизация</MenuButton>
                            </>
                        )
                    }
                </div>
            )}
            {showLoginForm && (
                <Popup onClose={() => setShowLoginForm(false)}>
                    <LoginForm onSuccess={() => {
                        setShowLoginForm(false);
                        setMenuVisible(false);
                    }} />
                </Popup>
            )}
            {showRegisterForm && (
                <Popup onClose={() => setShowRegisterForm(false)}>
                    <RegisterForm onSuccess={() => {
                        setShowRegisterForm(false);
                        setMenuVisible(false);
                    }} />
                </Popup>
            )}
            {showSettingsForm && (
                <Popup onClose={() => setShowSettingsForm(false)}>
                    <SettingsForm />
                </Popup>
            )}
            {isImportPopupActive && (
                <Popup onClose={() => setImportPopupActive(false)}>
                    <ImportForm onSuccess={() => setImportPopupActive(false)} />
                </Popup>
            )}
        </div>
    );
};

export default Menu;
