import React, { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Сохраняем корзину в localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Добавление товара в корзину с выбором поставщика
    const addToCart = (product, supplierId, supplierName, quantity = 1) => {
        setCartItems(prev => {
            const existing = prev.find(item =>
                item.productId === product._id && item.supplierId === supplierId
            );

            if (existing) {
                return prev.map(item =>
                    item.productId === product._id && item.supplierId === supplierId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prev, {
                productId: product._id,
                supplierId,
                supplierName,
                name: product.name,
                sku: product.sku,
                price: product.currentPrice,
                unit: product.unit,
                quantity,
                imageUrl: product.imageUrl,
                addedAt: new Date().toISOString()
            }];
        });
    };

    // Удаление товара из корзины
    const removeFromCart = (productId, supplierId) => {
        setCartItems(prev =>
            prev.filter(item => !(item.productId === productId && item.supplierId === supplierId))
        );
    };

    // Изменение количества
    const updateQuantity = (productId, supplierId, quantity) => {
        if (quantity < 1) {
            removeFromCart(productId, supplierId);
            return;
        }

        setCartItems(prev =>
            prev.map(item =>
                item.productId === productId && item.supplierId === supplierId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    // Обновление поставщика для товара
    const updateSupplier = (productId, oldSupplierId, newSupplierId, newSupplierName, newPrice) => {
        setCartItems(prev => {
            // Удаляем старую запись
            const filtered = prev.filter(item =>
                !(item.productId === productId && item.supplierId === oldSupplierId)
            );

            // Находим товар для копирования данных
            const oldItem = prev.find(item =>
                item.productId === productId && item.supplierId === oldSupplierId
            );

            if (oldItem) {
                // Добавляем новую запись с новым поставщиком
                return [...filtered, {
                    ...oldItem,
                    supplierId: newSupplierId,
                    supplierName: newSupplierName,
                    price: newPrice || oldItem.price,
                    updatedAt: new Date().toISOString()
                }];
            }

            return filtered;
        });
    };

    // Очистка корзины
    const clearCart = () => {
        setCartItems([]);
    };

    // Расчет общей стоимости
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Количество товаров
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            updateSupplier,
            clearCart,
            totalPrice,
            totalItems
        }}>
            {children}
        </CartContext.Provider>
    );
};