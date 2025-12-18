import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './PriceChanges.module.css';

function PriceChanges() {
    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();

    const [priceChanges, setPriceChanges] = useState([]);
    const [upcomingChanges, setUpcomingChanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showForm, setShowForm] = useState(false);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [productHistory, setProductHistory] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');

    const [formData, setFormData] = useState({
        product: '',
        supplier: '',
        newPrice: '',
        effectiveDate: '',
        notificationDate: new Date().toISOString().split('T')[0],
        reason: ''
    });

    useEffect(() => {
        fetchData();
        fetchSuppliers();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [showForm]); // Загружаем товары только когда нужна форма

    useEffect(() => {
        if (selectedProductId) {
            fetchProductPriceHistory(selectedProductId);
        }
    }, [selectedProductId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [changesRes, upcomingRes] = await Promise.all([
                fetch('http://localhost:5000/api/price-changes?limit=100'),
                fetch('http://localhost:5000/api/price-changes/upcoming')
            ]);

            const changesData = await changesRes.json();
            const upcomingData = await upcomingRes.json();

            if (changesData.success) {
                setPriceChanges(changesData.data.priceChanges || []);
            }
            if (upcomingData.success) {
                setUpcomingChanges(upcomingData.data.upcomingChanges || []);
            }
        } catch (error) {
            showError('Ошибка загрузки изменений цен');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        if (!showForm && activeTab !== 'productHistory') return;

        setProductsLoading(true);
        try {
            let allProducts = [];
            let page = 1;
            let hasMore = true;

            // Пагинированная загрузка всех товаров
            while (hasMore) {
                const res = await fetch(`http://localhost:5000/api/products?page=${page}&limit=100`);
                const data = await res.json();

                if (data.success && data.data.products) {
                    allProducts = [...allProducts, ...data.data.products];
                    hasMore = page < (data.data.pagination?.pages || 1);
                    page++;
                } else {
                    hasMore = false;
                }
            }

            setProducts(allProducts);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            showError('Ошибка загрузки товаров');
        } finally {
            setProductsLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/suppliers?limit=100');
            const data = await res.json();
            if (data.success) setSuppliers(data.data.suppliers || []);
        } catch (error) {
            console.error('Ошибка загрузки поставщиков:', error);
        }
    };

    const fetchProductPriceHistory = async (productId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/price-changes/product/${productId}/history?limit=100`);
            const data = await res.json();
            if (data.success) {
                setProductHistory(data.data.priceHistory || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории цен:', error);
            showError('Ошибка загрузки истории цен');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.product || !formData.supplier || !formData.newPrice || !formData.effectiveDate) {
            showError('Заполните все обязательные поля');
            return;
        }

        try {
            const product = products.find(p => p._id === formData.product);
            if (!product) {
                showError('Товар не найден');
                return;
            }

            const priceChangeData = {
                product: formData.product,
                supplier: formData.supplier,
                newPrice: parseFloat(formData.newPrice),
                effectiveDate: formData.effectiveDate,
                notificationDate: formData.notificationDate,
                reason: formData.reason || 'Изменение цены поставщиком'
            };

            const res = await fetch('http://localhost:5000/api/price-changes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(priceChangeData)
            });

            const data = await res.json();

            if (data.success) {
                showSuccess('Уведомление об изменении цены успешно создано!');
                setShowForm(false);
                setFormData({
                    product: '',
                    supplier: '',
                    newPrice: '',
                    effectiveDate: '',
                    notificationDate: new Date().toISOString().split('T')[0],
                    reason: ''
                });
                fetchData(); // Обновляем данные
            } else {
                showError(data.message || 'Ошибка создания уведомления');
            }
        } catch (error) {
            showError('Ошибка подключения к серверу');
        }
    };

    const handleConfirm = async (changeId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/price-changes/${changeId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ confirm: true })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Изменение цены подтверждено и применено!');
                fetchData();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка подтверждения');
        }
    };

    const handleReject = async (changeId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/price-changes/${changeId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ confirm: false })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Изменение цены отклонено!');
                fetchData();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка отклонения');
        }
    };

    const handleApplyPending = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/price-changes/apply-pending', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Ожидающие изменения цен применены!');
                fetchData();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError('Ошибка применения изменений');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка данных...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Управление изменениями цен</h2>
                <p>Система уведомлений об изменении цен от поставщиков</p>
            </div>

            {user?.role === 'admin' && (
                <div className={styles.actions}>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={styles.toggleFormBtn}
                    >
                        {showForm ? 'Скрыть форму' : '+ Создать уведомление'}
                    </button>

                    <button
                        onClick={handleApplyPending}
                        className={styles.applyBtn}
                    >
                        Применить ожидающие изменения
                    </button>
                </div>
            )}

            {showForm && user?.role === 'admin' && (
                <div className={styles.formContainer}>
                    <h3>Создание уведомления об изменении цены</h3>
                    {productsLoading ? (
                        <div className={styles.loading}>Загрузка товаров...</div>
                    ) : (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Товар *</label>
                                <select
                                    name="product"
                                    value={formData.product}
                                    onChange={handleFormChange}
                                    required
                                    disabled={productsLoading}
                                >
                                    <option value="">Выберите товар</option>
                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.name} ({product.sku}) - {product.currentPrice} ₽
                                        </option>
                                    ))}
                                </select>
                                <small>Всего товаров: {products.length}</small>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Поставщик *</label>
                                <select
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">Выберите поставщика</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier._id} value={supplier._id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Новая цена *</label>
                                    <input
                                        type="number"
                                        name="newPrice"
                                        value={formData.newPrice}
                                        onChange={handleFormChange}
                                        min="0.01"
                                        step="0.01"
                                        required
                                        placeholder="Новая цена"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Дата уведомления *</label>
                                    <input
                                        type="date"
                                        name="notificationDate"
                                        value={formData.notificationDate}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Дата вступления в силу *</label>
                                    <input
                                        type="date"
                                        name="effectiveDate"
                                        value={formData.effectiveDate}
                                        onChange={handleFormChange}
                                        required
                                        min={formData.notificationDate}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Причина изменения</label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleFormChange}
                                    placeholder="Обоснование изменения цены..."
                                    rows="3"
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className={styles.cancelBtn}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                >
                                    Создать уведомление
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Предстоящие изменения ({upcomingChanges.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    История изменений ({priceChanges.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'productHistory' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab('productHistory');
                        if (products.length === 0) {
                            fetchProducts();
                        }
                    }}
                >
                    История по товару
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'upcoming' ? (
                    <div className={styles.upcomingSection}>
                        <div className={styles.sectionInfo}>
                            <p>Всего предстоящих изменений: <strong>{upcomingChanges.length}</strong></p>
                            <p>Период просмотра: <strong>Следующие 3 месяца</strong></p>
                        </div>

                        {upcomingChanges.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Нет предстоящих изменений цен</p>
                            </div>
                        ) : (
                            <div className={styles.changesGrid}>
                                {upcomingChanges.map(change => (
                                    <div key={change._id} className={styles.changeCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.changeInfo}>
                                                <h4>{change.product?.name || 'Товар не найден'}</h4>
                                                <p className={styles.supplier}>
                                                    Поставщик: {change.supplier?.name || 'Неизвестен'}
                                                </p>
                                                {change.product && (
                                                    <p className={styles.sku}>
                                                        Артикул: {change.product.sku}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`${styles.status} ${styles[change.status || 'scheduled']}`}>
                                                {change.status === 'needs_confirmation' ? 'Требует подтверждения' :
                                                    change.status === 'scheduled' ? 'Запланировано' :
                                                        change.status === 'pending' ? 'Ожидает применения' : 'Запланировано'}
                                            </div>
                                        </div>

                                        <div className={styles.priceChange}>
                                            <div className={styles.oldPrice}>
                                                <span className={styles.label}>Старая цена:</span>
                                                <span className={styles.priceValue}>{change.oldPrice} ₽</span>
                                            </div>
                                            <div className={styles.arrow}>→</div>
                                            <div className={styles.newPrice}>
                                                <span className={styles.label}>Новая цена:</span>
                                                <span className={styles.priceValue}>{change.newPrice} ₽</span>
                                            </div>
                                            <div className={`${styles.changePercentage} ${change.percentageChange > 0 ? styles.increase : styles.decrease}`}>
                                                {change.percentageChange > 0 ? '+' : ''}{change.percentageChange}%
                                            </div>
                                        </div>

                                        <div className={styles.dates}>
                                            <div className={styles.date}>
                                                <span>Уведомление:</span>
                                                <strong>{formatDate(change.notificationDateLocal || change.notificationDate)}</strong>
                                            </div>
                                            <div className={styles.date}>
                                                <span>Вступает в силу:</span>
                                                <strong>{formatDate(change.effectiveDateLocal || change.effectiveDate)}</strong>
                                            </div>
                                            <div className={styles.date}>
                                                <span>Дней до вступления:</span>
                                                <strong>{change.daysUntilEffective || Math.ceil((new Date(change.effectiveDate) - new Date()) / (1000 * 60 * 60 * 24))}</strong>
                                            </div>
                                        </div>

                                        {change.reason && (
                                            <div className={styles.reason}>
                                                <strong>Причина:</strong> {change.reason}
                                            </div>
                                        )}

                                        {change.requiresConfirmation && user?.role === 'admin' && (
                                            <div className={styles.confirmationActions}>
                                                <button
                                                    onClick={() => handleConfirm(change._id)}
                                                    className={styles.confirmBtn}
                                                >
                                                    Подтвердить изменение
                                                </button>
                                                <button
                                                    onClick={() => handleReject(change._id)}
                                                    className={styles.rejectBtn}
                                                >
                                                    Отклонить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'history' ? (
                    <div className={styles.historySection}>
                        <div className={styles.sectionInfo}>
                            <p>Всего изменений цен в истории: <strong>{priceChanges.length}</strong></p>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.historyTable}>
                                <thead>
                                <tr>
                                    <th>Товар</th>
                                    <th>Артикул</th>
                                    <th>Поставщик</th>
                                    <th>Старая цена</th>
                                    <th>Новая цена</th>
                                    <th>Изменение</th>
                                    <th>Дата вступления</th>
                                    <th>Статус</th>
                                    <th>Причина</th>
                                </tr>
                                </thead>
                                <tbody>
                                {priceChanges.map(change => (
                                    <tr key={change._id}>
                                        <td>{change.product?.name || 'Неизвестно'}</td>
                                        <td>{change.product?.sku || '-'}</td>
                                        <td>{change.supplier?.name || 'Неизвестно'}</td>
                                        <td>{change.oldPrice} ₽</td>
                                        <td>
                                            <strong>{change.newPrice} ₽</strong>
                                        </td>
                                        <td>
                                                <span className={`${styles.changeBadge} ${change.percentageChange > 0 ? styles.increase : styles.decrease}`}>
                                                    {change.percentageChange > 0 ? '+' : ''}{change.percentageChange}%
                                                </span>
                                        </td>
                                        <td>{formatDateShort(change.effectiveDate)}</td>
                                        <td>
                                                <span className={`${styles.statusBadge} ${styles[change.status]}`}>
                                                    {change.status === 'applied' ? 'Применено' :
                                                        change.status === 'pending' ? 'Ожидает' :
                                                            change.status === 'needs_confirmation' ? 'На подтверждении' : 'Запланировано'}
                                                </span>
                                        </td>
                                        <td className={styles.reasonCell}>
                                            {change.reason || '-'}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className={styles.productHistorySection}>
                        <div className={styles.productSelector}>
                            <label>Выберите товар для просмотра истории цен:</label>
                            {productsLoading ? (
                                <div className={styles.loadingSmall}>Загрузка товаров...</div>
                            ) : (
                                <>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className={styles.productSelect}
                                    >
                                        <option value="">Выберите товар</option>
                                        {products.map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name} ({product.sku}) - {product.currentPrice} ₽
                                            </option>
                                        ))}
                                    </select>
                                    <small>Всего товаров: {products.length}</small>
                                </>
                            )}
                        </div>

                        {selectedProductId ? (
                            productHistory.length > 0 ? (
                                <div className={styles.historyTableContainer}>
                                    <div className={styles.sectionInfo}>
                                        <p>История изменений цен для выбранного товара: <strong>{productHistory.length} записей</strong></p>
                                    </div>
                                    <table className={styles.productHistoryTable}>
                                        <thead>
                                        <tr>
                                            <th>Дата изменения</th>
                                            <th>Поставщик</th>
                                            <th>Старая цена</th>
                                            <th>Новая цена</th>
                                            <th>Изменение</th>
                                            <th>Статус</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {productHistory.map(change => (
                                            <tr key={change._id}>
                                                <td>{formatDate(change.effectiveDateLocal || change.effectiveDate)}</td>
                                                <td>{change.supplier?.name || 'Неизвестно'}</td>
                                                <td>{change.oldPrice} ₽</td>
                                                <td>
                                                    <strong>{change.newPrice} ₽</strong>
                                                </td>
                                                <td>
                                                        <span className={`${styles.changeBadge} ${change.percentageChange > 0 ? styles.increase : styles.decrease}`}>
                                                            {change.percentageChange > 0 ? '+' : ''}{change.percentageChange}%
                                                        </span>
                                                </td>
                                                <td>
                                                        <span className={`${styles.statusBadge} ${styles[change.status]}`}>
                                                            {change.status === 'applied' ? 'Применено' :
                                                                change.status === 'pending' ? 'Ожидает' :
                                                                    change.status === 'needs_confirmation' ? 'На подтверждении' : 'Запланировано'}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={styles.noHistory}>
                                    <p>Для выбранного товара нет истории изменений цен</p>
                                </div>
                            )
                        ) : (
                            <div className={styles.selectProduct}>
                                <p>Выберите товар из списка, чтобы увидеть историю изменений цен</p>
                                {products.length === 0 && !productsLoading && (
                                    <button
                                        onClick={fetchProducts}
                                        className={styles.loadProductsBtn}
                                    >
                                        Загрузить список товаров
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PriceChanges;