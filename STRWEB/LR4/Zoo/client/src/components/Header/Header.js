import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

function Header() {
    const { user, logout } = useContext(AuthContext);
    const { totalItems } = useContext(CartContext);

    const handleLogout = () => {
        logout();
    };

    return (
        <header className={styles.header}>
            <div className={styles.logo}>Zoo Shop</div>
            <nav className={styles.nav}>
                <Link to="/">Главная</Link>
                <Link to="/products">Товары</Link>
                <Link to="/product-matcher">Подбор</Link>
                <Link to="/chat">Чат‑консультант</Link>
                {user && (
                    <Link to="/suppliers">Поставщики</Link>
                )}

                {user?.role === 'user' && (
                    <Link to="/cart" className={styles.cartLink}>
                        Корзина
                        {totalItems > 0 && (
                            <span className={styles.cartBadge}>{totalItems}</span>
                        )}
                    </Link>
                )}

                {user?.role === 'admin' && (
                    <>
                        <Link to="/orders">Заказы</Link>
                        <Link to="/price-changes">Изменения цен</Link>
                    </>
                )}

                {user ? (
                    <>
                        <Link to="/profile">
                            Привет, {user.username}
                        </Link>
                        <Link to="/" onClick={handleLogout}>
                            Выйти
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login">Вход</Link>
                        <Link to="/register">Регистрация</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;