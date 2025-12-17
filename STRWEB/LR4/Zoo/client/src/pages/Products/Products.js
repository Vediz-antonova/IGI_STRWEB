import React, { useContext, useEffect, useState } from 'react';
import styles from './Products.module.css';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStock, setInStock] = useState('');
    const [error, setError] = useState('');

    const { user } = useContext(AuthContext);
    const { token } = useContext(AuthContext);

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
            } else {
                alert(data.message || 'Ошибка удаления');
            }
        } catch {
            alert('Ошибка подключения к серверу');
        }
    };

    useEffect(() => {
        setLoading(true);
        setError('');

        const query = new URLSearchParams({
            page,
            sortBy,
            sortOrder,
            search,
            minPrice,
            maxPrice,
            inStock
        }).toString();

        const url = `http://localhost:5000/api/products?${query}&_=${Date.now()}`;

        fetch(url)
            .then(res => {
                return res.json();
            })
            .then(data => {
                const productsArray = data.data?.products || [];
                setProducts(productsArray);
                setPagination(data.data?.pagination || null);
                setLoading(false);
            })
            .catch(err => {
                setError('Ошибка загрузки данных');
                setLoading(false);
            });
    }, [page, sortBy, sortOrder, search, minPrice, maxPrice, inStock]);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.products}>
            <h2 className={styles.title}>Каталог товаров 🐾</h2>

            {user?.role === 'admin' && (
                <div className={styles.actions}>
                    <Link to="/products/create" className={styles.createBtn}>
                        + Добавить продукт
                    </Link>
                </div>
            )}

            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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
                <select value={inStock} onChange={e => setInStock(e.target.value)}>
                    <option value="">Все</option>
                    <option value="true">В наличии</option>
                    <option value="false">Нет в наличии</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="name">Название</option>
                    <option value="sku">Артикул</option>
                    <option value="currentPrice">Цена</option>
                    <option value="createdAt">Дата добавления</option>
                </select>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                </select>
            </div>

            <div className={styles.grid}>
                {products.map(product => (
                    <div key={product._id} className={styles.card}>
                        <img src={product.imageUrl} alt={product.name} className={styles.image} />
                        <h3>{product.name}</h3>
                        <p><strong>Цена:</strong> {product.currentPrice} ₽ / {product.unit}</p>
                        <p><strong>Остаток:</strong> {product.stockQuantity} шт.</p>
                        <Link to={`/products/${product._id}`}>
                            Подробнее →
                        </Link>

                        {user?.role === 'admin' && (
                            <div className={styles.cardActions}>
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
            </div>

            {pagination && (
                <div className={styles.pagination}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(prev => prev - 1)}
                    >
                        ◀ Назад
                    </button>
                    <span>
            Страница {pagination.page} из {pagination.pages}
          </span>
                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(prev => prev + 1)}
                    >
                        Вперёд ▶
                    </button>
                </div>
            )}
        </div>
    );
}

export default Products;