import React, { createContext, useState, useCallback, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [cartOrders, setCartOrders] = useState(() => {
        const saved = localStorage.getItem('cartOrders');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        localStorage.setItem('cartOrders', JSON.stringify(cartOrders));
    }, [cartItems, cartOrders]);

    const addToCart = useCallback((product, supplierId, supplierName, quantity = 1) => {
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
    }, []);

    const removeFromCart = useCallback((productId, supplierId) => {
        setCartItems(prev =>
            prev.filter(item => !(item.productId === productId && item.supplierId === supplierId))
        );
    }, []);

    const updateQuantity = useCallback((productId, supplierId, quantity) => {
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
    }, [removeFromCart]);

    const createOrderFromCart = useCallback(async (supplierId, items, token, user) => {
        const supplierItems = items.filter(item => item.supplierId === supplierId);

        if (supplierItems.length === 0) return null;

        const purchases = supplierItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        const orderData = {
            supplier: supplierId,
            purchases: purchases,
            deliveryAddress: {
                street: "Основной склад",
                city: user?.address?.city || "Минск",
                country: user?.address?.country || "Беларусь"
            },
            notes: `Заказ из корзины пользователя ${user?.username || 'Гость'}`
        };

        try {
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
                supplierItems.forEach(item =>
                    removeFromCart(item.productId, item.supplierId)
                );

                const newOrder = {
                    id: data.data.order._id,
                    orderNumber: data.data.order.orderNumber,
                    supplierId,
                    supplierName: supplierItems[0].supplierName,
                    items: supplierItems,
                    totalCost: data.data.order.totalCost,
                    status: 'created',
                    createdAt: new Date().toISOString()
                };

                setCartOrders(prev => [...prev, newOrder]);
                return { success: true, order: data.data.order };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка подключения к серверу' };
        }
    }, [removeFromCart]);

    const createOrder = useCallback(async (orderData, token) => {
        try {
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Ошибка подключения к серверу' };
        }
    }, []);

    const updateOrderStatus = useCallback(async (orderId, status, token) => {
        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                setCartOrders(prev =>
                    prev.map(order =>
                        order.id === orderId ? { ...order, status } : order
                    )
                );
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Ошибка подключения к серверу' };
        }
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

    return (
        <CartContext.Provider value={{
            cartItems,
            cartOrders,
            addToCart,
            removeFromCart,
            updateQuantity,
            createOrderFromCart,
            createOrder,
            updateOrderStatus,
            clearCart,
            totalPrice,
            totalItems,
            groupedBySupplier
        }}>
            {children}
        </CartContext.Provider>
    );
};