import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import InventoryManager from './InventoryManager';
import styles from './OrderManager.module.css';

function OrderManager() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError } = useNotifications();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);

            let url = 'http://localhost:5000/api/orders?limit=50';

            if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }

            if (dateFilter !== 'all') {
                const now = new Date();
                let startDate = new Date();

                switch (dateFilter) {
                    case 'today':
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    default:
                        break;
                }

                url += `&startDate=${startDate.toISOString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setOrders(data.data.orders || []);
            } else {
                showError(data.message || 'Ошибка загрузки заказов');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            showError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, dateFilter, token, showError]);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab, fetchOrders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        const shouldUpdate = window.confirm ?
            window.confirm(`Изменить статус заказа на "${newStatus}"?`) :
            true;

        if (!shouldUpdate) return;

        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess(`Статус заказа изменен на "${newStatus}"`);
                fetchOrders();

                if (selectedOrder && selectedOrder._id === orderId) {
                    setSelectedOrder(data.data.order);
                }
            } else {
                showError(data.message || 'Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Ошибка подключения к серверу');
        }
    };

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const handleCloseOrderDetails = () => {
        setShowOrderDetails(false);
        setSelectedOrder(null);
    };

    const handleDeleteOrder = async (orderId) => {
        const shouldDelete = window.confirm ?
            window.confirm('Вы уверены, что хотите удалить этот заказ?') :
            true;

        if (!shouldDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Заказ успешно удален');
                fetchOrders();

                if (selectedOrder && selectedOrder._id === orderId) {
                    handleCloseOrderDetails();
                }
            } else {
                showError(data.message || 'Ошибка удаления заказа');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            showError('Ошибка подключения к серверу');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'created': return '#4299e1';
            case 'confirmed': return '#38b2ac';
            case 'processing': return '#ed8936';
            case 'shipped': return '#9c27b0';
            case 'delivered': return '#48bb78';
            case 'cancelled': return '#f56565';
            default: return '#a0aec0';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const calculateOrderStats = () => {
        const totalOrders = orders.length;
        const totalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);
        const totalItems = orders.reduce((sum, order) => sum + order.totalQuantity, 0);

        const statusCounts = {};
        orders.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(order =>
            new Date(order.createdAt) >= today
        ).length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekOrders = orders.filter(order =>
            new Date(order.createdAt) >= weekAgo
        ).length;

        return {
            totalOrders,
            totalCost: totalCost.toFixed(2),
            totalItems,
            statusCounts,
            todayOrders,
            weekOrders,
            avgOrderValue: totalOrders > 0 ? (totalCost / totalOrders).toFixed(2) : '0.00'
        };
    };

    const renderOrderDetails = () => {
        if (!selectedOrder) return null;

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div className={styles.modalHeader}>
                        <h3>Детали заказа #{selectedOrder.orderNumber}</h3>
                        <button
                            onClick={handleCloseOrderDetails}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>

                    <div className={styles.modalContent}>
                        <div className={styles.orderInfoGrid}>
                            <div className={styles.infoSection}>
                                <h4>Основная информация</h4>
                                <p><strong>Номер заказа:</strong> {selectedOrder.orderNumber}</p>
                                <p><strong>Статус:</strong>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                                    >
                                        {selectedOrder.status}
                                    </span>
                                </p>
                                <p><strong>Дата создания:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                <p><strong>Общая стоимость:</strong> {selectedOrder.totalCost} BYN</p>
                                <p><strong>Общее количество:</strong> {selectedOrder.totalQuantity} шт.</p>
                            </div>

                            <div className={styles.infoSection}>
                                <h4>Информация о поставщике</h4>
                                {selectedOrder.supplier ? (
                                    <>
                                        <p><strong>Название:</strong> {selectedOrder.supplier.name}</p>
                                        <p><strong>Город:</strong> {selectedOrder.supplier.address?.city || '—'}</p>
                                        <p><strong>Телефон:</strong> {selectedOrder.supplier.phone || '—'}</p>
                                        <Link
                                            to={`/suppliers/${selectedOrder.supplier._id}`}
                                            className={styles.supplierLink}
                                        >
                                            Перейти к поставщику →
                                        </Link>
                                    </>
                                ) : (
                                    <p>Информация о поставщике не найдена</p>
                                )}
                            </div>

                            <div className={styles.infoSection}>
                                <h4>Информация о доставке</h4>
                                {selectedOrder.deliveryAddress ? (
                                    <>
                                        <p><strong>Город:</strong> {selectedOrder.deliveryAddress.city}</p>
                                        <p><strong>Улица:</strong> {selectedOrder.deliveryAddress.street}</p>
                                        <p><strong>Страна:</strong> {selectedOrder.deliveryAddress.country}</p>
                                    </>
                                ) : (
                                    <p>Адрес доставки не указан</p>
                                )}
                                <p><strong>Ожидаемая доставка:</strong> {formatDateShort(selectedOrder.estimatedDeliveryDate) || '—'}</p>
                                <p><strong>Фактическая доставка:</strong> {formatDateShort(selectedOrder.deliveryDate) || '—'}</p>
                            </div>

                            <div className={styles.infoSection}>
                                <h4>Создатель заказа</h4>
                                {selectedOrder.createdBy ? (
                                    <>
                                        <p><strong>Имя:</strong> {selectedOrder.createdBy.username}</p>
                                        <p><strong>Email:</strong> {selectedOrder.createdBy.email}</p>
                                    </>
                                ) : (
                                    <p>Информация о создателе не найдена</p>
                                )}
                            </div>
                        </div>

                        {selectedOrder.notes && (
                            <div className={styles.notesSection}>
                                <h4>Примечания</h4>
                                <p>{selectedOrder.notes}</p>
                            </div>
                        )}

                        {selectedOrder.purchases && selectedOrder.purchases.length > 0 && (
                            <div className={styles.purchasesSection}>
                                <h4>Товары в заказе</h4>
                                <div className={styles.purchasesGrid}>
                                    {selectedOrder.purchases.map((purchase, index) => (
                                        <div key={index} className={styles.purchaseItem}>
                                            {purchase.product ? (
                                                <>
                                                    <div className={styles.purchaseHeader}>
                                                        <h5>{purchase.product.name}</h5>
                                                        <span className={styles.purchaseSku}>{purchase.product.sku}</span>
                                                    </div>
                                                    <div className={styles.purchaseDetails}>
                                                        <p><strong>Количество:</strong> {purchase.quantity} шт.</p>
                                                        <p><strong>Цена за единицу:</strong> {purchase.purchasePrice} BYN</p>
                                                        <p><strong>Общая стоимость:</strong> {(purchase.quantity * purchase.purchasePrice).toFixed(2)} BYN</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p>Информация о товаре не найдена</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            {user?.role === 'admin' && (
                                <>
                                    <div className={styles.statusActions}>
                                        <h4>Изменение статуса</h4>
                                        <div className={styles.statusButtons}>
                                            {['created', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                                                    disabled={selectedOrder.status === status}
                                                    className={styles.statusBtn}
                                                    style={{
                                                        backgroundColor: getStatusColor(status),
                                                        opacity: selectedOrder.status === status ? 0.6 : 1
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.dangerActions}>
                                        <button
                                            onClick={() => handleDeleteOrder(selectedOrder._id)}
                                            className={styles.deleteBtn}
                                        >
                                            Удалить заказ
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderOrdersTab = () => {
        const stats = calculateOrderStats();

        return (
            <>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}></div>
                        <div className={styles.statContent}>
                            <h3>Всего заказов</h3>
                            <p className={styles.statNumber}>{stats.totalOrders}</p>
                            <p className={styles.statLabel}>в системе</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}></div>
                        <div className={styles.statContent}>
                            <h3>Общая стоимость</h3>
                            <p className={styles.statNumber}>{stats.totalCost}</p>
                            <p className={styles.statLabel}>BYN</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}></div>
                        <div className={styles.statContent}>
                            <h3>Всего товаров</h3>
                            <p className={styles.statNumber}>{stats.totalItems}</p>
                            <p className={styles.statLabel}>единиц</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}></div>
                        <div className={styles.statContent}>
                            <h3>Средний заказ</h3>
                            <p className={styles.statNumber}>{stats.avgOrderValue}</p>
                            <p className={styles.statLabel}>BYN</p>
                        </div>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.filterGroup}>
                        <label>Фильтр по статусу:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Все статусы</option>
                            <option value="created">Создан</option>
                            <option value="confirmed">Подтвержден</option>
                            <option value="processing">В обработке</option>
                            <option value="shipped">Отправлен</option>
                            <option value="delivered">Доставлен</option>
                            <option value="cancelled">Отменен</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Фильтр по дате:</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">За все время</option>
                            <option value="today">Сегодня</option>
                            <option value="week">За неделю</option>
                            <option value="month">За месяц</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchOrders}
                        className={styles.refreshBtn}
                    >
                        Обновить
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Загрузка заказов...</div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Заказы не найдены</p>
                        <p>Попробуйте изменить параметры фильтрации</p>
                    </div>
                ) : (
                    <div className={styles.ordersGrid}>
                        {orders.map(order => (
                            <div key={order._id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <div>
                                        <h4>Заказ #{order.orderNumber}</h4>
                                        <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                                    </div>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        {order.status}
                                    </span>
                                </div>

                                <div className={styles.orderDetails}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Поставщик:</span>
                                        <span className={styles.detailValue}>
                                            {order.supplier?.name || 'Неизвестно'}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Количество:</span>
                                        <span className={styles.detailValue}>
                                            {order.totalQuantity} шт.
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Стоимость:</span>
                                        <span className={styles.detailValue}>
                                            {order.totalCost} BYN
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Доставка:</span>
                                        <span className={styles.detailValue}>
                                            {formatDateShort(order.estimatedDeliveryDate) || 'Не указана'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.orderActions}>
                                    <button
                                        onClick={() => handleViewOrderDetails(order)}
                                        className={styles.viewBtn}
                                    >
                                        Подробнее
                                    </button>

                                    {user?.role === 'admin' && (
                                        <div className={styles.adminActions}>
                                            <button
                                                onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                                className={styles.deliverBtn}
                                                disabled={order.status === 'delivered' || order.status === 'cancelled'}
                                            >
                                                Доставлен
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                                className={styles.cancelBtn}
                                                disabled={order.status === 'cancelled'}
                                            >
                                                Отменить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={styles.orderManager}>
            <div className={styles.header}>
                <h2>Управление заказами</h2>
                <p>Мониторинг и управление заказами поставщикам</p>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Заказы ({orders.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    Управление запасами
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'inventory' && <InventoryManager />}
                {activeTab === 'stats' && (
                    <div className={styles.statsTab}>
                        <h3>Статистика заказов</h3>
                        <p>Детальная статистика в разработке...</p>
                    </div>
                )}
            </div>

            {showOrderDetails && renderOrderDetails()}
        </div>
    );
}

export default OrderManager;