import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import styles from './CartPage.module.css';

function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useContext(CartContext);
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);

    const groupedBySupplier = cartItems.reduce((groups, item) => {
        if (!groups[item.supplierId]) {
            groups[item.supplierId] = {
                supplierId: item.supplierId,
                items: [],
                total: 0
            };
        }
        groups[item.supplierId].items.push(item);
        groups[item.supplierId].total += item.price * item.quantity;
        return groups;
    }, {});

    const handlePlaceOrder = async (supplierId) => {
        if (!user) {
            alert('Для оформления заказа необходимо войти в систему');
            navigate('/login');
            return;
        }

        setIsProcessing(true);
        setOrderStatus({ type: 'info', message: 'Начинаем обработку заказа...' });

        try {
            const supplierItems = cartItems.filter(item => item.supplierId === supplierId);

            const orderResult = await Promise.all(
                supplierItems.map(async (item) => {
                    const availabilityCheck = await checkAvailability(item.productId, supplierId, item.quantity);
                    if (!availabilityCheck.available) {
                        throw new Error(`Недостаточно товара: ${item.name}`);
                    }

                    const purchaseData = {
                        product: item.productId,
                        supplier: supplierId,
                        quantity: item.quantity,
                        purchasePrice: item.price,
                        status: 'ordered'
                    };

                    const response = await fetch('http://localhost:5000/api/purchases', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(purchaseData)
                    });

                    const data = await response.json();

                    if (!data.success) {
                        throw new Error(data.message || 'Ошибка при создании заказа');
                    }

                    return data.data.purchase;
                })
            );

            cartItems
                .filter(item => item.supplierId === supplierId)
                .forEach(item => removeFromCart(item.productId, item.supplierId));

            setOrderStatus({
                type: 'success',
                message: `Заказ успешно оформлен! Создано ${orderResult.length} позиций.`
            });

            setTimeout(() => {
                setOrderStatus(null);
                navigate('/products');
            }, 3000);

        } catch (error) {
            setOrderStatus({ type: 'error', message: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const checkAvailability = async (productId, supplierId, quantity) => {
        try {
            const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`);
            const data = await response.json();

            if (data.success) {
                const supplierProduct = data.data.supplier.products.find(
                    p => p.product._id === productId
                );

                return {
                    available: supplierProduct && supplierProduct.stockQuantity >= quantity,
                    stockQuantity: supplierProduct?.stockQuantity || 0
                };
            }
            return { available: false, stockQuantity: 0 };
        } catch (error) {
            return { available: false, stockQuantity: 0 };
        }
    };

    const handlePlaceAllOrders = () => {
        const xhr = new XMLHttpRequest();
        const suppliers = Object.keys(groupedBySupplier);
        let completed = 0;

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setOrderStatus({
                    type: 'info',
                    message: `Отправка данных: ${percent}%`
                });
            }
        });

        setIsProcessing(true);

        suppliers.forEach((supplierId, index) => {
            setTimeout(() => {
                handlePlaceOrder(supplierId);
                completed++;

                if (completed === suppliers.length) {
                    setTimeout(() => {
                        setOrderStatus({
                            type: 'success',
                            message: 'Все заказы успешно обработаны!'
                        });
                        setIsProcessing(false);
                    }, 1000);
                }
            }, index * 2000);
        });
    };

    if (cartItems.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h2>Корзина пуста</h2>
                <p>Добавьте товары из каталога</p>
                <button onClick={() => navigate('/products')}>Перейти к товарам</button>
            </div>
        );
    }

    return (
        <div className={styles.cartPage}>
            <h2 className={styles.title}>Корзина заказов 🛒</h2>

            {orderStatus && (
                <div className={`${styles.notification} ${styles[orderStatus.type]}`}>
                    {orderStatus.message}
                </div>
            )}

            <div className={styles.summary}>
                <p>Товаров: <strong>{totalItems}</strong> шт.</p>
                <p>Общая стоимость: <strong>{totalPrice.toFixed(2)}</strong> ₽</p>
                <p>Поставщиков: <strong>{Object.keys(groupedBySupplier).length}</strong></p>
                <button
                    onClick={handlePlaceAllOrders}
                    disabled={isProcessing || !user}
                    className={styles.orderAllBtn}
                >
                    {isProcessing ? 'Обработка...' : 'Заказать у всех поставщиков'}
                </button>
                <button onClick={clearCart} className={styles.clearBtn}>
                    Очистить корзину
                </button>
            </div>

            {Object.entries(groupedBySupplier).map(([supplierId, group]) => (
                <div key={supplierId} className={styles.supplierSection}>
                    <h3>Поставщик ID: {supplierId}</h3>
                    <p className={styles.supplierTotal}>
                        Сумма заказа: <strong>{group.total.toFixed(2)}</strong> ₽
                    </p>

                    <div className={styles.itemsGrid}>
                        {group.items.map((item, index) => (
                            <div key={`${item.productId}-${index}`} className={styles.cartItem}>
                                <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                                <div className={styles.itemInfo}>
                                    <h4>{item.name}</h4>
                                    <p>Артикул: {item.sku}</p>
                                    <p>Цена: {item.price} ₽ / {item.unit}</p>

                                    <div className={styles.quantityControls}>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.supplierId, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            −
                                        </button>
                                        <span>{item.quantity} шт.</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.supplierId, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <p className={styles.itemTotal}>
                                        Сумма: {(item.price * item.quantity).toFixed(2)} ₽
                                    </p>

                                    <button
                                        onClick={() => removeFromCart(item.productId, item.supplierId)}
                                        className={styles.removeBtn}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePlaceOrder(supplierId)}
                        disabled={isProcessing || !user}
                        className={styles.orderBtn}
                    >
                        {isProcessing ? 'Обработка...' : `Заказать у этого поставщика`}
                    </button>
                </div>
            ))}
        </div>
    );
}

export default CartPage;