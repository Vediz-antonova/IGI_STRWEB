import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './PurchaseHistory.module.css';

class InventoryManager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inventory: [],
            loading: true,
            error: null,
            sortField: 'purchaseDate',
            sortOrder: 'desc',
            filterStatus: '',
            searchTerm: '',
            selectedItems: [],
            showLowStock: false
        };
    }

    componentDidMount() {
        this.fetchInventory();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.sortField !== this.state.sortField ||
            prevState.sortOrder !== this.state.sortOrder ||
            prevState.filterStatus !== this.state.filterStatus ||
            prevState.showLowStock !== this.state.showLowStock ||
            prevProps.supplierId !== this.props.supplierId) {
            this.fetchInventory();
        }
    }

    fetchInventory = async () => {
        this.setState({ loading: true, error: null });
        try {
            const { token } = this.props;
            const query = new URLSearchParams({
                sortBy: this.state.sortField,
                sortOrder: this.state.sortOrder,
                ...(this.state.filterStatus && { status: this.state.filterStatus }),
                ...(this.props.supplierId && { supplierId: this.props.supplierId }),
                ...(this.state.showLowStock && { lowStock: 'true' })
            }).toString();

            const response = await fetch(`http://localhost:5000/api/purchases?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.setState({
                    inventory: data.data.purchases || [],
                    loading: false
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.setState({
                error: error.message,
                loading: false
            });
        }
    };

    onInventoryUpdate = async (purchaseId, updates) => {
        try {
            const { token, onUpdate } = this.props;
            const response = await fetch(`http://localhost:5000/api/purchases/${purchaseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            if (data.success) {
                this.fetchInventory();
                if (onUpdate) onUpdate(data.data.purchase);
                return { success: true, message: 'Обновлено успешно' };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    onDeletePurchase = async (purchaseId) => {
        if (!window.confirm('Удалить эту закупку?')) return;

        try {
            const { token } = this.props;
            const response = await fetch(`http://localhost:5000/api/purchases/${purchaseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                this.fetchInventory();
                this.props.showNotification('Закупка удалена', 'success');
            } else {
                this.props.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.props.showNotification('Ошибка удаления', 'error');
        }
    };

    handleSort = (field) => {
        this.setState(prev => ({
            sortField: field,
            sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    handleStatusFilter = (status) => {
        this.setState({ filterStatus: status });
    };

    handleSearch = (e) => {
        this.setState({ searchTerm: e.target.value });
    };

    handleSelectItem = (purchaseId) => {
        this.setState(prev => ({
            selectedItems: prev.selectedItems.includes(purchaseId)
                ? prev.selectedItems.filter(id => id !== purchaseId)
                : [...prev.selectedItems, purchaseId]
        }));
    };

    handleBulkUpdate = async (status) => {
        if (this.state.selectedItems.length === 0) {
            this.props.showNotification('Выберите хотя бы одну позицию', 'warning');
            return;
        }

        const promises = this.state.selectedItems.map(purchaseId =>
            this.onInventoryUpdate(purchaseId, { status })
        );

        try {
            const results = await Promise.all(promises);
            const successful = results.filter(r => r.success).length;
            this.props.showNotification(`Обновлено ${successful} позиций`, 'success');
            this.setState({ selectedItems: [] });
        } catch (error) {
            this.props.showNotification('Ошибка массового обновления', 'error');
        }
    };

    onDeliveryTrack = (purchaseId) => {
        this.props.showNotification(`Отслеживание доставки для заказа ${purchaseId}`, 'info');
    };

    render() {
        const {
            inventory,
            loading,
            error,
            sortField,
            sortOrder,
            searchTerm,
            selectedItems,
            showLowStock
        } = this.state;

        const filteredInventory = inventory.filter(item => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                item.product?.name?.toLowerCase().includes(searchLower) ||
                item.supplier?.name?.toLowerCase().includes(searchLower) ||
                item.invoiceNumber?.toLowerCase().includes(searchLower)
            );
        });

        if (loading) return <div className={styles.loading}>Загрузка инвентаря...</div>;
        if (error) return <div className={styles.error}>{error}</div>;

        return (
            <div className={styles.inventoryManager}>
                <div className={styles.controls}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Поиск по товарам или поставщикам..."
                            value={searchTerm}
                            onChange={this.handleSearch}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterControls}>
                        <button
                            onClick={() => this.handleSort('purchaseDate')}
                            className={`${styles.sortBtn} ${sortField === 'purchaseDate' ? styles.active : ''}`}
                        >
                            Дата {sortField === 'purchaseDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>

                        <button
                            onClick={() => this.handleSort('quantity')}
                            className={`${styles.sortBtn} ${sortField === 'quantity' ? styles.active : ''}`}
                        >
                            Количество {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>

                        <button
                            onClick={() => this.handleSort('totalCost')}
                            className={`${styles.sortBtn} ${sortField === 'totalCost' ? styles.active : ''}`}
                        >
                            Сумма {sortField === 'totalCost' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>

                        <select
                            onChange={(e) => this.handleStatusFilter(e.target.value)}
                            className={styles.statusFilter}
                        >
                            <option value="">Все статусы</option>
                            <option value="ordered">Заказан</option>
                            <option value="pending">В обработке</option>
                            <option value="delivered">Доставлен</option>
                            <option value="cancelled">Отменен</option>
                        </select>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={showLowStock}
                                onChange={(e) => this.setState({ showLowStock: e.target.checked })}
                            />
                            Только с низким остатком
                        </label>
                    </div>

                    {selectedItems.length > 0 && (
                        <div className={styles.bulkActions}>
                            <span>Выбрано: {selectedItems.length}</span>
                            <button onClick={() => this.handleBulkUpdate('delivered')}>
                                Отметить доставленными
                            </button>
                            <button onClick={() => this.handleBulkUpdate('cancelled')}>
                                Отменить выбранные
                            </button>
                            <button onClick={() => this.setState({ selectedItems: [] })}>
                                Снять выделение
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.inventoryGrid}>
                    {filteredInventory.length === 0 ? (
                        <div className={styles.noResults}>
                            <p>Закупки не найдены</p>
                        </div>
                    ) : (
                        filteredInventory.map(purchase => (
                            <div
                                key={purchase._id}
                                className={`${styles.inventoryCard} ${selectedItems.includes(purchase._id) ? styles.selected : ''}`}
                                onClick={() => this.handleSelectItem(purchase._id)}
                            >
                                <div className={styles.cardHeader}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(purchase._id)}
                                        onChange={() => {}}
                                        className={styles.selectCheckbox}
                                    />
                                    <span className={`${styles.status} ${styles[purchase.status]}`}>
                                        {purchase.status}
                                    </span>
                                </div>

                                <div className={styles.cardContent}>
                                    <h4>{purchase.product?.name || 'Неизвестный товар'}</h4>
                                    <p className={styles.supplier}>
                                        Поставщик: <strong>{purchase.supplier?.name || 'Неизвестен'}</strong>
                                    </p>

                                    <div className={styles.details}>
                                        <div className={styles.detail}>
                                            <span>Количество:</span>
                                            <span className={styles.quantity}>{purchase.quantity} шт.</span>
                                        </div>
                                        <div className={styles.detail}>
                                            <span>Цена:</span>
                                            <span className={styles.price}>{purchase.purchasePrice} ₽</span>
                                        </div>
                                        <div className={styles.detail}>
                                            <span>Сумма:</span>
                                            <span className={styles.total}>
                                                {(purchase.quantity * purchase.purchasePrice).toFixed(2)} ₽
                                            </span>
                                        </div>
                                        <div className={styles.detail}>
                                            <span>Дата:</span>
                                            <span>{new Date(purchase.purchaseDate).toLocaleDateString('ru-RU')}</span>
                                        </div>
                                        {purchase.deliveryDate && (
                                            <div className={styles.detail}>
                                                <span>Доставка:</span>
                                                <span>{new Date(purchase.deliveryDate).toLocaleDateString('ru-RU')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {purchase.notes && (
                                        <div className={styles.notes}>
                                            <strong>Примечания:</strong> {purchase.notes}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.onInventoryUpdate(purchase._id, { status: 'delivered' });
                                        }}
                                        disabled={purchase.status === 'delivered'}
                                        className={styles.deliverBtn}
                                    >
                                        {purchase.status === 'delivered' ? 'Доставлен' : 'Отметить доставленным'}
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.onDeliveryTrack(purchase._id);
                                        }}
                                        className={styles.trackBtn}
                                    >
                                        Отследить
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.onDeletePurchase(purchase._id);
                                        }}
                                        className={styles.deleteBtn}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span>Всего:</span>
                        <strong>{filteredInventory.length}</strong>
                    </div>
                    <div className={styles.stat}>
                        <span>Доставлено:</span>
                        <strong>{filteredInventory.filter(p => p.status === 'delivered').length}</strong>
                    </div>
                    <div className={styles.stat}>
                        <span>В обработке:</span>
                        <strong>{filteredInventory.filter(p => p.status === 'pending').length}</strong>
                    </div>
                    <div className={styles.stat}>
                        <span>Общая сумма:</span>
                        <strong>
                            {filteredInventory.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0).toFixed(2)} ₽
                        </strong>
                    </div>
                </div>
            </div>
        );
    }
}

function PurchaseHistory() {
    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchPurchases();
        }
    }, [user]);

    const fetchPurchases = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/purchases/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setStats(data.data.overallStats);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }

        try {
            const response = await fetch('http://localhost:5000/api/purchases', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setPurchases(data.data.purchases || []);
            }
            setLoading(false);
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        if (type === 'success') showSuccess(message);
        else if (type === 'error') showError(message);
        else if (type === 'warning') showInfo(message);
        else showInfo(message);
    };

    if (user?.role !== 'admin') {
        return (
            <div className={styles.accessDenied}>
                <h2>Доступ запрещен</h2>
                <p>Эта страница доступна только администраторам</p>
            </div>
        );
    }

    if (loading) {
        return <div className={styles.loading}>Загрузка истории заказов...</div>;
    }

    return (
        <div className={styles.purchaseHistory}>
            <h2 className={styles.title}>История заказов у поставщиков</h2>

            {stats && (
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <h3>Всего заказов</h3>
                        <p className={styles.statNumber}>{stats.totalPurchases || 0}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Всего товаров</h3>
                        <p className={styles.statNumber}>{stats.totalItems || 0}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Общая стоимость</h3>
                        <p className={styles.statNumber}>{stats.totalCost?.toFixed(2) || '0.00'} ₽</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Средний заказ</h3>
                        <p className={styles.statNumber}>{stats.avgOrderValue?.toFixed(2) || '0.00'} ₽</p>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.purchaseTable}>
                    <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Поставщик</th>
                        <th>Количество</th>
                        <th>Цена закупки</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Дата заказа</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {purchases.map(purchase => (
                        <tr key={purchase._id}>
                            <td>{purchase.product?.name || 'Неизвестно'}</td>
                            <td>{purchase.supplier?.name || 'Неизвестно'}</td>
                            <td>{purchase.quantity}</td>
                            <td>{purchase.purchasePrice} ₽</td>
                            <td>{(purchase.quantity * purchase.purchasePrice).toFixed(2)} ₽</td>
                            <td>
                                    <span className={`${styles.status} ${styles[purchase.status]}`}>
                                        {purchase.status}
                                    </span>
                            </td>
                            <td>{new Date(purchase.purchaseDate).toLocaleDateString('ru-RU')}</td>
                            <td>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`http://localhost:5000/api/purchases/${purchase._id}/status`, {
                                                method: 'PATCH',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ status: 'delivered' })
                                            });
                                            const data = await response.json();
                                            if (data.success) {
                                                fetchPurchases();
                                            }
                                        } catch (error) {
                                            console.error('Ошибка обновления:', error);
                                        }
                                    }}
                                    disabled={purchase.status === 'delivered'}
                                    className={styles.actionBtn}
                                >
                                    Доставлен
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.inventorySection}>
                <h3>Управление инвентарем (классовый компонент)</h3>
                <InventoryManager
                    token={token}
                    showNotification={showNotification}
                />
            </div>
        </div>
    );
}

export default PurchaseHistory;