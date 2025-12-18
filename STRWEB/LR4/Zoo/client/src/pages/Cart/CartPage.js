import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './CartPage.module.css';

function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems, groupedBySupplier, createOrderFromCart } = useContext(CartContext);
    const { user, token } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingSupplier, setProcessingSupplier] = useState(null);

    const handlePlaceOrder = async (supplierId) => {
        if (!user) {
            showError('Для оформления заказа необходимо войти в систему');
            navigate('/login');
            return;
        }

        if (!token) {
            showError('Ошибка авторизации. Пожалуйста, войдите снова.');
            return;
        }

        setIsProcessing(true);
        setProcessingSupplier(supplierId);
        showInfo('Создаем заказ...');

        try {
            const result = await createOrderFromCart(supplierId, cartItems, token, user);

            if (result.success) {
                showSuccess(`Заказ успешно создан! Номер заказа: ${result.order.orderNumber}`);
            } else {
                showError(result.message || 'Ошибка при создании заказа');
            }
        } catch (error) {
            showError('Ошибка при обработке заказа');
            console.error('Order creation error:', error);
        } finally {
            setIsProcessing(false);
            setProcessingSupplier(null);
        }
    };

    const handlePlaceAllOrders = async () => {
        if (!user) {
            showError('Для оформления заказа необходимо войти в систему');
            navigate('/login');
            return;
        }

        if (!token) {
            showError('Ошибка авторизации. Пожалуйста, войдите снова.');
            return;
        }

        setIsProcessing(true);
        showInfo(`Создаем заказы у ${Object.keys(groupedBySupplier).length} поставщиков...`);

        const results = [];
        const suppliers = Object.keys(groupedBySupplier);

        for (const supplierId of suppliers) {
            showInfo(`Обрабатываем поставщика: ${groupedBySupplier[supplierId].supplierName}`);

            try {
                const result = await createOrderFromCart(supplierId, cartItems, token, user);
                results.push({ supplierId, success: result.success, order: result.order });
            } catch (error) {
                results.push({ supplierId, success: false, error: error.message });
            }
        }

        const successfulOrders = results.filter(r => r.success);
        const failedOrders = results.filter(r => !r.success);

        if (successfulOrders.length > 0) {
            showSuccess(`Успешно создано ${successfulOrders.length} заказов`);
        }

        if (failedOrders.length > 0) {
            showError(`Не удалось создать ${failedOrders.length} заказов`);
        }

        setIsProcessing(false);
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
                        disabled={isProcessing}
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
                                            disabled={item.quantity <= 1 || isProcessing}
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
                                            disabled={isProcessing}
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
                                        disabled={isProcessing}
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
                            disabled={isProcessing || !user || processingSupplier === supplierId}
                            className={styles.orderBtn}
                        >
                            {processingSupplier === supplierId ? 'Обработка...' : `Заказать у ${group.supplierName}`}
                        </button>

                        <button
                            onClick={() => {
                                navigate(`/supplier-dashboard/${supplierId}`);
                            }}
                            className={styles.dashboardBtn}
                            disabled={isProcessing}
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