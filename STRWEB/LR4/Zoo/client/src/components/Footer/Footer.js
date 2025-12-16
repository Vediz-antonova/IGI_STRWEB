import React from 'react';
import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            © {new Date().getFullYear()} Zoo Shop — Все права защищены
        </footer>
    );
}

export default Footer;