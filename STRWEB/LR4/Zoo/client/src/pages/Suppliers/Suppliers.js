import React, { useEffect, useState } from 'react';
import styles from './Suppliers.module.css';
import {Link} from "react-router-dom";

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');

        const query = new URLSearchParams({
            page,
            search,
            city
        }).toString();

        const url = `http://localhost:5000/api/suppliers?${query}&_=${Date.now()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setSuppliers(data.data?.suppliers || []);
                setPagination(data.data?.pagination || null);
                setLoading(false);
            })
            .catch(err => {
                setError('Ошибка загрузки данных');
                setLoading(false);
            });
    }, [search, city, page]);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.suppliers}>
            <h2 className={styles.title}>Наши поставщики 🏭</h2>

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
                        <Link to={`/suppliers/${supplier._id}`}>
                            Подробнее →
                        </Link>
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
                    <span>
            Страница {pagination.page} из {pagination.pages}
          </span>
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