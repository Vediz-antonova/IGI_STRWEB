import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import styles from './Profile.module.css';

function Profile() {
    const { user } = useContext(AuthContext);

    if (!user) return <p>Загрузка профиля...</p>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Профиль пользователя</h2>
            <p className={styles.field}><strong>Имя:</strong> {user.username}</p>
            <p className={styles.field}><strong>Email:</strong> {user.email}</p>
            <p className={styles.field}><strong>Роль:</strong> {user.role}</p>
            <p className={styles.field}><strong>Часовой пояс:</strong> {user.timezone}</p>
            <p className={styles.field}><strong>Последний вход:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
        </div>
    );
}

export default Profile;