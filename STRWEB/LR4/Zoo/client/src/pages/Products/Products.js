import React, { useContext, useEffect, useState } from 'react';
import styles from './Products.module.css';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import SupplierSelector from '../../components/SupplierSelector/SupplierSelector';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [suppliers, setSuppliers] = useState([]);

    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStock, setInStock] = useState('');
    const [category, setCategory] = useState('');
    const [animalType, setAnimalType] = useState('');

    const { user, token } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const { showSuccess, showError, showWarning, showInfo } = useNotifications();

    const [showSupplierSelector, setShowSupplierSelector] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSuppliers(data.data.suppliers || []);
                }
            });
    }, []);

    useEffect(() => {
        setLoading(true);

        const query = new URLSearchParams({
            page,
            sortBy,
            sortOrder,
            search,
            minPrice,
            maxPrice,
            inStock,
            ...(category && { category }),
            ...(animalType && { animalType })
        }).toString();

        const url = `http://localhost:5000/api/products?${query}&_=${Date.now()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data?.products || []);
                    setPagination(data.data?.pagination || null);
                } else {
                    showError(data.message || 'Ошибка загрузки данных');
                }
                setLoading(false);
            })
            .catch(err => {
                showError('Ошибка подключения к серверу');
                setLoading(false);
            });
    }, [page, sortBy, sortOrder, search, minPrice, maxPrice, inStock, category, animalType, showError]);

    const handleAddToCart = (product) => {
        const availableSuppliers = suppliers.filter(s =>
            s.products?.some(p => p.product?._id === product._id)
        );

        if (availableSuppliers.length === 0) {
            showWarning('Товар временно недоступен у поставщиков');
            return;
        }

        if (availableSuppliers.length === 1) {
            const supplier = availableSuppliers[0];
            addToCart(product, supplier._id, supplier.name, 1);
            showSuccess(`Товар "${product.name}" добавлен в корзину от ${supplier.name}!`);
        } else {
            setSelectedProduct(product);
            setShowSupplierSelector(true);
        }
    };

    const handleSupplierSelect = (supplier) => {
        if (selectedProduct) {
            addToCart(selectedProduct, supplier.id, supplier.name, 1);
            showSuccess(`Товар "${selectedProduct.name}" добавлен в корзину от ${supplier.name}!`);
            setShowSupplierSelector(false);
            setSelectedProduct(null);
        }
    };

    const handleSupplierCancel = () => {
        setShowSupplierSelector(false);
        setSelectedProduct(null);
        showInfo('Выбор поставщика отменен');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить продукт?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.filter(p => p._id !== id));
                showSuccess('Товар успешно удален');
            } else {
                showError(data.message || 'Ошибка удаления');
            }
        } catch {
            showError('Ошибка подключения к серверу');
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setMinPrice('');
        setMaxPrice('');
        setInStock('');
        setCategory('');
        setAnimalType('');
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
        showInfo('Фильтры сброшены');
    };

    if (loading) return <div className={styles.loading}>Загрузка товаров...</div>;

    return (
        <div className={styles.products}>
            <h2 className={styles.title}>Каталог товаров 🐾</h2>

            {user?.role === 'admin' && (
                <div className={styles.adminActions}>
                    <Link to="/products/create" className={styles.createBtn}>
                        + Добавить продукт
                    </Link>
                    <Link to="/purchases" className={styles.purchasesBtn}>
                        История заказов
                    </Link>
                </div>
            )}

            <div className={styles.controls}>
                <div className={styles.searchGroup}>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <input
                        type="number"
                        placeholder="Мин. цена"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Макс. цена"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                    />
                </div>

                <div className={styles.selectGroup}>
                    <select value={inStock} onChange={e => setInStock(e.target.value)}>
                        <option value="">Все по наличию</option>
                        <option value="true">В наличии</option>
                        <option value="false">Нет в наличии</option>
                    </select>

                    <select value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Все категории</option>
                        <option value="Корма">Корма</option>
                        <option value="Аксессуары">Аксессуары</option>
                        <option value="Игрушки">Игрушки</option>
                        <option value="Здоровье">Здоровье</option>
                        <option value="Гигиена">Гигиена</option>
                        <option value="Переноски">Переноски</option>
                        <option value="Одежда">Одежда</option>
                    </select>

                    <select value={animalType} onChange={e => setAnimalType(e.target.value)}>
                        <option value="">Все животные</option>
                        <option value="Собака">Собака</option>
                        <option value="Кошка">Кошка</option>
                        <option value="Птица">Птица</option>
                        <option value="Рыбка">Рыбка</option>
                        <option value="Грызун">Грызун</option>
                        <option value="Рептилия">Рептилия</option>
                        <option value="Все">Все</option>
                    </select>
                </div>

                <div className={styles.sortGroup}>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="name">По названию</option>
                        <option value="sku">По артикулу</option>
                        <option value="currentPrice">По цене</option>
                        <option value="stockQuantity">По остатку</option>
                        <option value="createdAt">По дате добавления</option>
                    </select>

                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="asc">По возрастанию</option>
                        <option value="desc">По убыванию</option>
                    </select>

                    <button onClick={handleResetFilters} className={styles.resetBtn}>
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            {pagination && (
                <div className={styles.infoBar}>
                    <p>Найдено товаров: <strong>{pagination.total}</strong></p>
                    <p>Страница: <strong>{pagination.page}</strong> из <strong>{pagination.pages}</strong></p>
                </div>
            )}

            <div className={styles.grid}>
                {products.map(product => (
                    <div key={product._id} className={styles.card}>
                        <img src={product.imageUrl} alt={product.name} className={styles.image} />
                        <h3>{product.name}</h3>
                        <p className={styles.sku}><strong>Артикул:</strong> {product.sku}</p>
                        <p><strong>Цена:</strong> {product.currentPrice} BYN / {product.unit}</p>
                        <p className={product.stockQuantity < product.minStockLevel ? styles.lowStock : styles.stock}>
                            <strong>Остаток:</strong> {product.stockQuantity} шт.
                        </p>

                        <div className={styles.actions}>
                            <Link to={`/products/${product._id}`} className={styles.detailsBtn}>
                                Подробнее →
                            </Link>

                            {user?.role === 'user' && (
                                <button
                                    className={styles.buyBtn}
                                    onClick={() => handleAddToCart(product)}
                                >
                                    В корзину
                                </button>
                            )}
                        </div>

                        {user?.role === 'admin' && (
                            <div className={styles.adminActions}>
                                <Link to={`/products/edit/${product._id}`} className={styles.editBtn}>
                                    Редактировать
                                </Link>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(product._id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {showSupplierSelector && selectedProduct && (
                    <SupplierSelector
                        product={selectedProduct}
                        suppliers={suppliers}
                        onSelect={handleSupplierSelect}
                        onCancel={handleSupplierCancel}
                    />
                )}
            </div>

            {products.length === 0 && !loading && (
                <div className={styles.noResults}>
                    <p>Товары не найдены. Попробуйте изменить параметры поиска.</p>
                </div>
            )}

            {pagination && pagination.pages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(prev => prev - 1)}
                        className={styles.pageBtn}
                    >
                        Назад
                    </button>

                    <div className={styles.pageNumbers}>
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= pagination.pages - 2) {
                                pageNum = pagination.pages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`${styles.pageBtn} ${page === pageNum ? styles.active : ''}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(prev => prev + 1)}
                        className={styles.pageBtn}
                    >
                        Вперёд
                    </button>
                </div>
            )}
        </div>
    );
}

export default Products;