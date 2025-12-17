import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import styles from './AuthForm.module.css';

function AuthForm({ mode = 'login' }) {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url =
            mode === 'register'
                ? 'http://localhost:5000/api/auth/register'
                : 'http://localhost:5000/api/auth/login';

        const body =
            mode === 'register'
                ? { username, email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                : { email, password };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.message);
            } else {
                login(data.data.token, data.data.user);
                navigate('/');
            }
        } catch {
            setError('Ошибка подключения к серверу');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const token = credentialResponse.credential;

        try {
            const res = await fetch('http://localhost:5000/api/auth/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.message);
            } else {
                login(data.data.token, data.data.user);
                navigate('/');
            }
        } catch {
            setError('Ошибка входа через Google');
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{mode === 'register' ? 'Регистрация' : 'Вход'}</h2>
            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>
                {mode === 'register' && (
                    <input
                        type="text"
                        placeholder="Имя пользователя"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        className={styles.input}
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={styles.input}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>
                    {mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </form>

            <div className={styles.google}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Ошибка входа через Google')}
                />
            </div>
        </div>
    );
}

export default AuthForm;