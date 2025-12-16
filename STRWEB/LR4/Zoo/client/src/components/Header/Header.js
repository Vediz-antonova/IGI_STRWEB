import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>Zoo Shop</div>
            <nav className={styles.nav}>
                <Link to="/">Главная</Link>
                <Link to="/products">Продукты</Link>
                <Link to="/suppliers">Поставщики</Link>
                <Link to="/purchases">Закупки</Link>
                <Link to="/price-changes">Цены</Link>
            </nav>
        </header>
    );
}

export default Header;