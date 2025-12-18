import React, { useEffect, useState, useContext } from 'react';
import styles from './Suppliers.module.css';
import { Link } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [error, setError] = useState('');

    const { user, token } = useContext(AuthContext);

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить поставщика?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/suppliers/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setSuppliers(prev => prev.filter(s => s._id !== id));
            } else {
                alert(data.message || 'Ошибка удаления');
            }
        } catch {
            alert('Ошибка подключения к серверу');
        }
    };

    useEffect(() => {
        setLoading(true);
        setError('');

        const query = new URLSearchParams({ page, search, city }).toString();
        const url = `http://localhost:5000/api/suppliers?${query}&_=${Date.now()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setSuppliers(data.data?.suppliers || []);
                setPagination(data.data?.pagination || null);
                setLoading(false);
            })
            .catch(() => {
                setError('Ошибка загрузки данных');
                setLoading(false);
            });
    }, [search, city, page]);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.suppliers}>
            <h2 className={styles.title}>Наши поставщики 🏭</h2>

            {user?.role === 'admin' && (
                <div className={styles.actions}>
                    <Link to="/suppliers/create" className={styles.createBtn}>
                        + Добавить поставщика
                    </Link>
                </div>
            )}

            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Фильтр по городу..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                />
            </div>

            <p className={styles.count}>
                Найдено: {pagination?.total || suppliers.length} поставщиков
            </p>

            <div className={styles.grid}>
                {suppliers.map(supplier => (
                    <div key={supplier._id} className={styles.card}>
                        <h3>{supplier.name}</h3>
                        <p><strong>Город:</strong> {supplier.address.city}</p>
                        <p><strong>Email:</strong> {supplier.email}</p>
                        <p><strong>Телефон:</strong> {supplier.phone}</p>
                        <p><strong>Рейтинг:</strong> {supplier.rating}</p>
                        <Link to={`/suppliers/${supplier._id}`}>
                            Подробнее →
                        </Link>

                        {supplier.products && supplier.products.length > 0 && (
                            <div className={styles.products}>
                                <h4>Товары:</h4>
                                <ul>
                                    {supplier.products.map(prod => (
                                        <li key={prod._id}>
                                            {prod.sku} — {prod.price} ₽ (остаток: {prod.stockQuantity})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {user?.role === 'admin' && (
                            <div className={styles.cardActions}>
                                <Link to={`/suppliers/edit/${supplier._id}`} className={styles.editBtn}>
                                    Редактировать
                                </Link>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(supplier._id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        )}
                        <div className={styles.actions}>
                            <Link
                                to={`/supplier-dashboard/${supplier._id}`}
                                className={styles.dashboardBtn}
                            >
                                Дашборд
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {pagination && (
                <div className={styles.pagination}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(prev => prev - 1)}
                    >
                        ◀ Назад
                    </button>
                    <span>Страница {pagination.page} из {pagination.pages}</span>
                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(prev => prev + 1)}
                    >
                        Вперёд ▶
                    </button>
                </div>
            )}
        </div>
    );
}

export default Suppliers;