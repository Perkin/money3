import { useState } from 'react';
import { useUser } from '../UserContext';
import { API_URL } from "@/config";
import { toast } from 'react-toastify';
import styles from './Popup.module.css';

const LoginPopup = ({onClose}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        try {
            setIsLoading(true);

            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
            });

            if (!response) {
                throw new Error("Ошибка авторизации. Проверьте данные.");
            }

            const result = await response.json();
            if (result.status == 'success') {
                if (!result.token) {
                    throw new Error("Не удалось получить токен, что-то сломалось...");
                }

                toast.success("Авторизация успешна!");
                login(result.token);
                onClose();
            } else if (result.error) {
                switch (result.error) {
                    case 'invalid_credentials':
                        throw new Error('Логин или пароль неверны');
                    case 'validation_errors':
                        setErrors(result.errors);
                }
            } else {
                throw new Error("Неизвестная ошибка: " + JSON.stringify(result));
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
                <span className={styles.popupClose} onClick={onClose}>&times;</span>
                <h2>Авторизация</h2>
                <form className={styles.popupForm} onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email:</label>
                    <input type="text" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {errors['email'] && <div className={styles.errorItem}>{errors['email'].join('<br>')}</div>}

                    <label htmlFor="login-password">Пароль:</label>
                    <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {errors['password'] && <div className={styles.errorItem}>{errors['password'].join('<br>')}</div>}

                    <button type="submit" className={styles.popupButton} disabled={isLoading}>
                        Авторизоваться
                        {isLoading ?? (<span className={styles.spinner}></span>)}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPopup;
