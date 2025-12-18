import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './CartPage.module.css';

function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useContext(CartContext);
    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);

    const groupedBySupplier = cartItems.reduce((groups, item) => {
        const key = item.supplierId;
        if (!groups[key]) {
            groups[key] = {
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                items: [],
                total: 0
            };
        }
        groups[key].items.push(item);
        groups[key].total += item.price * item.quantity;
        return groups;
    }, {});

    const handlePlaceOrder = async (supplierId) => {
        if (!user) {
            showError('Для оформления заказа необходимо войти в систему');
            navigate('/login');
            return;
        }

        setIsProcessing(true);
        showInfo('Проверяем наличие товаров...');

        try {
            const supplierItems = cartItems.filter(item => item.supplierId === supplierId);

            for (const item of supplierItems) {
                const response = await fetch(`http://localhost:5000/api/suppliers/${item.supplierId}`);
                const data = await response.json();

                if (data.success) {
                    const supplierProduct = data.data.supplier.products?.find(
                        p => p.product?._id === item.productId
                    );

                    if (!supplierProduct || supplierProduct.stockQuantity < item.quantity) {
                        throw new Error(`Товар "${item.name}" недоступен в нужном количестве`);
                    }
                }
            }

            const orderItems = supplierItems.map(item => ({
                productId: item.productId,
                supplierId: item.supplierId,
                quantity: item.quantity,
                price: item.price
            }));

            const response = await fetch('http://localhost:5000/api/purchases/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: orderItems })
            });

            const data = await response.json();

            if (data.success) {
                supplierItems.forEach(item =>
                    removeFromCart(item.productId, item.supplierId)
                );

                showSuccess(`Заказ успешно создан! Обработано ${data.data.created} позиций`);

                if (data.data.errors && data.data.errors.length > 0) {
                    data.data.errors.forEach(error => {
                        showError(`${error.productId}: ${error.error}`);
                    });
                }
            } else {
                showError(data.message || 'Ошибка при создании заказа');
            }

        } catch (error) {
            showError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePlaceAllOrders = () => {
        const suppliers = Object.keys(groupedBySupplier);

        setIsProcessing(true);
        showInfo(`Начинаем обработку заказов у ${suppliers.length} поставщиков...`);

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('data', JSON.stringify({
            items: cartItems.map(item => ({
                productId: item.productId,
                supplierId: item.supplierId,
                quantity: item.quantity,
                price: item.price
            }))
        }));

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                showInfo(`Отправка данных: ${percent}%`);
            }
        });

        xhr.open('POST', 'http://localhost:5000/api/purchases/bulk');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    clearCart();
                    showSuccess(`Все заказы успешно созданы! Обработано: ${data.data.created}`);

                    if (data.data.errors && data.data.errors.length > 0) {
                        data.data.errors.forEach(error => {
                            showError(`Ошибка: ${error.error}`);
                        });
                    }
                } else {
                    showError(data.message);
                }
            } else {
                showError('Ошибка сервера');
            }
            setIsProcessing(false);
        };

        xhr.onerror = () => {
            showError('Ошибка сети');
            setIsProcessing(false);
        };

        xhr.send(formData);
    };

    if (cartItems.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h2>Корзина пуста</h2>
                <p>Добавьте товары из каталога</p>
                <button
                    onClick={() => navigate('/products')}
                    className={styles.shopButton}
                >
                    Перейти к товарам
                </button>
            </div>
        );
    }

    return (
        <div className={styles.cartPage}>
            <h2 className={styles.title}>Корзина заказов</h2>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span>Товаров:</span>
                    <strong>{totalItems} шт.</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Общая стоимость:</span>
                    <strong>{totalPrice.toFixed(2)} ₽</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Поставщиков:</span>
                    <strong>{Object.keys(groupedBySupplier).length}</strong>
                </div>

                <div className={styles.summaryActions}>
                    <button
                        onClick={handlePlaceAllOrders}
                        disabled={isProcessing || !user}
                        className={styles.orderAllBtn}
                    >
                        {isProcessing ? 'Обработка...' : 'Заказать у всех поставщиков'}
                    </button>
                    <button
                        onClick={clearCart}
                        className={styles.clearBtn}
                    >
                        Очистить корзину
                    </button>
                </div>
            </div>

            {Object.entries(groupedBySupplier).map(([supplierId, group]) => (
                <div key={supplierId} className={styles.supplierSection}>
                    <div className={styles.supplierHeader}>
                        <h3>Поставщик: {group.supplierName}</h3>
                        <div className={styles.supplierTotal}>
                            Сумма заказа: <strong>{group.total.toFixed(2)} ₽</strong>
                        </div>
                    </div>

                    <div className={styles.itemsGrid}>
                        {group.items.map((item) => (
                            <div key={`${item.productId}-${item.supplierId}`} className={styles.cartItem}>
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className={styles.itemImage}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                                    }}
                                />

                                <div className={styles.itemInfo}>
                                    <h4>{item.name}</h4>
                                    <p className={styles.sku}>Артикул: {item.sku}</p>
                                    <p className={styles.price}>
                                        Цена: {item.price} ₽ / {item.unit}
                                    </p>

                                    <div className={styles.quantityControls}>
                                        <button
                                            onClick={() => updateQuantity(
                                                item.productId,
                                                item.supplierId,
                                                item.quantity - 1
                                            )}
                                            disabled={item.quantity <= 1}
                                        >
                                            −
                                        </button>
                                        <span className={styles.quantityValue}>{item.quantity} шт.</span>
                                        <button
                                            onClick={() => updateQuantity(
                                                item.productId,
                                                item.supplierId,
                                                item.quantity + 1
                                            )}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className={styles.itemTotal}>
                                        Сумма: <strong>{(item.price * item.quantity).toFixed(2)} ₽</strong>
                                    </div>

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

                    <div className={styles.supplierActions}>
                        <button
                            onClick={() => handlePlaceOrder(supplierId)}
                            disabled={isProcessing || !user}
                            className={styles.orderBtn}
                        >
                            {isProcessing ? 'Обработка...' : `Заказать у ${group.supplierName}`}
                        </button>

                        <button
                            onClick={() => {
                                navigate(`/supplier-dashboard/${supplierId}`);
                            }}
                            className={styles.dashboardBtn}
                        >
                            Дашборд поставщика
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default CartPage;