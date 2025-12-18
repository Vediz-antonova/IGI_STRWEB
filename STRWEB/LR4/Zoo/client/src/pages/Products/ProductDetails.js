import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './ProductDetails.module.css';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import SupplierSelector from '../../components/SupplierSelector/SupplierSelector';

const formatUTC = (dateString) => {
    return new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date(dateString));
};

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [suppliersMap, setSuppliersMap] = useState({});
    const { user, token } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const { showSuccess, showError, showWarning, showInfo } = useNotifications();

    const [showSupplierSelector, setShowSupplierSelector] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [actionType, setActionType] = useState('');

    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                let allSuppliers = [];
                let currentPage = 1;
                let hasMore = true;

                while (hasMore) {
                    const res = await fetch(`http://localhost:5000/api/suppliers?page=${currentPage}&limit=50`);
                    const data = await res.json();

                    if (data.success && data.data?.suppliers) {
                        allSuppliers = [...allSuppliers, ...data.data.suppliers];
                        hasMore = currentPage < (data.data.pagination?.pages || 1);
                        currentPage++;
                    } else {
                        hasMore = false;
                    }
                }

                console.log('ProductDetails: Всего поставщиков загружено:', allSuppliers.length);

                const map = {};
                allSuppliers.forEach(supplier => {
                    if (supplier.products && Array.isArray(supplier.products)) {
                        supplier.products.forEach(prod => {
                            let productId;

                            if (prod.product && prod.product._id) {
                                productId = prod.product._id;
                            } else if (typeof prod.product === 'string') {
                                productId = prod.product;
                            }

                            if (productId) {
                                if (!map[productId]) {
                                    map[productId] = [];
                                }

                                map[productId].push({
                                    id: supplier._id,
                                    name: supplier.name,
                                    address: supplier.address,
                                    phone: supplier.phone,
                                    email: supplier.email,
                                    rating: supplier.rating || 0,
                                    price: prod.price || 0,
                                    stockQuantity: prod.stockQuantity || 0,
                                    sku: prod.sku || '',
                                    deliveryTime: '1-3 дня',
                                    isAvailable: (prod.stockQuantity || 0) > 0
                                });
                            }
                        });
                    }
                });

                console.log('ProductDetails: Карта поставщиков создана:', Object.keys(map).length, 'товаров с поставщиками');
                setSuppliersMap(map);
            } catch (error) {
                console.error('ProductDetails: Error loading suppliers:', error);
                showError('Ошибка загрузки поставщиков');
            }
        };

        loadSuppliers();
    }, [showError]);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                const url = `http://localhost:5000/api/products/${id}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.success) {
                    const productData = data.data?.product;
                    setProduct(productData);

                    if (productData) {
                        const suppliers = suppliersMap[productData._id] || [];
                        console.log(`ProductDetails: Товар ${productData.name}:`, {
                            suppliersCount: suppliers.length,
                            suppliers: suppliers.map(s => ({ id: s.id, name: s.name, price: s.price }))
                        });
                    }
                } else {
                    showError(data.message || 'Ошибка загрузки продукта');
                }
            } catch (error) {
                console.error('ProductDetails: Error loading product:', error);
                showError('Ошибка подключения к серверу');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, showError, suppliersMap]);

    const handleAddToCart = () => {
        if (!product) return;

        const availableSuppliers = suppliersMap[product._id] || [];

        console.log('ProductDetails: Добавление в корзину:', {
            product: product.name,
            productId: product._id,
            availableSuppliers: availableSuppliers.length,
            suppliers: availableSuppliers.map(s => s.name)
        });

        if (availableSuppliers.length === 0) {
            showWarning('Товар временно недоступен у поставщиков');
            return;
        }

        if (availableSuppliers.length === 1) {
            const supplier = availableSuppliers[0];
            addToCart(product, supplier.id, supplier.name, 1);
            showSuccess(`Товар "${product.name}" добавлен в корзину от ${supplier.name}!`);
        } else {
            setSelectedProduct(product);
            setActionType('addToCart');
            setShowSupplierSelector(true);
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            showError('Для заказа необходимо войти в систему');
            navigate('/login');
            return;
        }

        if (!product) return;

        const availableSuppliers = suppliersMap[product._id] || [];

        if (availableSuppliers.length === 0) {
            showWarning('Товар временно недоступен у поставщиков');
            return;
        }

        if (availableSuppliers.length === 1) {
            createOrder(product, availableSuppliers[0]);
        } else {
            setSelectedProduct(product);
            setActionType('buyNow');
            setShowSupplierSelector(true);
        }
    };

    const handleSupplierSelect = (supplier) => {
        if (!selectedProduct || !actionType) return;

        if (actionType === 'addToCart') {
            addToCart(selectedProduct, supplier.id, supplier.name, 1);
            showSuccess(`Товар "${selectedProduct.name}" добавлен в корзину от ${supplier.name}!`);
            resetSupplierSelector();
        } else if (actionType === 'buyNow') {
            createOrder(selectedProduct, supplier);
        }
    };

    const createOrder = async (product, supplier) => {
        try {
            showInfo('Проверяем наличие товара...');

            const orderData = {
                supplier: supplier.id,
                purchases: [{
                    productId: product._id,
                    quantity: 1,
                    price: supplier.price || product.currentPrice
                }],
                deliveryAddress: {
                    street: "Основной склад",
                    city: "Минск",
                    country: "Беларусь"
                },
                notes: `Прямой заказ товара ${product.name}`
            };

            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Заказ успешно создан! Ожидайте доставки.');
                resetSupplierSelector();
                navigate('/orders');
            } else {
                showError(data.message || 'Ошибка при создании заказа');
                resetSupplierSelector();
            }
        } catch (error) {
            showError(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
            resetSupplierSelector();
        }
    };

    const handleSupplierCancel = () => {
        resetSupplierSelector();
        showInfo('Выбор поставщика отменен');
    };

    const resetSupplierSelector = () => {
        setShowSupplierSelector(false);
        setSelectedProduct(null);
        setActionType('');
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка информации...</div>;
    }

    if (!product) {
        return <div className={styles.error}>Продукт не найден</div>;
    }

    const availableSuppliers = suppliersMap[product._id] || [];
    const minSupplierPrice = availableSuppliers.length > 0 ?
        Math.min(...availableSuppliers.map(s => s.price || product.currentPrice)) :
        product.currentPrice;

    return (
        <div className={styles.details}>
            <Link to="/products" className={styles.back}>← Назад к каталогу</Link>

            <div className={styles.card}>
                <img src={product.imageUrl} alt={product.name} className={styles.image} />
                <div className={styles.info}>
                    <h2>{product.name}</h2>
                    <p><strong>Артикул:</strong> {product.sku}</p>
                    <p><strong>Категория:</strong> {product.category}</p>
                    <p><strong>Для животных:</strong> {product.animalType?.join(', ')}</p>
                    <p><strong>Описание:</strong> {product.description}</p>
                    <p><strong>Наша цена:</strong> {product.currentPrice} BYN / {product.unit}</p>
                    <p><strong>Остаток:</strong> {product.stockQuantity} шт.</p>
                    <p><strong>Минимальный уровень склада:</strong> {product.minStockLevel}</p>
                    <p><strong>В наличии:</strong> {product.inStock ? 'Да' : 'Нет'}</p>

                    <p><strong>Поставщиков:</strong> {availableSuppliers.length}</p>
                    {availableSuppliers.length > 0 && (
                        <p><strong>Лучшая цена поставщика:</strong> от {minSupplierPrice} BYN</p>
                    )}

                    <p><strong>Добавлен (UTC):</strong> {formatUTC(product.createdAtUTC)}</p>
                    {user && (
                        <p><strong>Добавлен ({user.timezone}):</strong> {product.createdAtLocal}</p>
                    )}
                    <p><strong>Обновлен (UTC):</strong> {formatUTC(product.updatedAtUTC)}</p>
                    {user && (
                        <p><strong>Обновлен ({user.timezone}):</strong> {product.updatedAtLocal}</p>
                    )}

                    <div className={styles.actions}>
                        {user?.role === 'user' && (
                            <>
                                <button
                                    className={styles.buyBtn}
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock || availableSuppliers.length === 0}
                                    title={availableSuppliers.length === 0 ? 'Нет доступных поставщиков' : 'Добавить в корзину'}
                                >
                                    {availableSuppliers.length === 0 ? 'Нет поставщиков' : 'В корзину'}
                                </button>
                                <button
                                    className={styles.orderNowBtn}
                                    onClick={handleBuyNow}
                                    disabled={!product.inStock || availableSuppliers.length === 0}
                                    title={availableSuppliers.length === 0 ? 'Нет доступных поставщиков' : 'Заказать сейчас'}
                                >
                                    Заказать сейчас
                                </button>
                            </>
                        )}

                        {user?.role === 'admin' && (
                            <Link
                                to={`/products/edit/${product._id}`}
                                className={styles.editBtn}
                            >
                                Редактировать товар
                            </Link>
                        )}
                    </div>
                </div>

                {showSupplierSelector && selectedProduct && (
                    <SupplierSelector
                        product={selectedProduct}
                        suppliers={suppliersMap[selectedProduct._id] || []}
                        onSelect={handleSupplierSelect}
                        onCancel={handleSupplierCancel}
                    />
                )}
            </div>
        </div>
    );
}

export default ProductDetails;