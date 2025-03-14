import { useState } from 'react';
import { useUser } from '../UserContext';
import { API_URL } from "@/config";
import { toast } from 'react-toastify';
import styles from './Popup.module.css';

const RegisterPopup = ({onClose}) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        const trimmedConfirmPassword = confirmPassword.trim();

        if (trimmedPassword !== trimmedConfirmPassword) {
            setErrors({password: ["Пароли не совпадают!"]});
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmedUsername, email: trimmedEmail, password: trimmedPassword }),
            });

            if (!response) {
                throw new Error("Ошибка при регистрации. Проверьте данные.");
            }

            const result = await response.json();
            if (result.status == 'success') {
                if (!result.token) {
                    throw new Error("Не удалось получить токен, что-то сломалось...");
                }

                toast.success("Регистрация успешна!");
                login(result.token);
                onClose();
            } else if (result.error) {
                switch (result.error) {
                    case 'user_exists':
                        throw new Error('Такой пользователь уже существует');
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
                <h2>Регистрация</h2>
                <form className={styles.popupForm} onSubmit={handleSubmit}>
                    <label htmlFor="register-email">Email:</label>
                    <input type="text" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {errors['email'] && <div className={styles.errorItem}>{errors['email'].join('<br>')}</div>}

                    <label htmlFor="register-username">Отображаемое имя:</label>
                    <input type="text" id="register-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    {errors['username'] && <div className={styles.errorItem}>{errors['username'].join('<br>')}</div>}

                    <label htmlFor="register-password">Пароль:</label>
                    <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {errors['password'] && <div className={styles.errorItem}>{errors['password'].join('<br>')}</div>}

                    <label htmlFor="register-confirm-password">Пароль:</label>
                    <input type="password" id="register-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                    <button type="submit" className={styles.popupButton} disabled={isLoading}>
                        Зарегистрироваться
                        {isLoading ?? (<span className={styles.spinner}></span>)}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPopup;
