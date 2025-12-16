import React from 'react';
import styles from './Home.module.css';

function Home() {
    return (
        <div className={styles.home}>
            <h2 className={styles.title}>Добро пожаловать в Zoo Shop 🐾</h2>
            <p className={styles.subtitle}>
                Управляйте продуктами, поставщиками, закупками и изменениями цен в удобном интерфейсе.
            </p>
        </div>
    );
}

export default Home;