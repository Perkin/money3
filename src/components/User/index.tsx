import styles from './index.module.css';
import { useUser } from '../UserContext';

const User = () => {
    const { user } = useUser();

    return (
        <div className={styles.userName}>{user ? user.username : ''}</div>
    );
};

export default User;
