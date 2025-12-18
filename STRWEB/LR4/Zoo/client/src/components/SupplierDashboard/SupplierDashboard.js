import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import styles from './SupplierDashboard.module.css';

const RatingStars = ({ rating, onRate, interactive = false }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <button
                key={i}
                onClick={() => interactive && onRate(i)}
                className={`${styles.star} ${i <= Math.round(rating) ? styles.filled : ''} ${interactive ? styles.interactive : ''}`}
                disabled={!interactive}
            >
                {i <= rating ? '★' : '☆'}
            </button>
        );
    }
    return <div className={styles.starsContainer}>{stars}</div>;
};

const SupplierDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useNotifications();

    const [supplierData, setSupplierData] = useState(null);
    const [stats, setStats] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('month');

    const onSupplierRate = useCallback(async (newRating) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/suppliers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating: newRating })
            });

            const data = await response.json();
            if (data.success) {
                setRating(newRating);
                showSuccess('Рейтинг поставщика обновлен!');
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка обновления рейтинга');
        }
    }, [id, showSuccess, showError]);

    const onDeliveryTrack = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/purchases/upcoming`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const supplierDeliveries = data.data.upcomingDeliveries?.filter(
                    delivery => delivery.supplier?._id === id
                ) || [];
                setDeliveries(supplierDeliveries);
                showInfo(`Найдено ${supplierDeliveries.length} предстоящих доставок`);
            }
        } catch (error) {
            showError('Ошибка загрузки доставок');
        }
    }, [id, showInfo, showError]);

    const onPetProfile = useCallback((petType, productId) => {
        const petProfile = JSON.parse(localStorage.getItem('petProfile') || '{}');
        const newProfile = {
            ...petProfile,
            preferredSupplier: id,
            lastViewed: new Date().toISOString(),
            petType: petType || petProfile.petType
        };
        localStorage.setItem('petProfile', JSON.stringify(newProfile));

        showInfo('Профиль питомца обновлен для поставщика');

        if (productId) {
            navigate(`/products/${productId}`);
        }
    }, [id, navigate, showInfo]);

    const onRecommendation = useCallback(() => {
        if (!supplierData?.products?.length) {
            showError('Нет данных о товарах поставщика');
            return;
        }

        const recommendedProduct = [...supplierData.products]
            .sort((a, b) => b.stockQuantity - a.stockQuantity)[0];

        if (recommendedProduct?.product) {
            showSuccess(`Рекомендуем: ${recommendedProduct.product.name} - ${recommendedProduct.price} ₽`);
        }
    }, [supplierData, showError, showSuccess]);

    const onSubscription = useCallback(async (productId, subscribe = true) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/products/${productId}/subscribe`, {
                method: subscribe ? 'POST' : 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                showSuccess(
                    subscribe
                        ? 'Вы подписались на уведомления о товаре'
                        : 'Подписка отменена'
                );
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка управления подпиской');
        }
    }, [showSuccess, showError]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const supplierResponse = await fetch(`http://localhost:5000/api/suppliers/${id}`);
                const supplierData = await supplierResponse.json();

                if (supplierData.success) {
                    setSupplierData(supplierData.data.supplier);
                    setRating(supplierData.data.supplier.rating || 0);
                }

                const statsResponse = await fetch(`http://localhost:5000/api/suppliers/${id}/stats`);
                const statsData = await statsResponse.json();
                if (statsData.success) setStats(statsData.data.stats);

                onDeliveryTrack();

            } catch (error) {
                showError('Ошибка загрузки данных поставщика');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, onDeliveryTrack, showError]);

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            onDeliveryTrack();
            setLoading(false);
            showInfo('Данные обновлены');
        }, 1000);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Загрузка дашборда поставщика...</p>
            </div>
        );
    }

    if (!supplierData) {
        return (
            <div className={styles.errorContainer}>
                <h2>Поставщик не найден</h2>
                <button onClick={() => navigate('/suppliers')}>
                    Вернуться к списку поставщиков
                </button>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1>{supplierData.name}</h1>
                    <p className={styles.supplierMeta}>
                        <span>{supplierData.address?.city}, {supplierData.address?.country}</span>
                        <span>{supplierData.phone}</span>
                        <span>{supplierData.email}</span>
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <RatingStars
                        rating={rating}
                        onRate={onSupplierRate}
                        interactive={true}
                    />
                    <button onClick={handleRefresh} className={styles.refreshBtn}>
                        Обновить
                    </button>
                    <button
                        onClick={() => navigate(`/suppliers/edit/${id}`)}
                        className={styles.editBtn}
                    >
                        Редактировать
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Обзор
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Товары
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'deliveries' ? styles.active : ''}`}
                    onClick={() => setActiveTab('deliveries')}
                >
                    Доставки
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Аналитика
                </button>
            </div>

            <div className={styles.timeFilter}>
                <span>Период:</span>
                {['week', 'month', 'quarter', 'year'].map(range => (
                    <button
                        key={range}
                        className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
                        onClick={() => handleTimeRangeChange(range)}
                    >
                        {range === 'week' && 'Неделя'}
                        {range === 'month' && 'Месяц'}
                        {range === 'quarter' && 'Квартал'}
                        {range === 'year' && 'Год'}
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3>Всего заказов</h3>
                                <p className={styles.statNumber}>{stats?.totalPurchases || 0}</p>
                                <p className={styles.statChange}>+12% за месяц</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Общая стоимость</h3>
                                <p className={styles.statNumber}>
                                    {stats?.totalCost?.toFixed(2) || '0.00'} ₽
                                </p>
                                <p className={styles.statChange}>+8% за месяц</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Товаров в наличии</h3>
                                <p className={styles.statNumber}>
                                    {supplierData.products?.length || 0}
                                </p>
                                <p className={styles.statChange}>
                                    {supplierData.products?.filter(p => p.stockQuantity > 0).length || 0} активных
                                </p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Средний заказ</h3>
                                <p className={styles.statNumber}>
                                    {stats?.totalCost && stats?.totalPurchases
                                        ? (stats.totalCost / stats.totalPurchases).toFixed(2)
                                        : '0.00'} ₽
                                </p>
                                <p className={styles.statChange}>+5% за месяц</p>
                            </div>
                        </div>

                        <div className={styles.quickActions}>
                            <h3>Быстрые действия</h3>
                            <div className={styles.actionButtons}>
                                <button
                                    onClick={onDeliveryTrack}
                                    className={styles.actionBtn}
                                >
                                    Отследить доставки
                                </button>
                                <button
                                    onClick={onRecommendation}
                                    className={styles.actionBtn}
                                >
                                    Получить рекомендацию
                                </button>
                                <button
                                    onClick={() => navigate(`/product-matcher`)}
                                    className={styles.actionBtn}
                                >
                                    Подобрать товары
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'products' && (
                    <div className={styles.productsSection}>
                        <h3>Товары поставщика</h3>

                        <div className={styles.productsGrid}>
                            {supplierData.products?.map((product, index) => (
                                <div key={index} className={styles.productCard}>
                                    <div className={styles.productHeader}>
                                        <h4>{product.product?.name || 'Неизвестный товар'}</h4>
                                        <span className={styles.productSku}>
                                            {product.sku}
                                        </span>
                                    </div>

                                    <div className={styles.productDetails}>
                                        <p>Цена: {product.price} ₽</p>
                                        <p className={
                                            product.stockQuantity < 10
                                                ? styles.lowStock
                                                : styles.inStock
                                        }>
                                            В наличии: {product.stockQuantity} шт.
                                        </p>
                                        <p>Последнее обновление: {
                                            new Date(product.updatedAt || Date.now()).toLocaleDateString('ru-RU')
                                        }</p>
                                    </div>

                                    <div className={styles.productActions}>
                                        <button
                                            onClick={() => onPetProfile(
                                                product.product?.animalType?.[0] || 'Собака',
                                                product.product?._id
                                            )}
                                            className={styles.petProfileBtn}
                                        >
                                            Для питомца
                                        </button>
                                        <button
                                            onClick={() => onSubscription(product.product?._id, true)}
                                            className={styles.subscribeBtn}
                                        >
                                            Подписаться
                                        </button>
                                        <button
                                            onClick={() => navigate(`/products/${product.product?._id}`)}
                                            className={styles.detailsBtn}
                                        >
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'deliveries' && (
                    <div className={styles.deliveriesSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Отслеживание доставок</h3>
                            <button
                                onClick={onDeliveryTrack}
                                className={styles.trackBtn}
                            >
                                Обновить статусы
                            </button>
                        </div>

                        {deliveries.length > 0 ? (
                            <div className={styles.deliveriesList}>
                                {deliveries.map(delivery => (
                                    <div key={delivery._id} className={styles.deliveryItem}>
                                        <div className={styles.deliveryInfo}>
                                            <h4>{delivery.product?.name || 'Неизвестный товар'}</h4>
                                            <div className={styles.deliveryMeta}>
                                                <span>Количество: {delivery.quantity} шт.</span>
                                                <span>Цена: {delivery.purchasePrice} ₽</span>
                                                <span>Сумма: {(delivery.quantity * delivery.purchasePrice).toFixed(2)} ₽</span>
                                            </div>
                                            <div className={styles.deliveryDates}>
                                                <span>Заказ: {new Date(delivery.purchaseDate).toLocaleDateString('ru-RU')}</span>
                                                {delivery.deliveryDate && (
                                                    <span>Доставка: {new Date(delivery.deliveryDate).toLocaleDateString('ru-RU')}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.deliveryStatus}>
                                            <span className={styles[delivery.status]}>
                                                {delivery.status}
                                            </span>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{
                                                        width: delivery.status === 'delivered' ? '100%' :
                                                            delivery.status === 'pending' ? '50%' : '25%'
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => onDeliveryTrack(delivery._id)}
                                                className={styles.trackDeliveryBtn}
                                            >
                                                Отследить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noDeliveries}>
                                <p>Нет предстоящих доставок</p>
                                <button onClick={() => navigate('/purchases')}>
                                    Посмотреть все заказы
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className={styles.analyticsSection}>
                        <h3>Аналитика поставщика</h3>
                        <div className={styles.charts}>
                            <div className={styles.chartPlaceholder}>
                                <p>График заказов по месяцам</p>
                                <p>Здесь будет отображаться статистика заказов</p>
                            </div>
                            <div className={styles.chartPlaceholder}>
                                <p>Топ товаров</p>
                                <p>Самые популярные товары поставщика</p>
                            </div>
                        </div>

                        <div className={styles.analyticsStats}>
                            <div className={styles.analyticsStat}>
                                <h4>Средний рейтинг</h4>
                                <RatingStars rating={rating} interactive={false} />
                                <p>{rating.toFixed(1)} / 5.0</p>
                            </div>
                            <div className={styles.analyticsStat}>
                                <h4>Время доставки</h4>
                                <p className={styles.statValue}>2.3 дня</p>
                                <p className={styles.statLabel}>в среднем</p>
                            </div>
                            <div className={styles.analyticsStat}>
                                <h4>Надежность</h4>
                                <p className={styles.statValue}>94%</p>
                                <p className={styles.statLabel}>заказов вовремя</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierDashboard;