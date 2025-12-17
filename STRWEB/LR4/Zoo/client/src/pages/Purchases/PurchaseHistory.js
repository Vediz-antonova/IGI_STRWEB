import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
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
            filterStatus: ''
        };
    }

    componentDidMount() {
        this.fetchInventory();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.supplierId !== this.props.supplierId) {
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
                ...(this.props.supplierId && { supplierId: this.props.supplierId })
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

    handleSort = (field) => {
        this.setState(prev => ({
            sortField: field,
            sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }), this.fetchInventory);
    };

    handleStatusFilter = (status) => {
        this.setState({ filterStatus: status }, this.fetchInventory);
    };

    handleInventoryUpdate = async (purchaseId, updates) => {
        try {
            const { token } = this.props;
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
                return { success: true, message: 'Обновлено успешно' };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    handleDelete = async (purchaseId) => {
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
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка удаления');
        }
    };

    render() {
        const { inventory, loading, error, sortField, sortOrder } = this.state;

        if (loading) return <div className={styles.loading}>Загрузка инвентаря...</div>;
        if (error) return <div className={styles.error}>{error}</div>;

        return (
            <div className={styles.inventoryManager}>
                <div className={styles.controls}>
                    <button onClick={() => this.handleSort('purchaseDate')}>
                        Дата {sortField === 'purchaseDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => this.handleSort('quantity')}>
                        Количество {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <select onChange={(e) => this.handleStatusFilter(e.target.value)}>
                        <option value="">Все статусы</option>
                        <option value="ordered">Заказан</option>
                        <option value="pending">В обработке</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                    </select>
                </div>

                <div className={styles.inventoryGrid}>
                    {inventory.map(purchase => (
                        <div key={purchase._id} className={styles.inventoryCard}>
                            <h4>{purchase.product?.name || 'Неизвестный товар'}</h4>
                            <p>Поставщик: {purchase.supplier?.name || 'Неизвестен'}</p>
                            <p>Количество: {purchase.quantity} шт.</p>
                            <p>Цена: {purchase.purchasePrice} ₽</p>
                            <p>Статус: <span className={styles[purchase.status]}>{purchase.status}</span></p>
                            <p>Сумма: {(purchase.quantity * purchase.purchasePrice).toFixed(2)} ₽</p>
                            <p>Дата: {new Date(purchase.purchaseDate).toLocaleDateString('ru-RU')}</p>

                            <div className={styles.inventoryActions}>
                                <button
                                    onClick={() => this.handleInventoryUpdate(purchase._id, { status: 'delivered' })}
                                    disabled={purchase.status === 'delivered'}
                                >
                                    Отметить доставленным
                                </button>
                                <button
                                    onClick={() => this.handleDelete(purchase._id)}
                                    className={styles.deleteBtn}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

function PurchaseHistory() {
    const { user, token } = useContext(AuthContext);
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

    if (user?.role !== 'admin') {
        return (
            <div className={styles.accessDenied}>
                <h2>⚠️ Доступ запрещен</h2>
                <p>Эта страница доступна только администраторам</p>
            </div>
        );
    }

    if (loading) {
        return <div className={styles.loading}>Загрузка истории заказов...</div>;
    }

    return (
        <div className={styles.purchaseHistory}>
            <h2 className={styles.title}>📊 История заказов у поставщиков</h2>

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
                <InventoryManager token={token} />
            </div>
        </div>
    );
}

export default PurchaseHistory;