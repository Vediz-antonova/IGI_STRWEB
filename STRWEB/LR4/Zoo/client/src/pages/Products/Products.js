import React, { useEffect, useState, useContext } from 'react';
import styles from './Products.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function Products() {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();

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

    useEffect(() => {
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
            .then(res => res.json())
            .then(data => {
                const productsArray = data.data?.products || [];
                setProducts(productsArray);
                setPagination(data.data?.pagination || null);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [page, sortBy, sortOrder, search, minPrice, maxPrice, inStock]);

    const handleDelete = async (id) => {
        if (!token) return;
        try {
            await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.filter(p => p._id !== id));
        } catch (err) {
            console.error('Ошибка удаления товара', err);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка товаров...</div>;
    }

    return (
        <div className={styles.products}>
            <h2 className={styles.title}>Каталог товаров 🐾</h2>

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

            {user?.role === 'admin' && (
                <div className={styles.adminControls}>
                    <button onClick={() => navigate('/products/create')}>
                        + Добавить товар
                    </button>
                </div>
            )}

            <div className={styles.grid}>
                {products.map(product => (
                    <div key={product._id} className={styles.card}>
                        <img src={product.imageUrl} alt={product.name} className={styles.image} />
                        <h3>{product.name}</h3>
                        <p><strong>Цена:</strong> {product.currentPrice} ₽ / {product.unit}</p>
                        <p><strong>Остаток:</strong> {product.stockQuantity} шт.</p>
                        <Link to={`/products/${product._id}`} className={styles.detailsLink}>
                            Подробнее →
                        </Link>

                        {user?.role === 'admin' && (
                            <div className={styles.actions}>
                                <button onClick={() => navigate(`/products/edit/${product._id}`)}>
                                    Редактировать
                                </button>
                                <button onClick={() => handleDelete(product._id)}>
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