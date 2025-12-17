import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const { showSuccess, showError, showWarning, showInfo } = useNotifications();

    const [showSupplierSelector, setShowSupplierSelector] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [actionType, setActionType] = useState('');

    useEffect(() => {
        const url = `http://localhost:5000/api/products/${id}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                setProduct(data.data?.product || null);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                showError('Ошибка загрузки продукта');
            });

        fetch('http://localhost:5000/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSuppliers(data.data.suppliers || []);
                }
            })
            .catch(() => {
                showWarning('Не удалось загрузить поставщиков');
            });
    }, [id, showError, showWarning]);

    const handleAddToCart = () => {
        if (!product) return;

        setSelectedProduct(product);
        setActionType('addToCart');
        setShowSupplierSelector(true);
    };

    const handleBuyNow = () => {
        if (!user) {
            showError('Для заказа необходимо войти в систему');
            return;
        }

        if (!product) return;

        setSelectedProduct(product);
        setActionType('buyNow');
        setShowSupplierSelector(true);
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

            const supplierResponse = await fetch(`http://localhost:5000/api/suppliers/${supplier.id}`);
            const supplierData = await supplierResponse.json();

            if (!supplierData.success || !supplierData.data?.supplier) {
                showError('Не удалось получить информацию о поставщике');
                resetSupplierSelector();
                return;
            }

            const supplierDetails = supplierData.data.supplier;
            const supplierProduct = supplierDetails.products?.find(
                p => p.product?._id === product._id
            );

            if (!supplierProduct) {
                showError('Товар не найден у выбранного поставщика');
                resetSupplierSelector();
                return;
            }

            if (supplierProduct.stockQuantity < 1) {
                showError('Товара нет в наличии у выбранного поставщика');
                resetSupplierSelector();
                return;
            }

            const purchaseData = {
                product: product._id,
                supplier: supplier.id,
                quantity: 1,
                purchasePrice: product.currentPrice,
                status: 'ordered',
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 дней
            };

            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(purchaseData)
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Заказ успешно создан! Ожидайте доставки.');
                resetSupplierSelector();
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
                    <p><strong>Цена:</strong> {product.currentPrice} ₽ / {product.unit}</p>
                    <p><strong>Остаток:</strong> {product.stockQuantity} шт.</p>
                    <p><strong>Минимальный уровень склада:</strong> {product.minStockLevel}</p>
                    <p><strong>В наличии:</strong> {product.inStock ? 'Да' : 'Нет'}</p>

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
                                    disabled={!product.inStock}
                                >
                                    В корзину
                                </button>
                                <button
                                    className={styles.orderNowBtn}
                                    onClick={handleBuyNow}
                                    disabled={!product.inStock}
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
                        suppliers={suppliers}
                        onSelect={handleSupplierSelect}
                        onCancel={handleSupplierCancel}
                    />
                )}
            </div>
        </div>
    );
}

export default ProductDetails;