import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Notification.module.css';

function Notification({
                          message,
                          type = 'info',
                          duration = 3000,
                          onClose,
                          showProgress = true
                      }) {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        if (onClose) {
            setTimeout(() => onClose(), 300);
        }
    }, [onClose]);

    useEffect(() => {
        if (!isVisible || !showProgress) return;

        startTimeRef.current = Date.now();
        const totalDuration = duration;

        const updateProgress = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, totalDuration - elapsed);
            const newProgress = (remaining / totalDuration) * 100;

            setProgress(newProgress);

            if (remaining > 0) {
                timerRef.current = setTimeout(updateProgress, 50);
            } else {
                handleClose();
            }
        };

        timerRef.current = setTimeout(updateProgress, 50);

        const closeTimer = setTimeout(handleClose, totalDuration);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            clearTimeout(closeTimer);
        };
    }, [isVisible, showProgress, duration, handleClose]);

    const handleClick = (e) => {
        e.stopPropagation();
        handleClose();
    };

    if (!isVisible) return null;

    return (
        <div
            className={`${styles.notification} ${styles[type]}`}
            role="alert"
            aria-live="polite"
        >
            <div className={styles.content}>
                <div className={styles.icon}>
                    {type === 'success' && '✅'}
                    {type === 'error' && '❌'}
                    {type === 'warning' && '⚠️'}
                    {type === 'info' && 'ℹ️'}
                </div>
                <div className={styles.message}>{message}</div>
                <button
                    onClick={handleClick}
                    className={styles.closeBtn}
                    aria-label="Закрыть"
                >
                    ×
                </button>
            </div>

            {showProgress && (
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default Notification;