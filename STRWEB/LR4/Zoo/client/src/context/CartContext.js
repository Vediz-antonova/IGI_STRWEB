import React, { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

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

    const removeFromCart = (productId, supplierId) => {
        setCartItems(prev =>
            prev.filter(item => !(item.productId === productId && item.supplierId === supplierId))
        );
    };

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

    const updateSupplier = (productId, oldSupplierId, newSupplierId, newSupplierName, newPrice) => {
        setCartItems(prev => {
            const filtered = prev.filter(item =>
                !(item.productId === productId && item.supplierId === oldSupplierId)
            );

            const oldItem = prev.find(item =>
                item.productId === productId && item.supplierId === oldSupplierId
            );

            if (oldItem) {
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

    const clearCart = () => {
        setCartItems([]);
    };

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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