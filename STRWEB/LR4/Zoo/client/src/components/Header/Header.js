import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import { AuthContext } from '../../context/AuthContext';

function Header() {
    const { user, logout } = useContext(AuthContext);

    return (
        <header className={styles.header}>
            <div className={styles.logo}>Zoo Shop</div>
            <nav className={styles.nav}>
                <Link to="/">Главная</Link>
                <Link to="/products">Товары</Link>
                <Link to="/suppliers">Поставщики</Link>

                {user ? (
                    <>
                        <Link to="/profile" className={styles.profileLink}>
                            Привет, {user.username}
                        </Link>
                        <Link
                            to="#"
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                            }}
                        >
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