import React, { createContext, useState, useContext, useCallback } from 'react';
import Notification from '../components/Notification/Notification';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            message,
            type,
            duration: type === 'error' ? 4000 : duration
        };

        setNotifications(prev => [...prev, newNotification]);

        if (newNotification.duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(notif => notif.id !== id));
            }, newNotification.duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const showSuccess = useCallback((message, duration = 3000) => {
        return showNotification(message, 'success', duration);
    }, [showNotification]);

    const showError = useCallback((message, duration = 4000) => {
        return showNotification(message, 'error', duration);
    }, [showNotification]);

    const showWarning = useCallback((message, duration = 3500) => {
        return showNotification(message, 'warning', duration);
    }, [showNotification]);

    const showInfo = useCallback((message, duration = 3000) => {
        return showNotification(message, 'info', duration);
    }, [showNotification]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            showNotification,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            removeNotification,
            clearAllNotifications
        }}>
            {children}

            <div className="notifications-container">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        duration={notification.duration}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};