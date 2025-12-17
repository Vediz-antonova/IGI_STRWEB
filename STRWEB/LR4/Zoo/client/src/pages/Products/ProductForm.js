import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProductForm.module.css';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

function ProductForm() {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();
    const { showSuccess, showError } = useNotifications();

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
        imageUrl: '',
        inStock: true
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            setInitialLoading(true);
            fetch(`http://localhost:5000/api/products/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data.product) {
                        const productData = data.data.product;

                        setFormData({
                            name: productData.name || '',
                            sku: productData.sku || '',
                            description: productData.description || '',
                            category: productData.category || '',
                            animalType: Array.isArray(productData.animalType)
                                ? productData.animalType
                                : [],
                            currentPrice: productData.currentPrice?.toString() || '',
                            unit: productData.unit || 'шт',
                            stockQuantity: productData.stockQuantity?.toString() || '0',
                            minStockLevel: productData.minStockLevel?.toString() || '10',
                            imageUrl: productData.imageUrl || '',
                            inStock: productData.inStock !== undefined ? productData.inStock : true
                        });
                    }
                })
                .catch(() => showError('Ошибка загрузки продукта'))
                .finally(() => setInitialLoading(false));
        }
    }, [id, isEdit, showError]);

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
        setLoading(true);

        const errors = [];
        if (!formData.name.trim()) errors.push('Название обязательно');
        if (!isEdit && !formData.sku.trim()) errors.push('Артикул обязателен');
        if (!formData.category) errors.push('Категория обязательна');
        if (!formData.animalType.length) errors.push('Выберите хотя бы один тип животного');
        if (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0) errors.push('Цена должна быть больше 0');

        if (errors.length > 0) {
            showError(errors.join(', '));
            setLoading(false);
            return;
        }

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit
            ? `http://localhost:5000/api/products/${id}`
            : 'http://localhost:5000/api/products';

        const requestData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category,
            animalType: formData.animalType,
            currentPrice: parseFloat(formData.currentPrice),
            stockQuantity: parseInt(formData.stockQuantity) || 0,
            imageUrl: formData.imageUrl.trim() || 'https://via.placeholder.com/300x300?text=Pet+Product',
            minStockLevel: parseInt(formData.minStockLevel) || 10,
            inStock: formData.inStock
        };

        if (!isEdit) {
            requestData.unit = formData.unit;
            requestData.sku = formData.sku.trim().toUpperCase();
        }

        console.log('Отправка данных на сервер:', requestData);

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await res.json();

            if (data.success) {
                showSuccess(isEdit ? 'Продукт успешно обновлен!' : 'Продукт успешно создан!');
                setTimeout(() => navigate('/products'), 1500);
            } else {
                showError(data.message || 'Ошибка сохранения');
                setLoading(false);
            }
        } catch (error) {
            showError('Ошибка подключения к серверу');
            setLoading(false);
        }
    };

    if (user?.role !== 'admin') {
        return <p className={styles.error}>Доступ запрещён</p>;
    }

    if (initialLoading) {
        return <div className={styles.loading}>Загрузка данных...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                {isEdit ? 'Редактировать продукт' : 'Создать продукт'}
            </h2>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Название *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>

                {!isEdit && (
                    <div className={styles.formGroup}>
                        <label>Артикул *</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label>Описание</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Категория *</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loading}
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
                </div>

                <div className={styles.formGroup}>
                    <label>Для животных * (Ctrl+клик для множественного выбора)</label>
                    <select
                        multiple
                        name="animalType"
                        value={formData.animalType}
                        onChange={handleAnimalTypeChange}
                        required
                        disabled={loading}
                        size={5}
                    >
                        <option value="Собака">Собака</option>
                        <option value="Кошка">Кошка</option>
                        <option value="Птица">Птица</option>
                        <option value="Рыбка">Рыбка</option>
                        <option value="Грызун">Грызун</option>
                        <option value="Рептилия">Рептилия</option>
                    </select>
                    <div className={styles.selectedTypes}>
                        Выбрано: {formData.animalType.join(', ') || 'ничего'}
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Цена *</label>
                        <input
                            type="number"
                            name="currentPrice"
                            value={formData.currentPrice}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            disabled={loading}
                        />
                    </div>

                    {!isEdit && (
                        <div className={styles.formGroup}>
                            <label>Единица измерения *</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                <option value="шт">шт</option>
                                <option value="кг">кг</option>
                                <option value="л">л</option>
                                <option value="уп">уп</option>
                                <option value="г">г</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Количество на складе</label>
                        <input
                            type="number"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            min="0"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Минимальный запас</label>
                        <input
                            type="number"
                            name="minStockLevel"
                            value={formData.minStockLevel}
                            onChange={handleChange}
                            min="0"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Ссылка на изображение</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="https://example.com/image.jpg"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={formData.inStock}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                inStock: e.target.checked
                            }))}
                            disabled={loading}
                        />
                        Товар в наличии
                    </label>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => navigate('/products')}
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProductForm;