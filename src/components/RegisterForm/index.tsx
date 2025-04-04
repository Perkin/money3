import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './index.module.css';
import { useUser } from '@/components/UserContext';
import { API_URL } from '@/config';

interface RegisterFormProps {
    onSuccess: () => void;
}

interface ValidationErrors {
    [key: string]: string[];
}

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!email || !username || !password || !confirmPassword) {
            toast.error('Заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            setErrors({ confirmPassword: ['Пароли не совпадают'] });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.error === 'user_exists') {
                    toast.error('Такой пользователь уже существует');
                    return;
                }
                if (data.error === 'validation_errors') {
                    setErrors(data.errors);
                    return;
                }
                throw new Error(data.message || 'Ошибка при регистрации');
            }

            const { token } = await response.json();
            login(token);
            toast.success('Регистрация выполнена успешно');
            onSuccess();
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const getFieldError = (fieldName: string) => {
        return errors[fieldName]?.length > 0 ? errors[fieldName][0] : '';
    };

    return (
        <form className={styles.registerForm} onSubmit={handleSubmit}>
            <h2>Регистрация</h2>
            <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? styles.errorInput : ''}
                    required
                />
                {getFieldError('email') && (
                    <div className={styles.errorText}>{getFieldError('email')}</div>
                )}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="username">Имя пользователя:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={errors.username ? styles.errorInput : ''}
                    required
                />
                {getFieldError('username') && (
                    <div className={styles.errorText}>{getFieldError('username')}</div>
                )}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="password">Пароль:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? styles.errorInput : ''}
                    required
                />
                {getFieldError('password') && (
                    <div className={styles.errorText}>{getFieldError('password')}</div>
                )}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Подтвердите пароль:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? styles.errorInput : ''}
                    required
                />
                {getFieldError('confirmPassword') && (
                    <div className={styles.errorText}>{getFieldError('confirmPassword')}</div>
                )}
            </div>
            <div className={styles.formActions}>
                <button type="submit">Зарегистрироваться</button>
            </div>
        </form>
    );
};

export default RegisterForm; 