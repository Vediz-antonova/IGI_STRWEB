import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './SupplierForm.module.css';
import { AuthContext } from '../../context/AuthContext';

function SupplierForm() {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: { country: '', city: '', street: '' },
        rating: 0,
        products: []
    });

    const [availableProducts, setAvailableProducts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => {
                if (data.success) setAvailableProducts(data.data.products);
            });
    }, []);

    useEffect(() => {
        if (isEdit) {
            fetch(`http://localhost:5000/api/suppliers/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setFormData(data.data.supplier);
                    }
                })
                .catch(() => setError('Ошибка загрузки поставщика'));
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProductChange = (index, field, value) => {
        const updated = [...formData.products];
        updated[index][field] = value;

        if (field === 'product') {
            const selected = availableProducts.find(p => p._id === value);
            updated[index].sku = selected?.sku || '';
        }

        setFormData(prev => ({ ...prev, products: updated }));
    };

    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { product: '', sku: '', price: 0, stockQuantity: 0 }]
        }));
    };

    const removeProduct = (index) => {
        const updated = formData.products.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, products: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit
            ? `http://localhost:5000/api/suppliers/${id}`
            : 'http://localhost:5000/api/suppliers';

        const cleanFormData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            rating: formData.rating,
            products: formData.products.map(p => ({
                product: p.product,
                sku: p.sku,
                price: parseFloat(p.price),
                stockQuantity: parseInt(p.stockQuantity)
            }))
        };

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
                navigate('/suppliers');
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
                {isEdit ? 'Редактировать поставщика' : 'Создать поставщика'}
            </h2>

            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <input type="text" name="name" placeholder="Название компании"
                       value={formData.name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email"
                       value={formData.email} onChange={handleChange} required />
                <input type="text" name="phone" placeholder="Телефон"
                       value={formData.phone} onChange={handleChange} required />
                <input type="text" name="address.country" placeholder="Страна"
                       value={formData.address.country} onChange={handleChange} required />
                <input type="text" name="address.city" placeholder="Город"
                       value={formData.address.city} onChange={handleChange} required />
                <input type="text" name="address.street" placeholder="Улица"
                       value={formData.address.street} onChange={handleChange} />
                <input type="number" name="rating" placeholder="Рейтинг (0–5)"
                       value={formData.rating} onChange={handleChange}
                       min="0" max="5" step="0.1" />

                <h3>Товары поставщика</h3>
                {formData.products.map((prod, index) => (
                    <div key={index} className={styles.productRow}>
                        <select
                            value={prod.product}
                            onChange={(e) => handleProductChange(index, 'product', e.target.value)}
                            required
                        >
                            <option value="">Выберите товар</option>
                            {availableProducts.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} ({p.sku})
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Артикул"
                            value={prod.sku}
                            onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Цена"
                            value={prod.price}
                            onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Остаток"
                            value={prod.stockQuantity}
                            onChange={(e) => handleProductChange(index, 'stockQuantity', e.target.value)}
                            min="0"
                            required
                        />
                        <button type="button" onClick={() => removeProduct(index)}>Удалить</button>
                    </div>
                ))}
                <button type="button" onClick={addProduct}>+ Добавить товар</button>

                <button type="submit" className={styles.button}>
                    {isEdit ? 'Сохранить изменения' : 'Создать'}
                </button>
            </form>
        </div>
    );
}

export default SupplierForm;