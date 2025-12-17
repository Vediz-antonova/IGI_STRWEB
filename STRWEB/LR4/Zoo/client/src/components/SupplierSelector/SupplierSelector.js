import React, { useState, useEffect } from 'react';
import styles from './SupplierSelector.module.css';

function SupplierSelector({
                              product,
                              onSelect,
                              onCancel,
                              suppliers = []
                          }) {
    const [availableSuppliers, setAvailableSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!product || !suppliers.length) {
            setLoading(false);
            return;
        }

        const productSuppliers = suppliers.filter(supplier =>
            supplier.products?.some(p => p.product?._id === product._id)
        );

        const formattedSuppliers = productSuppliers.map(supplier => {
            const supplierProduct = supplier.products.find(p => p.product?._id === product._id);
            return {
                id: supplier._id,
                name: supplier.name,
                city: supplier.address?.city || 'Не указан',
                rating: supplier.rating || 0,
                price: supplierProduct?.price || product.currentPrice,
                stockQuantity: supplierProduct?.stockQuantity || 0,
                deliveryTime: '1-3 дня',
                isAvailable: (supplierProduct?.stockQuantity || 0) > 0
            };
        });

        setAvailableSuppliers(formattedSuppliers);

        const firstAvailable = formattedSuppliers.find(s => s.isAvailable);
        if (firstAvailable) {
            setSelectedSupplier(firstAvailable);
        }

        setLoading(false);
    }, [product, suppliers]);

    const handleSelect = () => {
        if (selectedSupplier) {
            onSelect(selectedSupplier);
        }
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div className={styles.loading}>Загрузка поставщиков...</div>
                </div>
            </div>
        );
    }

    if (availableSuppliers.length === 0) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <h3>Нет доступных поставщиков</h3>
                    <p>К сожалению, этот товар временно недоступен у поставщиков.</p>
                    <button onClick={onCancel} className={styles.cancelButton}>
                        Закрыть
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Выберите поставщика</h3>
                    <p>Товар: <strong>{product.name}</strong></p>
                </div>

                <div className={styles.suppliersList}>
                    {availableSuppliers.map(supplier => (
                        <div
                            key={supplier.id}
                            className={`${styles.supplierItem} ${selectedSupplier?.id === supplier.id ? styles.selected : ''} ${!supplier.isAvailable ? styles.unavailable : ''}`}
                            onClick={() => supplier.isAvailable && setSelectedSupplier(supplier)}
                        >
                            <div className={styles.supplierInfo}>
                                <div className={styles.supplierHeader}>
                                    <h4>{supplier.name}</h4>
                                    <div className={styles.rating}>
                                        {'★'.repeat(Math.round(supplier.rating))}
                                        {'☆'.repeat(5 - Math.round(supplier.rating))}
                                    </div>
                                </div>

                                <div className={styles.details}>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Город:</span>
                                        <span>{supplier.city}</span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Цена:</span>
                                        <span className={styles.price}>{supplier.price} ₽</span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Наличие:</span>
                                        <span className={supplier.isAvailable ? styles.inStock : styles.outOfStock}>
                                            {supplier.isAvailable
                                                ? `${supplier.stockQuantity} шт.`
                                                : 'Нет в наличии'}
                                        </span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Доставка:</span>
                                        <span>{supplier.deliveryTime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.selector}>
                                <input
                                    type="radio"
                                    name="supplier"
                                    checked={selectedSupplier?.id === supplier.id}
                                    onChange={() => supplier.isAvailable && setSelectedSupplier(supplier)}
                                    disabled={!supplier.isAvailable}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.selectedInfo}>
                    {selectedSupplier && (
                        <div className={styles.summary}>
                            <h4>Вы выбрали:</h4>
                            <p><strong>{selectedSupplier.name}</strong> — {selectedSupplier.price} ₽</p>
                            <p>Доставка: {selectedSupplier.deliveryTime}</p>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={onCancel}
                        className={styles.cancelButton}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSelect}
                        disabled={!selectedSupplier}
                        className={styles.selectButton}
                    >
                        Выбрать этого поставщика
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SupplierSelector;