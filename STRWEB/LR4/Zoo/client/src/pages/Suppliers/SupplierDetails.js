import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './SupplierDetails.module.css';
import { AuthContext } from '../../context/AuthContext';

const formatUTC = (dateString) => {
    return new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(dateString));
};

function SupplierDetails() {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const url = `http://localhost:5000/api/suppliers/${id}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setSupplier(data.data?.supplier || null);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className={styles.loading}>Загрузка информации...</div>;
    if (!supplier) return <div className={styles.error}>Поставщик не найден</div>;

    return (
        <div className={styles.details}>
            <Link to="/suppliers" className={styles.back}>← Назад к списку поставщиков</Link>

            <div className={styles.card}>
                <div className={styles.info}>
                    <h2>{supplier.name}</h2>
                    <p><strong>Город:</strong> {supplier.address.city}</p>
                    <p><strong>Email:</strong> {supplier.email}</p>
                    <p><strong>Телефон:</strong> {supplier.phone}</p>
                    <p><strong>Рейтинг:</strong> {supplier.rating}</p>
                    <p><strong>Количество товаров:</strong> {supplier.productsCount}</p>

                    <p><strong>Добавлен (UTC):</strong> {formatUTC(supplier.createdAtUTC)}</p>
                    {user && (
                        <p><strong>Добавлен ({user.timezone}):</strong> {supplier.createdAtLocal}</p>
                    )}
                    <p><strong>Обновлен (UTC):</strong> {formatUTC(supplier.updatedAtUTC)}</p>
                    {user && (
                        <p><strong>Обновлен ({user.timezone}):</strong> {supplier.updatedAtLocal}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SupplierDetails;