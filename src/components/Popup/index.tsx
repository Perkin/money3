import { ReactNode, useEffect } from 'react';
import styles from './index.module.css';

interface PopupProps {
    children: ReactNode;
    onClose: () => void;
}

const Popup = ({ children, onClose }: PopupProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.popup} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default Popup; 