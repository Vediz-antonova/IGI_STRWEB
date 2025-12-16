import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './ProductDetails.module.css';

function ProductDetails() {
    const { id } = useParams(); // берём id из URL
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = `http://localhost:5000/api/products/${id}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setProduct(data.data?.product || null);
                setLoading(false);
            })
            .catch(err => {
                setLoading(false);
            });
    }, [id]);

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
                    <p><strong>Добавлен:</strong> {product.createdAtLocal}</p>
                    <p><strong>Обновлен:</strong> {product.updatedAtLocal}</p>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;