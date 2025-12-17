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
            <p className={styles.field}><strong>Текущая дата (UTC):</strong> {user.nowUTC}</p>
            <p className={styles.field}><strong>Текущая дата ({user.timezone}):</strong> {user.nowUserTZ}</p>
            <p className={styles.field}>
                <strong>Создан:</strong> {user.createdAtUserTZ} ({user.createdAtUTC} UTC)
            </p>
            <p className={styles.field}>
                <strong>Последний вход:</strong> {user.lastLoginUserTZ} ({user.lastLoginUTC} UTC)
            </p>
        </div>
    );
}

export default Profile;