import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProductForm.module.css';
import { AuthContext } from '../../context/AuthContext';

function ProductForm() {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category: '',
        animalType: [],
        currentPrice: '',
        unit: 'шт',
        stockQuantity: 0,
        minStockLevel: 10,
        imageUrl: ''
    });

    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit) {
            fetch(`http://localhost:5000/api/products/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setFormData(data.data.product);
                    }
                })
                .catch(() => setError('Ошибка загрузки продукта'));
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAnimalTypeChange = (e) => {
        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setFormData(prev => ({ ...prev, animalType: options }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit
            ? `http://localhost:5000/api/products/${id}`
            : 'http://localhost:5000/api/products';

        const allowedUpdates = ['name','description','currentPrice','stockQuantity','category','animalType','imageUrl','minStockLevel','inStock'];
        const cleanFormData = {};
        allowedUpdates.forEach(field => {
            if (formData[field] !== undefined) {
                cleanFormData[field] = formData[field];
            }
        });

        if (isEdit) {
            delete cleanFormData.sku;
            delete cleanFormData.createdAt;
            delete cleanFormData.updatedAt;
            delete cleanFormData._id;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(cleanFormData)
            });
            const data = await res.json();

            if (data.success) {
                navigate('/products');
            } else {
                setError(data.message);
            }
        } catch {
            setError('Ошибка подключения к серверу');
        }
    };

    if (user?.role !== 'admin') {
        return <p className={styles.error}>Доступ запрещён</p>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                {isEdit ? 'Редактировать продукт' : 'Создать продукт'}
            </h2>

            {error && <p className={styles.error}>{error}</p>}

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
                <textarea
                    name="description"
                    placeholder="Описание"
                    value={formData.description}
                    onChange={handleChange}
                />
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                >
                    <option value="">Выберите категорию</option>
                    <option value="Корма">Корма</option>
                    <option value="Аксессуары">Аксессуары</option>
                    <option value="Игрушки">Игрушки</option>
                    <option value="Здоровье">Здоровье</option>
                    <option value="Гигиена">Гигиена</option>
                    <option value="Переноски">Переноски</option>
                    <option value="Одежда">Одежда</option>
                </select>
                <select
                    multiple
                    name="animalType"
                    value={formData.animalType}
                    onChange={handleAnimalTypeChange}
                    required
                >
                    <option value="Собака">Собака</option>
                    <option value="Кошка">Кошка</option>
                    <option value="Птица">Птица</option>
                    <option value="Рыбка">Рыбка</option>
                    <option value="Грызун">Грызун</option>
                    <option value="Рептилия">Рептилия</option>
                    <option value="Все">Все</option>
                </select>
                <input
                    type="number"
                    name="currentPrice"
                    placeholder="Цена"
                    value={formData.currentPrice}
                    onChange={handleChange}
                    required
                />
                <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                >
                    <option value="шт">шт</option>
                    <option value="кг">кг</option>
                    <option value="л">л</option>
                    <option value="уп">уп</option>
                    <option value="г">г</option>
                </select>
                <input
                    type="number"
                    name="stockQuantity"
                    placeholder="Количество на складе"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="minStockLevel"
                    placeholder="Минимальный уровень склада"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="imageUrl"
                    placeholder="Ссылка на изображение"
                    value={formData.imageUrl}
                    onChange={handleChange}
                />

                <button type="submit" className={styles.button}>
                    {isEdit ? 'Сохранить изменения' : 'Создать'}
                </button>
            </form>
        </div>
    );
}

export default ProductForm;