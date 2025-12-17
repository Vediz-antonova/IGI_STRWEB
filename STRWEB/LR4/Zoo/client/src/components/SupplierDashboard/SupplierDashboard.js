import React, { useState, useEffect, useCallback } from 'react';
import styles from './SupplierDashboard.module.css';

const SupplierDashboard = ({ supplierId }) => {
    const [supplierData, setSupplierData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [deliveryTracking, setDeliveryTracking] = useState([]);

    const onSupplierRate = useCallback(async (newRating) => {
        try {
            const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rating: newRating })
            });

            const data = await response.json();
            if (data.success) {
                setRating(newRating);
                alert('Рейтинг обновлен!');
            }
        } catch (error) {
            console.error('Ошибка обновления рейтинга:', error);
        }
    }, [supplierId]);

    const onDeliveryTrack = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/purchases/upcoming`);
            const data = await response.json();

            if (data.success) {
                const supplierDeliveries = data.data.upcomingDeliveries.filter(
                    delivery => delivery.supplier?._id === supplierId
                );
                setDeliveryTracking(supplierDeliveries);
            }
        } catch (error) {
            console.error('Ошибка отслеживания доставок:', error);
        }
    }, [supplierId]);

    const onPetProfile = (petType) => {
        // Логика для профиля питомца
        alert(`Профиль питомца: ${petType}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const supplierResponse = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`);
                const supplierData = await supplierResponse.json();

                if (supplierData.success) {
                    setSupplierData(supplierData.data.supplier);
                    setRating(supplierData.data.supplier.rating);
                }

                const statsResponse = await fetch(`http://localhost:5000/api/suppliers/${supplierId}/stats`);
                const statsData = await statsResponse.json();

                if (statsData.success) {
                    setStats(statsData.data.stats);
                }

                onDeliveryTrack();

            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };

        if (supplierId) {
            fetchData();
        }
    }, [supplierId, onDeliveryTrack]);

    const handleRateClick = (value) => {
        onSupplierRate(value);
    };

    const handleTrackClick = () => {
        onDeliveryTrack();
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка дашборда...</div>;
    }

    if (!supplierData) {
        return <div className={styles.error}>Данные поставщика не найдены</div>;
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h2>Дашборд поставщика: {supplierData.name}</h2>
                <div className={styles.ratingSection}>
                    <span>Рейтинг: </span>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => handleRateClick(star)}
                                className={`${styles.star} ${star <= rating ? styles.filled : ''}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <span className={styles.ratingValue}>({rating}/5)</span>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Всего заказов</h3>
                    <p className={styles.statNumber}>{stats?.totalPurchases || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Общая стоимость</h3>
                    <p className={styles.statNumber}>{stats?.totalCost?.toFixed(2) || '0.00'} ₽</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Товаров в наличии</h3>
                    <p className={styles.statNumber}>{supplierData.products?.length || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Средний заказ</h3>
                    <p className={styles.statNumber}>
                        {stats?.totalCost && stats?.totalPurchases
                            ? (stats.totalCost / stats.totalPurchases).toFixed(2)
                            : '0.00'} ₽
                    </p>
                </div>
            </div>

            <div className={styles.deliverySection}>
                <div className={styles.sectionHeader}>
                    <h3>Отслеживание доставок</h3>
                    <button onClick={handleTrackClick} className={styles.trackBtn}>
                        Обновить статусы
                    </button>
                </div>

                {deliveryTracking.length > 0 ? (
                    <div className={styles.deliveryList}>
                        {deliveryTracking.map(delivery => (
                            <div key={delivery._id} className={styles.deliveryItem}>
                                <div className={styles.deliveryInfo}>
                                    <h4>{delivery.product?.name}</h4>
                                    <p>Количество: {delivery.quantity} шт.</p>
                                    <p>Дата доставки: {new Date(delivery.deliveryDate).toLocaleDateString('ru-RU')}</p>
                                    <p>Статус: <span className={styles[delivery.status]}>{delivery.status}</span></p>
                                </div>
                                <div className={styles.deliveryProgress}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: delivery.status === 'delivered' ? '100%' :
                                                    delivery.status === 'pending' ? '50%' : '25%'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.noDeliveries}>Нет предстоящих доставок</p>
                )}
            </div>

            <div className={styles.productsSection}>
                <h3>Товары поставщика</h3>
                <div className={styles.productsGrid}>
                    {supplierData.products?.slice(0, 4).map(product => (
                        <div key={product._id} className={styles.productItem}>
                            <h4>{product.product?.name || 'Неизвестный товар'}</h4>
                            <p>Артикул: {product.sku}</p>
                            <p>Цена: {product.price} ₽</p>
                            <p>В наличии: {product.stockQuantity} шт.</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.petProfiles}>
                <h3>Профили питомцев для товаров</h3>
                <div className={styles.petButtons}>
                    <button onClick={() => onPetProfile('Собака')} className={styles.petBtn}>
                        Собака
                    </button>
                    <button onClick={() => onPetProfile('Кошка')} className={styles.petBtn}>
                        Кошка
                    </button>
                    <button onClick={() => onPetProfile('Птица')} className={styles.petBtn}>
                        Птица
                    </button>
                    <button onClick={() => onPetProfile('Грызун')} className={styles.petBtn}>
                        Грызун
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierDashboard;