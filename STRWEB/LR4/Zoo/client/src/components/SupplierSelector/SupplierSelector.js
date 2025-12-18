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
        if (!product || suppliers.length === 0) {
            setLoading(false);
            return;
        }

        const formattedSuppliers = suppliers.map(supplier => ({
            id: supplier.id || supplier._id,
            name: supplier.name,
            city: supplier.address?.city || 'Не указан',
            rating: supplier.rating || 0,
            price: supplier.price || product.currentPrice,
            stockQuantity: supplier.stockQuantity || 0,
            deliveryTime: '1-3 дня',
            isAvailable: (supplier.stockQuantity || 0) > 0,
            phone: supplier.phone || '',
            email: supplier.email || ''
        }));

        console.log('Отформатированные поставщики для выбора:', {
            product: product.name,
            suppliersCount: formattedSuppliers.length,
            suppliers: formattedSuppliers.map(s => ({ id: s.id, name: s.name, price: s.price }))
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
                    <p>Товар: <strong>{product.name}</strong> ({product.sku})</p>
                    <p>Всего доступно поставщиков: <strong>{availableSuppliers.length}</strong></p>
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
                                        <span className={styles.price}>{supplier.price} BYN</span>
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
                            <p><strong>{selectedSupplier.name}</strong></p>
                            <p>Цена: <strong>{selectedSupplier.price} BYN</strong></p>
                            <p>Наличие: {selectedSupplier.stockQuantity} шт.</p>
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