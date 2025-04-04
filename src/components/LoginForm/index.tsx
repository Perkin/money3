import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './index.module.css';
import { useUser } from '@/components/UserContext';
import { API_URL } from '@/config';

interface LoginFormProps {
    onSuccess: () => void;
}

interface ValidationErrors {
    [key: string]: string[];
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!email || !password) {
            toast.error('Заполните все поля');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.error === 'invalid_credentials') {
                    toast.error('Неверный email или пароль');
                    return;
                }
                if (data.error === 'validation_errors') {
                    setErrors(data.errors);
                    return;
                }
                throw new Error(data.message || 'Ошибка при входе');
            }

            const { token } = await response.json();
            login(token);
            toast.success('Вход выполнен успешно');
            onSuccess();
        } catch (error) {
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const getFieldError = (fieldName: string) => {
        return errors[fieldName]?.length > 0 ? errors[fieldName][0] : '';
    };

    return (
        <form className={styles.loginForm} onSubmit={handleSubmit}>
            <h2>Вход</h2>
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
            <div className={styles.formActions}>
                <button type="submit">Войти</button>
            </div>
        </form>
    );
};

export default LoginForm; 