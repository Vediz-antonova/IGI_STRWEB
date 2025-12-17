import React, { useState, useContext, useEffect } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { CartContext } from '../../context/CartContext';
import styles from './PetProductMatcher.module.css';

function PetProductMatcher() {
    const {
        filteredProducts,
        matchProductsForPet,
        resetFilter,
        getRandomRecommendation,
        loading
    } = useContext(ProductContext);

    const { addToCart } = useContext(CartContext);

    const [petType, setPetType] = useState('Собака');
    const [petAge, setPetAge] = useState('adult');
    const [specialNeeds, setSpecialNeeds] = useState([]);
    const [isMatching, setIsMatching] = useState(false);
    const [recommendedProduct, setRecommendedProduct] = useState(null);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        // Загружаем поставщиков для кнопки "В корзину"
        fetch('http://localhost:5000/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSuppliers(data.data.suppliers || []);
                }
            });
    }, []);

    const handlePetTypeChange = (e) => {
        setPetType(e.target.value);
    };

    const handlePetAgeChange = (e) => {
        setPetAge(e.target.value);
    };

    const handleSpecialNeedChange = (need) => {
        setSpecialNeeds(prev =>
            prev.includes(need)
                ? prev.filter(n => n !== need)
                : [...prev, need]
        );
    };

    const onProductMatch = () => {
        setIsMatching(true);

        // Имитация асинхронного подбора с Promise
        new Promise((resolve) => {
            setTimeout(() => {
                const matched = matchProductsForPet(petType, petAge, specialNeeds);
                resolve(matched);
            }, 1000);
        }).then((matched) => {
            setIsMatching(false);

            if (matched.length === 0) {
                alert('По вашим критериям товары не найдены');
            }
        });
    };

    const onRecommendation = () => {
        const randomProduct = getRandomRecommendation();
        if (randomProduct) {
            setRecommendedProduct(randomProduct);
            alert(`Рекомендуем: ${randomProduct.name} (${randomProduct.category})`);
        }
    };

    const onSubscription = (productId) => {
        alert(`Подписка на уведомления для товара оформлена!`);
        // Здесь можно добавить запрос к API для сохранения подписки
    };

    const onAddToCart = (product) => {
        const supplier = suppliers.find(s =>
            s.products?.some(p => p.product?._id === product._id)
        );

        if (supplier) {
            addToCart(product, supplier._id, 1);
            alert(`Товар "${product.name}" добавлен в корзину!`);
        } else {
            alert('Товар временно недоступен у поставщиков');
        }
    };

    const onInventoryUpdate = (productId, newStock) => {
        alert(`Запрос на обновление инвентаря для товара ${productId} на ${newStock} единиц`);
        // Здесь можно добавить логику обновления инвентаря
    };

    const onPetProfile = (petType) => {
        alert(`Создан профиль для питомца: ${petType}`);
        // Логика сохранения профиля питомца
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка товаров...</div>;
    }

    return (
        <div className={styles.matcher}>
            <h2>🔍 Подбор товаров для питомца</h2>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Тип питомца:</label>
                    <select value={petType} onChange={handlePetTypeChange}>
                        <option value="Собака">Собака 🐕</option>
                        <option value="Кошка">Кошка 🐈</option>
                        <option value="Птица">Птица 🐦</option>
                        <option value="Рыбка">Рыбка 🐠</option>
                        <option value="Грызун">Грызун 🐹</option>
                        <option value="Рептилия">Рептилия 🦎</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Возраст:</label>
                    <select value={petAge} onChange={handlePetAgeChange}>
                        <option value="baby">До 1 года 👶</option>
                        <option value="young">1-3 года 🧒</option>
                        <option value="adult">3-7 лет 👨</option>
                        <option value="senior">Старше 7 лет 👴</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Особые потребности:</label>
                    <div className={styles.checkboxes}>
                        <label>
                            <input
                                type="checkbox"
                                checked={specialNeeds.includes('allergy')}
                                onChange={() => handleSpecialNeedChange('allergy')}
                            />
                            Аллергия
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={specialNeeds.includes('diet')}
                                onChange={() => handleSpecialNeedChange('diet')}
                            />
                            Диета
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={specialNeeds.includes('active')}
                                onChange={() => handleSpecialNeedChange('active')}
                            />
                            Активный образ жизни
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    onClick={onProductMatch}
                    disabled={isMatching}
                    className={styles.matchBtn}
                >
                    {isMatching ? 'Подбор...' : 'Подобрать товары'}
                </button>
                <button onClick={resetFilter} className={styles.resetBtn}>
                    Сбросить фильтры
                </button>
                <button onClick={onRecommendation} className={styles.recommendBtn}>
                    Получить рекомендацию
                </button>
                <button onClick={() => onPetProfile(petType)} className={styles.profileBtn}>
                    Создать профиль питомца
                </button>
            </div>

            {recommendedProduct && (
                <div className={styles.recommendation}>
                    <h3>🎯 Рекомендуемый товар:</h3>
                    <div className={styles.recommendedCard}>
                        <img src={recommendedProduct.imageUrl} alt={recommendedProduct.name} />
                        <div>
                            <h4>{recommendedProduct.name}</h4>
                            <p>{recommendedProduct.description}</p>
                            <p>Цена: {recommendedProduct.currentPrice} ₽</p>
                            <button
                                onClick={() => onAddToCart(recommendedProduct)}
                                className={styles.addToCartBtn}
                            >
                                Добавить в корзину
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.results}>
                <h3>Найдено товаров: {filteredProducts.length}</h3>

                <div className={styles.productsGrid}>
                    {filteredProducts.slice(0, 6).map(product => (
                        <div key={product._id} className={styles.productCard}>
                            <img src={product.imageUrl} alt={product.name} />
                            <h4>{product.name}</h4>
                            <p className={styles.category}>{product.category}</p>
                            <p className={styles.price}>{product.currentPrice} ₽</p>
                            <p className={styles.stock}>
                                Остаток: {product.stockQuantity} шт.
                                {product.stockQuantity < product.minStockLevel &&
                                    <span className={styles.lowStock}> (мало!)</span>
                                }
                            </p>

                            <div className={styles.productActions}>
                                <button
                                    onClick={() => onAddToCart(product)}
                                    className={styles.cartBtn}
                                >
                                    🛒 В корзину
                                </button>
                                <button
                                    onClick={() => onSubscription(product._id)}
                                    className={styles.subscribeBtn}
                                >
                                    🔔 Подписаться
                                </button>
                                <button
                                    onClick={() => onInventoryUpdate(product._id, 10)}
                                    className={styles.inventoryBtn}
                                >
                                    📦 Пополнить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PetProductMatcher;