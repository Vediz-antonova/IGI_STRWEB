import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './SupplierDashboard.module.css';

const SupplierDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();

    const [supplierData, setSupplierData] = useState(null);
    const [stats, setStats] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [priceChanges, setPriceChanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchSupplierData = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/suppliers/${id}`);
            const data = await response.json();
            if (data.success) {
                setSupplierData(data.data.supplier);
            }
        } catch (error) {
            showError('Ошибка загрузки данных поставщика');
        }
    }, [id, showError]);

    const fetchSupplierStats = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/suppliers/${id}/stats`);
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            showError('Ошибка загрузки статистики');
        }
    }, [id, showError]);

    const fetchSupplierPurchases = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/suppliers/${id}/purchases?limit=10`);
            const data = await response.json();
            if (data.success) {
                setPurchases(data.data.purchases || []);
            }
        } catch (error) {
            showError('Ошибка загрузки заказов');
        }
    }, [id, showError]);

    const fetchPriceChanges = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/price-changes?supplierId=${id}&limit=5`);
            const data = await response.json();
            if (data.success) {
                setPriceChanges(data.data.priceChanges || []);
            }
        } catch (error) {
            showError('Ошибка загрузки изменений цен');
        }
    }, [id, showError]);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchSupplierData(),
                    fetchSupplierStats(),
                    fetchSupplierPurchases(),
                    fetchPriceChanges()
                ]);
            } catch (error) {
                showError('Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadAllData();
        }
    }, [id, fetchSupplierData, fetchSupplierStats, fetchSupplierPurchases, fetchPriceChanges, showError]);

    const onSupplierRate = useCallback(async (newRating) => {
        try {
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
                showSuccess('Рейтинг поставщика обновлен!');
                fetchSupplierData();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка обновления рейтинга');
        }
    }, [id, token, showSuccess, showError, fetchSupplierData]);

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            fetchSupplierData();
            fetchSupplierStats();
            setLoading(false);
            showInfo('Данные обновлены');
        }, 1000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDeliveryStats = () => {
        if (!stats?.metrics) return { avgDeliveryTime: 0, onTimePercentage: 0 };

        return {
            avgDeliveryTime: parseFloat(stats.metrics.avgDeliveryTime) || 0,
            onTimePercentage: parseFloat(stats.metrics.onTimePercentage) || 0
        };
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

    const deliveryStats = calculateDeliveryStats();

    const RatingStars = ({ rating }) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={i <= rating ? styles.filledStar : styles.emptyStar}>
                    {i <= rating ? '★' : '☆'}
                </span>
            );
        }
        return <div className={styles.starsContainer}>{stars}</div>;
    };

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1>{supplierData.name}</h1>
                    <div className={styles.supplierMeta}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Город:</span>
                            <span>{supplierData.address?.city || 'Не указан'}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Телефон:</span>
                            <span>{supplierData.phone || 'Не указан'}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Email:</span>
                            <span>{supplierData.email || 'Не указан'}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Рейтинг:</span>
                            <RatingStars rating={supplierData.rating || 0} />
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {user?.role === 'admin' && (
                        <>
                            <div className={styles.ratingSelector}>
                                <span>Оценить:</span>
                                <div className={styles.starsSelect}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => onSupplierRate(star)}
                                            className={`${styles.starBtn} ${star <= (supplierData.rating || 0) ? styles.active : ''}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => navigate(`/suppliers/edit/${id}`)} className={styles.editBtn}>
                                Редактировать
                            </button>
                        </>
                    )}
                    <button onClick={handleRefresh} className={styles.refreshBtn}>
                        Обновить
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
                    className={`${styles.tab} ${activeTab === 'purchases' ? styles.active : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    Заказы ({purchases.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Товары ({supplierData.products?.length || 0})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'prices' ? styles.active : ''}`}
                    onClick={() => setActiveTab('prices')}
                >
                    Изменения цен ({priceChanges.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Аналитика
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📦</div>
                                <div className={styles.statContent}>
                                    <h3>Всего заказов</h3>
                                    <p className={styles.statNumber}>
                                        {stats?.stats?.totalPurchases || 0}
                                    </p>
                                    <p className={styles.statLabel}>за все время</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>💰</div>
                                <div className={styles.statContent}>
                                    <h3>Общая стоимость</h3>
                                    <p className={styles.statNumber}>
                                        {stats?.stats?.totalCost?.toFixed(2) || '0.00'} BYN
                                    </p>
                                    <p className={styles.statLabel}>сумма заказов</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📊</div>
                                <div className={styles.statContent}>
                                    <h3>Товаров в наличии</h3>
                                    <p className={styles.statNumber}>
                                        {stats?.metrics?.activeProductsCount || 0}
                                    </p>
                                    <p className={styles.statLabel}>активных товаров</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📦</div>
                                <div className={styles.statContent}>
                                    <h3>Средний заказ</h3>
                                    <p className={styles.statNumber}>
                                        {stats?.stats?.avgPurchasePrice?.toFixed(2) || '0.00'} BYN
                                    </p>
                                    <p className={styles.statLabel}>на заказ</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.quickStats}>
                            <div className={styles.quickStat}>
                                <h4>Статус поставщика</h4>
                                <div className={supplierData.isActive ? styles.statusActive : styles.statusInactive}>
                                    {supplierData.isActive ? 'Активен' : 'Неактивен'}
                                </div>
                            </div>
                            <div className={styles.quickStat}>
                                <h4>Последний заказ</h4>
                                <p>{formatDate(stats?.stats?.lastPurchaseDate) || 'Нет заказов'}</p>
                            </div>
                            <div className={styles.quickStat}>
                                <h4>Среднее время доставки</h4>
                                <p>{deliveryStats.avgDeliveryTime} дней</p>
                            </div>
                            <div className={styles.quickStat}>
                                <h4>Заказов вовремя</h4>
                                <p>{deliveryStats.onTimePercentage}%</p>
                            </div>
                        </div>

                        <div className={styles.recentPurchases}>
                            <h3>Последние заказы</h3>
                            {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
                                <div className={styles.purchasesList}>
                                    {stats.recentPurchases.slice(0, 5).map(purchase => (
                                        <div key={purchase._id} className={styles.purchaseItem}>
                                            <div className={styles.purchaseInfo}>
                                                <h4>{purchase.product?.name || 'Неизвестный товар'}</h4>
                                                <div className={styles.purchaseMeta}>
                                                    <span>Количество: {purchase.quantity} шт.</span>
                                                    <span>Цена: {purchase.purchasePrice} BYN</span>
                                                    <span>Сумма: {purchase.totalCost?.toFixed(2) || '0.00'} BYN</span>
                                                </div>
                                                <div className={styles.purchaseDates}>
                                                    <span>Заказ: {formatDate(purchase.purchaseDate)}</span>
                                                    {purchase.deliveryDate && (
                                                        <span>Доставка: {formatDate(purchase.deliveryDate)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.purchaseStatus}>
                                                <span className={styles[`status${purchase.status}`]}>
                                                    {purchase.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Нет данных о заказах</p>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'purchases' && (
                    <div className={styles.purchasesSection}>
                        <div className={styles.sectionHeader}>
                            <h3>История заказов</h3>
                            <div className={styles.purchaseStats}>
                                <span>Всего: {purchases.length}</span>
                                <span>Сумма: {purchases.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0).toFixed(2)} BYN</span>
                            </div>
                        </div>

                        {purchases.length > 0 ? (
                            <div className={styles.purchasesTableContainer}>
                                <table className={styles.purchasesTable}>
                                    <thead>
                                    <tr>
                                        <th>Товар</th>
                                        <th>Количество</th>
                                        <th>Цена закупки</th>
                                        <th>Сумма</th>
                                        <th>Дата заказа</th>
                                        <th>Дата доставки</th>
                                        <th>Статус</th>
                                        <th>Создал</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {purchases.map(purchase => (
                                        <tr key={purchase._id}>
                                            <td>{purchase.product?.name || 'Неизвестно'}</td>
                                            <td>{purchase.quantity}</td>
                                            <td>{purchase.purchasePrice} BYN</td>
                                            <td>{(purchase.quantity * purchase.purchasePrice).toFixed(2)} BYN</td>
                                            <td>{formatDate(purchase.purchaseDate)}</td>
                                            <td>{purchase.deliveryDate ? formatDate(purchase.deliveryDate) : 'Не указана'}</td>
                                            <td>
                                                    <span className={`${styles.statusBadge} ${styles[purchase.status]}`}>
                                                        {purchase.status}
                                                    </span>
                                            </td>
                                            <td>{purchase.createdBy?.username || 'Система'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Нет данных о заказах</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className={styles.productsSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Товары поставщика</h3>
                            <span className={styles.productsCount}>
                                {supplierData.products?.length || 0} товаров
                            </span>
                        </div>

                        {supplierData.products && supplierData.products.length > 0 ? (
                            <div className={styles.productsGrid}>
                                {supplierData.products.map((supplierProduct, index) => (
                                    <div key={index} className={styles.productCard}>
                                        <div className={styles.productHeader}>
                                            <h4>{supplierProduct.product?.name || supplierProduct.sku || 'Неизвестный товар'}</h4>
                                            <span className={styles.productSku}>
                                                {supplierProduct.sku || 'Без артикула'}
                                            </span>
                                        </div>

                                        <div className={styles.productDetails}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Цена поставщика:</span>
                                                <span className={styles.detailValue}>{supplierProduct.price} BYN</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Остаток у поставщика:</span>
                                                <span className={supplierProduct.stockQuantity > 10 ? styles.inStock : styles.lowStock}>
                                                    {supplierProduct.stockQuantity} шт.
                                                </span>
                                            </div>
                                            {supplierProduct.product && (
                                                <>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Наша цена:</span>
                                                        <span className={styles.detailValue}>{supplierProduct.product.currentPrice} BYN</span>
                                                    </div>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Наш остаток:</span>
                                                        <span className={supplierProduct.product.stockQuantity > supplierProduct.product.minStockLevel ? styles.inStock : styles.lowStock}>
                                                            {supplierProduct.product.stockQuantity} шт.
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {supplierProduct.product && (
                                            <div className={styles.productActions}>
                                                <Link
                                                    to={`/products/${supplierProduct.product._id}`}
                                                    className={styles.viewBtn}
                                                >
                                                    Подробнее
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>У поставщика нет товаров</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'prices' && (
                    <div className={styles.pricesSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Изменения цен</h3>
                            <button
                                onClick={() => navigate('/price-changes')}
                                className={styles.managePricesBtn}
                            >
                                Управление ценами
                            </button>
                        </div>

                        {priceChanges.length > 0 ? (
                            <div className={styles.priceChangesGrid}>
                                {priceChanges.map(change => (
                                    <div key={change._id} className={styles.priceChangeCard}>
                                        <div className={styles.priceChangeHeader}>
                                            <h4>{change.product?.name || 'Неизвестный товар'}</h4>
                                            <div className={`${styles.changeType} ${change.percentageChange > 0 ? styles.increase : styles.decrease}`}>
                                                {change.percentageChange > 0 ? '▲' : '▼'} {Math.abs(change.percentageChange).toFixed(1)}%
                                            </div>
                                        </div>

                                        <div className={styles.priceComparison}>
                                            <div className={styles.oldPrice}>
                                                <span>Старая цена:</span>
                                                <strong>{change.oldPrice} BYN</strong>
                                            </div>
                                            <div className={styles.arrow}>→</div>
                                            <div className={styles.newPrice}>
                                                <span>Новая цена:</span>
                                                <strong>{change.newPrice} BYN</strong>
                                            </div>
                                        </div>

                                        <div className={styles.changeDetails}>
                                            <div className={styles.detail}>
                                                <span>Дата уведомления:</span>
                                                <span>{formatDate(change.notificationDate)}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span>Дата вступления:</span>
                                                <span>{formatDate(change.effectiveDate)}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span>Статус:</span>
                                                <span className={styles[change.status]}>
                                                    {change.status === 'applied' ? 'Применено' :
                                                        change.status === 'pending' ? 'Ожидает' :
                                                            change.status === 'needs_confirmation' ? 'На подтверждении' : change.status}
                                                </span>
                                            </div>
                                        </div>

                                        {change.reason && (
                                            <div className={styles.reason}>
                                                <strong>Причина:</strong> {change.reason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Нет изменений цен</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && stats && (
                    <div className={styles.analyticsSection}>
                        <h3>Аналитика поставщика</h3>

                        <div className={styles.analyticsGrid}>
                            <div className={styles.analyticsCard}>
                                <h4>Распределение заказов по статусам</h4>
                                <div className={styles.statusDistribution}>
                                    {stats.stats?.purchaseDistribution && Object.entries(stats.stats.purchaseDistribution).map(([status, count]) => {
                                        const percentage = stats.stats.totalPurchases > 0 ? (count / stats.stats.totalPurchases * 100).toFixed(1) : 0;
                                        return (
                                            <div key={status} className={styles.statusItem}>
                                                <div className={styles.statusBar}>
                                                    <div
                                                        className={`${styles.statusFill} ${styles[status]}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className={styles.statusInfo}>
                                                    <span className={styles.statusName}>{status}</span>
                                                    <span className={styles.statusCount}>{count} ({percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.analyticsCard}>
                                <h4>Метрики доставки</h4>
                                <div className={styles.deliveryMetrics}>
                                    <div className={styles.metric}>
                                        <div className={styles.metricValue}>{deliveryStats.avgDeliveryTime} дней</div>
                                        <div className={styles.metricLabel}>Среднее время доставки</div>
                                    </div>
                                    <div className={styles.metric}>
                                        <div className={styles.metricValue}>{deliveryStats.onTimePercentage}%</div>
                                        <div className={styles.metricLabel}>Заказов вовремя</div>
                                    </div>
                                    <div className={styles.metric}>
                                        <div className={styles.metricValue}>
                                            {stats.metrics?.deliverySuccessRate || 0}%
                                        </div>
                                        <div className={styles.metricLabel}>Успешных доставок</div>
                                    </div>
                                    <div className={styles.metric}>
                                        <div className={styles.metricValue}>
                                            {stats.metrics?.purchaseFrequency || 0}
                                        </div>
                                        <div className={styles.metricLabel}>Заказов в день</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.analyticsCard}>
                            <h4>Финансовые показатели</h4>
                            <div className={styles.financialMetrics}>
                                <div className={styles.financialMetric}>
                                    <div className={styles.metricLabel}>Общая стоимость заказов</div>
                                    <div className={styles.metricValue}>{stats.stats?.totalCost?.toFixed(2) || '0.00'} BYN</div>
                                </div>
                                <div className={styles.financialMetric}>
                                    <div className={styles.metricLabel}>Средний чек</div>
                                    <div className={styles.metricValue}>{stats.stats?.avgPurchasePrice?.toFixed(2) || '0.00'} BYN</div>
                                </div>
                                <div className={styles.financialMetric}>
                                    <div className={styles.metricLabel}>Всего заказов</div>
                                    <div className={styles.metricValue}>{stats.stats?.totalPurchases || 0}</div>
                                </div>
                                <div className={styles.financialMetric}>
                                    <div className={styles.metricLabel}>Товаров заказано</div>
                                    <div className={styles.metricValue}>{stats.stats?.totalQuantity || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.analyticsCard}>
                            <h4>Рекомендации</h4>
                            <div className={styles.recommendations}>
                                {supplierData.products?.some(p => p.stockQuantity < 10) && (
                                    <div className={styles.recommendation}>
                                        <div className={styles.recommendationIcon}>⚠️</div>
                                        <div className={styles.recommendationText}>
                                            У некоторых товаров низкий остаток. Рекомендуется пополнить запасы.
                                        </div>
                                    </div>
                                )}
                                {deliveryStats.onTimePercentage < 90 && (
                                    <div className={styles.recommendation}>
                                        <div className={styles.recommendationIcon}>🚚</div>
                                        <div className={styles.recommendationText}>
                                            Процент своевременных доставок ниже 90%. Рекомендуется улучшить логистику.
                                        </div>
                                    </div>
                                )}
                                {supplierData.rating < 4 && (
                                    <div className={styles.recommendation}>
                                        <div className={styles.recommendationIcon}>⭐</div>
                                        <div className={styles.recommendationText}>
                                            Рейтинг поставщика ниже 4.0. Рекомендуется улучшить качество обслуживания.
                                        </div>
                                    </div>
                                )}
                                {stats.stats?.totalPurchases === 0 && (
                                    <div className={styles.recommendation}>
                                        <div className={styles.recommendationIcon}>📊</div>
                                        <div className={styles.recommendationText}>
                                            Нет данных о заказах. Рекомендуется активировать сотрудничество.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierDashboard;