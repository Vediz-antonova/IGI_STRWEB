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
        productsCount: 0
    });

    const [error, setError] = useState('');

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
            productsCount: formData.productsCount
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
                <input
                    type="text"
                    name="name"
                    placeholder="Название компании"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="phone"
                    placeholder="Телефон"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="address.country"
                    placeholder="Страна"
                    value={formData.address.country}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="address.city"
                    placeholder="Город"
                    value={formData.address.city}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="address.street"
                    placeholder="Улица"
                    value={formData.address.street}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    name="rating"
                    placeholder="Рейтинг (0–5)"
                    value={formData.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                />
                <input
                    type="number"
                    name="productsCount"
                    placeholder="Количество на складе"
                    value={formData.productsCount}
                    onChange={handleChange}
                />

                <button type="submit" className={styles.button}>
                    {isEdit ? 'Сохранить изменения' : 'Создать'}
                </button>
            </form>
        </div>
    );
}

export default SupplierForm;