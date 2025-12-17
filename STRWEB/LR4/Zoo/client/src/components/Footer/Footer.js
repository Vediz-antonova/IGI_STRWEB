import React, { useContext, useEffect, useState } from 'react';
import styles from './Footer.module.css';
import { AuthContext } from '../../context/AuthContext';

function Footer() {
    const { user } = useContext(AuthContext);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        if (!user?.timezone) return;

        const updateTime = () => {
            const now = new Date();
            const formatted = new Intl.DateTimeFormat('ru-RU', {
                timeZone: user.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now);
            setCurrentTime(formatted);
        };

        updateTime(); // сразу показать
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [user?.timezone]);

    return (
        <footer className={styles.footer}>
            <p>© Zoo Shop, 2025</p>
            {user && currentTime && (
                <p className={styles.time}>
                    Текущее время ({user.timezone}): {currentTime}
                </p>
            )}
        </footer>
    );
}

export default Footer;