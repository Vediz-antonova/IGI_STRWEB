import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './InventoryManager.module.css';

class InventoryManager extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [],
            loading: true,
            stats: null,
            lowStockProducts: [],
            currentFilter: 'all',
            sortBy: 'stockQuantity',
            sortOrder: 'asc',
            selectedProduct: null,
            editQuantity: '',
            showEditModal: false,
            updating: false
        };
    }

    componentDidMount() {
        this.fetchProducts();

        // Обновляем каждые 5 минут
        this.interval = setInterval(() => {
            this.fetchProducts();
        }, 5 * 60 * 1000);
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    async fetchProducts() {
        try {
            this.setState({ loading: true });
            const response = await fetch('http://localhost:5000/api/products?limit=100');
            const data = await response.json();

            if (data.success) {
                const products = data.data.products || [];
                this.setState({
                    products,
                    loading: false
                }, () => {
                    this.calculateStats(products);
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            this.setState({ loading: false });
        }
    }

    calculateStats(products) {
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
        const lowStock = products.filter(p => (p.stockQuantity || 0) < (p.minStockLevel || 10));
        const outOfStock = products.filter(p => (p.stockQuantity || 0) === 0);
        const inStock = products.filter(p => (p.stockQuantity || 0) > 0);

        const lowStockValue = lowStock.reduce((sum, p) => sum + ((p.currentPrice || 0) * ((p.minStockLevel || 10) - (p.stockQuantity || 0))), 0);
        const totalValue = products.reduce((sum, p) => sum + ((p.currentPrice || 0) * (p.stockQuantity || 0)), 0);

        this.setState({
            stats: {
                totalProducts,
                totalStock,
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                inStockCount: inStock.length,
                lowStockValue,
                totalValue
            },
            lowStockProducts: lowStock
        });
    }

    handleFilterChange = (newFilter) => {
        this.setState({ currentFilter: newFilter });
    }

    handleSortChange = (sortBy) => {
        this.setState(prevState => ({
            sortBy,
            sortOrder: prevState.sortBy === sortBy ?
                (prevState.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
        }));
    }

    handleEditClick = (product) => {
        this.setState({
            selectedProduct: product,
            editQuantity: (product.stockQuantity || 0).toString(),
            showEditModal: true
        });
    }

    handleQuantityChange = (e) => {
        this.setState({ editQuantity: e.target.value });
    }

    handleUpdateQuantity = async () => {
        const { selectedProduct, editQuantity } = this.state;
        const token = localStorage.getItem('token');

        if (!selectedProduct || !editQuantity) return;

        const quantity = parseInt(editQuantity);
        if (isNaN(quantity) || quantity < 0) return;

        this.setState({ updating: true });

        try {
            const response = await fetch(`http://localhost:5000/api/products/${selectedProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    stockQuantity: quantity,
                    inStock: quantity > 0
                })
            });

            const data = await response.json();

            if (data.success) {
                this.setState(prevState => ({
                    products: prevState.products.map(p =>
                        p._id === selectedProduct._id
                            ? { ...p, stockQuantity: quantity, inStock: quantity > 0 }
                            : p
                    ),
                    showEditModal: false,
                    selectedProduct: null,
                    editQuantity: '',
                    updating: false
                }), () => {
                    this.calculateStats(this.state.products);
                    alert('Количество успешно обновлено!');
                });
            } else {
                alert(data.message || 'Ошибка обновления');
                this.setState({ updating: false });
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Ошибка подключения к серверу');
            this.setState({ updating: false });
        }
    }

    handleCloseModal = () => {
        this.setState({
            showEditModal: false,
            selectedProduct: null,
            editQuantity: ''
        });
    }

    handleLowStockAlert = (product) => {
        const minStock = product.minStockLevel || 10;
        const currentStock = product.stockQuantity || 0;
        const needed = minStock - currentStock;

        alert(
            `Товар "${product.name}" требует пополнения!\n` +
            `Текущий остаток: ${currentStock} шт.\n` +
            `Минимальный уровень: ${minStock} шт.\n` +
            `Необходимо докупить: ${needed} шт.`
        );
    }

    handleRestockAll = async () => {
        const shouldProceed = window.confirm(
            'Вы уверены, что хотите автоматически пополнить все товары с низким запасом до минимального уровня?'
        );

        if (!shouldProceed) return;

        const token = localStorage.getItem('token');
        const { lowStockProducts } = this.state;

        const results = [];
        for (const product of lowStockProducts) {
            try {
                const minStock = product.minStockLevel || 10;
                const response = await fetch(`http://localhost:5000/api/products/${product._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        stockQuantity: minStock,
                        inStock: true
                    })
                });

                const data = await response.json();
                if (data.success) {
                    results.push({ product: product.name, success: true });
                } else {
                    results.push({ product: product.name, success: false, error: data.message });
                }
            } catch (error) {
                results.push({ product: product.name, success: false, error: error.message });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        setTimeout(() => {
            this.fetchProducts();
            alert(`Пополнение завершено!\nУспешно: ${successful}\nНе удалось: ${failed}`);
        }, 1000);
    }

    getFilteredProducts() {
        const { products, currentFilter, sortBy, sortOrder } = this.state;

        let filtered = [...products];

        switch (currentFilter) {
            case 'low':
                filtered = filtered.filter(p =>
                    (p.stockQuantity || 0) < (p.minStockLevel || 10) &&
                    (p.stockQuantity || 0) > 0
                );
                break;
            case 'out':
                filtered = filtered.filter(p => (p.stockQuantity || 0) === 0);
                break;
            case 'normal':
                filtered = filtered.filter(p => (p.stockQuantity || 0) >= (p.minStockLevel || 10));
                break;
            case 'all':
            default:
                break;
        }

        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'stockLevelPercentage') {
                aValue = ((a.stockQuantity || 0) / (a.minStockLevel || 10)) * 100;
                bValue = ((b.stockQuantity || 0) / (b.minStockLevel || 10)) * 100;
            }

            if (sortOrder === 'asc') {
                return (aValue || 0) > (bValue || 0) ? 1 : -1;
            } else {
                return (aValue || 0) < (bValue || 0) ? 1 : -1;
            }
        });

        return filtered;
    }

    renderStats() {
        const { stats } = this.state;
        if (!stats) return null;

        return (
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <h3>Всего товаров</h3>
                        <p className={styles.statNumber}>{stats.totalProducts}</p>
                        <p className={styles.statLabel}>в системе</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <h3>Общий остаток</h3>
                        <p className={styles.statNumber}>{stats.totalStock}</p>
                        <p className={styles.statLabel}>единиц на складе</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <h3>Низкий запас</h3>
                        <p className={styles.statNumber}>{stats.lowStockCount}</p>
                        <p className={styles.statLabel}>требуют пополнения</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <h3>Стоимость запасов</h3>
                        <p className={styles.statNumber}>{stats.totalValue.toFixed(2)}</p>
                        <p className={styles.statLabel}>BYN на складе</p>
                    </div>
                </div>
            </div>
        );
    }

    renderProductsTable() {
        const filteredProducts = this.getFilteredProducts();

        if (filteredProducts.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <p>Нет товаров, соответствующих выбранному фильтру</p>
                </div>
            );
        }

        return (
            <div className={styles.tableContainer}>
                <table className={styles.productsTable}>
                    <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Артикул</th>
                        <th>Категория</th>
                        <th
                            className={styles.sortable}
                            onClick={() => this.handleSortChange('stockQuantity')}
                        >
                            Остаток
                        </th>
                        <th>Мин. уровень</th>
                        <th>Уровень запаса</th>
                        <th>Цена</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredProducts.map(product => {
                        const minStock = product.minStockLevel || 10;
                        const currentStock = product.stockQuantity || 0;
                        const stockPercentage = (currentStock / minStock) * 100;
                        const isLowStock = currentStock < minStock;
                        const isOutOfStock = currentStock === 0;

                        let stockLevelClass = '';
                        let stockLevelText = '';

                        if (isOutOfStock) {
                            stockLevelClass = styles.outOfStock;
                            stockLevelText = 'Нет в наличии';
                        } else if (isLowStock) {
                            stockLevelClass = styles.lowStock;
                            stockLevelText = 'Низкий запас';
                        } else {
                            stockLevelClass = styles.normalStock;
                            stockLevelText = 'Норма';
                        }

                        return (
                            <tr key={product._id} className={stockLevelClass}>
                                <td>
                                    <div className={styles.productCell}>
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={styles.productImage}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                            }}
                                        />
                                        <div>
                                            <strong>{product.name}</strong>
                                            <div className={styles.animalTypes}>
                                                {product.animalType?.join(', ') || 'Не указано'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <code>{product.sku || 'Без артикула'}</code>
                                </td>
                                <td>{product.category || 'Не указана'}</td>
                                <td>
                                    <div className={styles.stockQuantity}>
                                            <span className={styles.quantityNumber}>
                                                {currentStock} шт.
                                            </span>
                                        {isLowStock && !isOutOfStock && (
                                            <span className={styles.required}>
                                                    Нужно: {minStock - currentStock} шт.
                                                </span>
                                        )}
                                    </div>
                                </td>
                                <td>{minStock} шт.</td>
                                <td>
                                    <div className={styles.stockLevel}>
                                        <div className={styles.stockBarContainer}>
                                            <div
                                                className={styles.stockBar}
                                                style={{
                                                    width: `${Math.min(stockPercentage, 100)}%`,
                                                    backgroundColor: isOutOfStock ? '#f56565' :
                                                        isLowStock ? '#ed8936' : '#48bb78'
                                                }}
                                            ></div>
                                        </div>
                                        <span className={styles.stockLevelText}>{stockLevelText}</span>
                                        <span className={styles.stockPercentage}>
                                                ({stockPercentage.toFixed(0)}%)
                                            </span>
                                    </div>
                                </td>
                                <td>{product.currentPrice || 0} BYN</td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        <button
                                            onClick={() => this.handleEditClick(product)}
                                            className={styles.editBtn}
                                        >
                                            Изменить
                                        </button>
                                        {isLowStock && !isOutOfStock && (
                                            <button
                                                onClick={() => this.handleLowStockAlert(product)}
                                                className={styles.alertBtn}
                                                title="Показать детали низкого запаса"
                                            >
                                            </button>
                                        )}
                                        <Link
                                            to={`/products/${product._id}`}
                                            className={styles.detailsBtn}
                                        >
                                            Подробнее
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        );
    }

    renderEditModal() {
        const { selectedProduct, editQuantity, showEditModal, updating } = this.state;

        if (!showEditModal || !selectedProduct) return null;

        const minStock = selectedProduct.minStockLevel || 10;
        const currentStock = selectedProduct.stockQuantity || 0;

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div className={styles.modalHeader}>
                        <h3>Изменение остатка товара</h3>
                        <button
                            onClick={this.handleCloseModal}
                            className={styles.closeBtn}
                        >
                            ×
                        </button>
                    </div>

                    <div className={styles.modalContent}>
                        <div className={styles.productInfo}>
                            <img
                                src={selectedProduct.imageUrl}
                                alt={selectedProduct.name}
                                className={styles.modalProductImage}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                                }}
                            />
                            <div>
                                <h4>{selectedProduct.name}</h4>
                                <p>Артикул: <code>{selectedProduct.sku || 'Без артикула'}</code></p>
                                <p>Категория: {selectedProduct.category || 'Не указана'}</p>
                                <p>Текущий остаток: <strong>{currentStock} шт.</strong></p>
                                <p>Минимальный уровень: {minStock} шт.</p>
                                {currentStock < minStock && (
                                    <p className={styles.warningText}>
                                        Внимание: низкий запас! Нужно докупить {minStock - currentStock} шт.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={styles.quantityInput}>
                            <label>Новое количество:</label>
                            <input
                                type="number"
                                value={editQuantity}
                                onChange={this.handleQuantityChange}
                                min="0"
                                step="1"
                                disabled={updating}
                            />
                            <small>Введите новое количество товара на складе</small>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={this.handleCloseModal}
                                className={styles.cancelModalBtn}
                                disabled={updating}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={this.handleUpdateQuantity}
                                className={styles.saveModalBtn}
                                disabled={updating}
                            >
                                {updating ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { loading, currentFilter, lowStockProducts } = this.state;

        if (loading) {
            return <div className={styles.loading}>Загрузка данных инвентаря...</div>;
        }

        return (
            <div className={styles.inventoryManager}>
                <div className={styles.header}>
                    <h2>Управление складскими запасами</h2>
                    <p>Мониторинг и управление остатками товаров на складе</p>
                </div>

                {this.renderStats()}

                <div className={styles.controls}>
                    <div className={styles.filterControls}>
                        <button
                            className={`${styles.filterBtn} ${currentFilter === 'all' ? styles.active : ''}`}
                            onClick={() => this.handleFilterChange('all')}
                        >
                            Все товары
                        </button>
                        <button
                            className={`${styles.filterBtn} ${currentFilter === 'low' ? styles.active : ''}`}
                            onClick={() => this.handleFilterChange('low')}
                        >
                            Низкий запас
                        </button>
                        <button
                            className={`${styles.filterBtn} ${currentFilter === 'out' ? styles.active : ''}`}
                            onClick={() => this.handleFilterChange('out')}
                        >
                            Нет в наличии
                        </button>
                        <button
                            className={`${styles.filterBtn} ${currentFilter === 'normal' ? styles.active : ''}`}
                            onClick={() => this.handleFilterChange('normal')}
                        >
                            Нормальный запас
                        </button>
                    </div>

                    <div className={styles.actionControls}>
                        {lowStockProducts.length > 0 && (
                            <button
                                onClick={this.handleRestockAll}
                                className={styles.restockAllBtn}
                            >
                                Пополнить все ({lowStockProducts.length})
                            </button>
                        )}

                        <button
                            onClick={() => this.fetchProducts()}
                            className={styles.refreshBtn}
                        >
                            Обновить данные
                        </button>
                    </div>
                </div>

                {this.renderProductsTable()}

                {this.renderEditModal()}
            </div>
        );
    }
}

export default InventoryManager;