import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import styles from './ProductForm.module.css';

function ProductForm() {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        currentPrice: '',
        unit: '',
        stockQuantity: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (id) {
            fetch(`http://localhost:5000/api/products/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setFormData(data.data.product);
                    }
                });
        }
    }, [id]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = id ? 'PUT' : 'POST';
        const url = id
            ? `http://localhost:5000/api/products/${id}`
            : `http://localhost:5000/api/products`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                navigate('/products');
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Ошибка сохранения товара', err);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>{id ? 'Редактировать товар' : 'Добавить товар'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    name="name"
                    placeholder="Название"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="sku"
                    placeholder="Артикул"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="currentPrice"
                    placeholder="Цена"
                    value={formData.currentPrice}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="unit"
                    placeholder="Единица измерения (шт, кг...)"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="stockQuantity"
                    placeholder="Количество на складе"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="imageUrl"
                    placeholder="URL изображения"
                    value={formData.imageUrl}
                    onChange={handleChange}
                />
                <button type="submit" className={styles.submitBtn}>
                    {id ? 'Сохранить изменения' : 'Добавить товар'}
                </button>
            </form>
        </div>
    );
}

export default ProductForm;