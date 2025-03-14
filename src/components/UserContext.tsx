import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    token: string;
    username: string;
    email: string;
}

interface UserContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Функция логина — принимает JWT, сохраняет его в cookies и обновляет состояние
    const login = (token: string) => {
        localStorage.setItem('token', token);
        const decodedUser = jwtDecode<User>(token); // Декодируем JWT
        setUser(decodedUser);
    };

    // Функция выхода — удаляет токен из cookies и очищает состояние
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // При загрузке страницы читаем токен из cookies и восстанавливаем пользователя
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode<User>(token);
                setUser(decodedUser);
            } catch (error) {
                console.error('Ошибка при декодировании JWT', error);
                logout();
            }
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

// Хук для использования контекста в компонентах
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser должен использоваться внутри UserProvider');
    }
    return context;
};
