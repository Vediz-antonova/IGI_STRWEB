import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './PetProductMatcher.module.css';

const filterReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PET_TYPE':
            return { ...state, petType: action.payload };
        case 'SET_PET_AGE':
            return { ...state, petAge: action.payload };
        case 'SET_PET_SIZE':
            return { ...state, petSize: action.payload };
        case 'SET_SPECIAL_NEEDS':
            return { ...state, specialNeeds: action.payload };
        case 'SET_BUDGET':
            return { ...state, budget: action.payload };
        case 'SET_PRODUCT_TYPE':
            return { ...state, productType: action.payload };
        case 'RESET_FILTERS':
            return {
                petType: 'Собака',
                petAge: 'adult',
                petSize: 'medium',
                specialNeeds: [],
                budget: 30,
                productType: 'all'
            };
        default:
            return state;
    }
};

function PetProductMatcher() {
    const { products, loading, getProductById } = useContext(ProductContext);
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { showSuccess, showError, showInfo } = useNotifications();

    const [filterState, dispatch] = useReducer(filterReducer, {
        petType: 'Собака',
        petAge: 'adult',
        petSize: 'medium',
        specialNeeds: [],
        budget: 30,
        productType: 'all'
    });

    const [matchedProducts, setMatchedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isMatching, setIsMatching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    const performMatching = useCallback(() => {
        setIsMatching(true);

        new Promise((resolve) => {
            setTimeout(() => {
                resolve('Начало подбора...');
            }, 500);
        })
            .then((message) => {
                console.log(message);
                return new Promise((resolve) => {
                    setTimeout(() => {
                        let filtered = [...products];

                        filtered = filtered.filter(product =>
                            product.animalType.includes(filterState.petType) ||
                            product.animalType.includes('Все')
                        );

                        if (filterState.petAge === 'baby') {
                            filtered = filtered.filter(p =>
                                p.category === 'Корма' ||
                                p.category === 'Игрушки' ||
                                p.category === 'Гигиена' ||
                                p.category === 'Здоровье'
                            );
                        } else if (filterState.petAge === 'senior') {
                            filtered = filtered.filter(p =>
                                p.category === 'Корма' ||
                                p.category === 'Здоровье' ||
                                p.category === 'Аксессуары'
                            );
                        }

                        if (filterState.petSize === 'small') {
                            filtered = filtered.filter(p =>
                                !p.name.toLowerCase().includes('крупн') &&
                                !p.description?.toLowerCase().includes('крупн')
                            );
                        } else if (filterState.petSize === 'large') {
                            filtered = filtered.filter(p =>
                                !p.name.toLowerCase().includes('мелк') &&
                                !p.description?.toLowerCase().includes('мелк')
                            );
                        }

                        if (filterState.specialNeeds.includes('allergy')) {
                            filtered = filtered.filter(p =>
                                !p.name.toLowerCase().includes('аллерг') &&
                                !p.description?.toLowerCase().includes('аллерг')
                            );
                        }

                        if (filterState.specialNeeds.includes('diet')) {
                            filtered = filtered.filter(p =>
                                p.category === 'Корма' || p.category === 'Здоровье'
                            );
                        }

                        if (filterState.specialNeeds.includes('active')) {
                            filtered = filtered.filter(p =>
                                p.category === 'Игрушки' || p.category === 'Аксессуары'
                            );
                        }

                        filtered = filtered.filter(p => p.currentPrice <= filterState.budget);

                        if (filterState.productType !== 'all') {
                            filtered = filtered.filter(p => p.category === filterState.productType);
                        }

                        filtered.sort((a, b) => {
                            if (a.inStock !== b.inStock) return b.inStock - a.inStock;
                            return a.currentPrice - b.currentPrice;
                        });

                        resolve(filtered);
                    }, 1000);
                });
            })
            .then((filtered) => {
                setMatchedProducts(filtered);
                setIsMatching(false);
                setShowResults(true);
                showInfo(`Найдено ${filtered.length} товаров для вашего питомца`);

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('Подбор завершен');
                    }, 3000);
                });
            })
            .catch((error) => {
                console.error('Ошибка при подборе:', error);
                setIsMatching(false);
                showError('Ошибка при подборе товаров');
            });
    }, [products, filterState, showInfo, showError]);

    useEffect(() => {
        const savedProfile = localStorage.getItem('petProfile');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                dispatch({ type: 'SET_PET_TYPE', payload: profile.type || 'Собака' });
                dispatch({ type: 'SET_PET_AGE', payload: profile.age || 'adult' });
                dispatch({ type: 'SET_PET_SIZE', payload: profile.size || 'medium' });
                dispatch({ type: 'SET_SPECIAL_NEEDS', payload: profile.specialNeeds || [] });
                showInfo('Профиль питомца загружен!');
            } catch (error) {
                console.error('Ошибка загрузки профиля:', error);
            }
        }
    }, [showInfo]);

    useEffect(() => {
        if (products.length > 0) {
            performMatching();
        }
    }, [products, performMatching]);

    const onProductMatch = () => {
        if (!user) {
            showError('Для подбора товаров необходимо войти в систему');
            return;
        }
        performMatching();
    };

    const onSendLargeOrder = () => {
        if (!selectedProducts.length) {
            showError('Выберите товары для заказа');
            return;
        }

        const xhr = new XMLHttpRequest();
        const orderData = {
            products: selectedProducts,
            petProfile: filterState,
            timestamp: new Date().toISOString()
        };

        xhr.open('POST', 'http://localhost:5000/api/purchases/large-order', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                showInfo(`Отправка заказа: ${percentComplete.toFixed(1)}%`);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                showSuccess('Большой заказ успешно отправлен поставщикам!');
            } else {
                showError('Ошибка отправки заказа');
            }
        };

        xhr.onerror = () => {
            showError('Ошибка подключения к серверу');
        };

        xhr.send(JSON.stringify(orderData));
    };

    const onPetProfile = () => {
        const petProfile = {
            type: filterState.petType,
            age: filterState.petAge,
            size: filterState.petSize,
            specialNeeds: filterState.specialNeeds,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('petProfile', JSON.stringify(petProfile));
        showSuccess('Профиль питомца сохранен!');
    };

    const onRecommendation = () => {
        if (matchedProducts.length === 0) {
            showError('Сначала выполните подбор товаров');
            return;
        }

        const recommended = [...matchedProducts]
            .filter(p => p.inStock)
            .sort((a, b) => a.currentPrice - b.currentPrice)[0];

        if (recommended) {
            showSuccess(`Рекомендуем: ${recommended.name} за ${recommended.currentPrice} BYN`);
        } else {
            showError('Нет подходящих рекомендаций');
        }
    };

    const onAddToCart = (product) => {
        if (!user) {
            showError('Для добавления в корзину необходимо войти в систему');
            return;
        }

        addToCart(product, 'supplier-id-placeholder', 'Основной поставщик', 1);
        showSuccess(`Товар "${product.name}" добавлен в корзину`);
    };

    const onSelectProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else if (prev.length < 3) {
                return [...prev, productId];
            } else {
                showError('Можно выбрать не более 3 товаров для сравнения');
                return prev;
            }
        });
    };

    const onCompareProducts = () => {
        if (selectedProducts.length < 2) {
            showError('Выберите хотя бы 2 товара для сравнения');
            return;
        }
        setShowComparison(true);
    };

    const handlePetTypeChange = (e) => {
        dispatch({ type: 'SET_PET_TYPE', payload: e.target.value });
    };

    const handlePetAgeChange = (e) => {
        dispatch({ type: 'SET_PET_AGE', payload: e.target.value });
    };

    const handlePetSizeChange = (e) => {
        dispatch({ type: 'SET_PET_SIZE', payload: e.target.value });
    };

    const handleSpecialNeedChange = (need) => {
        dispatch({
            type: 'SET_SPECIAL_NEEDS',
            payload: filterState.specialNeeds.includes(need)
                ? filterState.specialNeeds.filter(n => n !== need)
                : [...filterState.specialNeeds, need]
        });
    };

    const handleBudgetChange = (e) => {
        dispatch({ type: 'SET_BUDGET', payload: parseFloat(e.target.value) });
    };

    const handleProductTypeChange = (e) => {
        dispatch({ type: 'SET_PRODUCT_TYPE', payload: e.target.value });
    };

    const handleResetFilters = () => {
        dispatch({ type: 'RESET_FILTERS' });
        setShowResults(false);
        setSelectedProducts([]);
        setShowComparison(false);
        showInfo('Фильтры сброшены');
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка товаров...</div>;
    }

    return (
        <div className={styles.matcher}>
            <h2>Интеллектуальный подбор товаров для питомца</h2>

            <div className={styles.filterPanel}>
                <div className={styles.filterSection}>
                    <h3>Параметры питомца</h3>

                    <div className={styles.filterGroup}>
                        <label>
                            Тип питомца:
                            <span className={styles.tooltip} title="Выберите вид вашего питомца">
                            </span>
                        </label>
                        <select value={filterState.petType} onChange={handlePetTypeChange}>
                            <option value="Собака">Собака</option>
                            <option value="Кошка">Кошка</option>
                            <option value="Птица">Птица</option>
                            <option value="Рыбка">Рыбка</option>
                            <option value="Грызун">Грызун</option>
                            <option value="Рептилия">Рептилия</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            Возраст:
                            <span className={styles.tooltip} title="Возрастная категория питомца">
                            </span>
                        </label>
                        <select value={filterState.petAge} onChange={handlePetAgeChange}>
                            <option value="baby">Молодой (до 3 лет)</option>
                            <option value="adult">Взрослый (3-7 лет)</option>
                            <option value="senior">Пожилой (старше 7 лет)</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            Размер:
                            <span className={styles.tooltip} title="Размер и вес питомца">
                            </span>
                        </label>
                        <select value={filterState.petSize} onChange={handlePetSizeChange}>
                            <option value="small">Маленький (до 5 кг)</option>
                            <option value="medium">Средний (5-15 кг)</option>
                            <option value="large">Крупный (15+ кг)</option>
                        </select>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3>Особые потребности</h3>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={filterState.specialNeeds.includes('allergy')}
                                onChange={() => handleSpecialNeedChange('allergy')}
                            />
                            Склонность к аллергии
                        </label>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={filterState.specialNeeds.includes('diet')}
                                onChange={() => handleSpecialNeedChange('diet')}
                            />
                            Специальная диета
                        </label>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={filterState.specialNeeds.includes('active')}
                                onChange={() => handleSpecialNeedChange('active')}
                            />
                            Активный образ жизни
                        </label>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3>Предпочтения товаров</h3>

                    <div className={styles.filterGroup}>
                        <label>
                            Бюджет: до {filterState.budget.toFixed(2)} BYN
                            <span className={styles.tooltip} title="Установите максимальную цену для подбора товаров">
                            </span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="150"
                            step="0.5"
                            value={filterState.budget}
                            onChange={handleBudgetChange}
                            className={styles.budgetSlider}
                        />
                        <div className={styles.budgetRange}>
                            <span>1 BYN</span>
                            <span>150 BYN</span>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            Тип товара:
                            <span className={styles.tooltip} title="Категория товаров для подбора">
                            </span>
                        </label>
                        <select value={filterState.productType} onChange={handleProductTypeChange}>
                            <option value="all">Все товары</option>
                            <option value="Корма">Корма</option>
                            <option value="Аксессуары">Аксессуары</option>
                            <option value="Игрушки">Игрушки</option>
                            <option value="Здоровье">Здоровье</option>
                            <option value="Гигиена">Гигиена</option>
                            <option value="Переноски">Переноски</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button
                    onClick={onProductMatch}
                    disabled={isMatching}
                    className={styles.matchButton}
                >
                    {isMatching ? 'Идет подбор...' : 'Подобрать товары'}
                </button>

                <button onClick={onRecommendation} className={styles.recommendButton}>
                    Рекомендация
                </button>

                <button onClick={onPetProfile} className={styles.profileButton}>
                    {localStorage.getItem('petProfile') ? 'Обновить профиль' : 'Сохранить профиль'}
                </button>

                {selectedProducts.length > 0 && (
                    <button onClick={onSendLargeOrder} className={styles.orderButton}>
                        Отправить большой заказ
                    </button>
                )}

                <button onClick={handleResetFilters} className={styles.resetButton}>
                    Сбросить фильтры
                </button>
            </div>

            {showResults && (
                <div className={styles.resultsSection}>
                    <div className={styles.resultsHeader}>
                        <h3>
                            Результаты подбора: {matchedProducts.length} товаров
                            {selectedProducts.length > 0 && (
                                <span className={styles.selectedCount}>
                                    (выбрано: {selectedProducts.length}/3)
                                </span>
                            )}
                        </h3>

                        {selectedProducts.length >= 2 && (
                            <button onClick={onCompareProducts} className={styles.compareButton}>
                                Сравнить выбранные
                            </button>
                        )}
                    </div>

                    {matchedProducts.length === 0 ? (
                        <div className={styles.noResults}>
                            <p>По вашим критериям товары не найдены</p>
                            <p>Попробуйте изменить параметры поиска</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.productsGrid}>
                                {matchedProducts.slice(0, 12).map(product => (
                                    <div
                                        key={product._id}
                                        className={`${styles.productCard} ${selectedProducts.includes(product._id) ? styles.selected : ''}`}
                                        onClick={() => onSelectProduct(product._id)}
                                    >
                                        <div className={styles.cardHeader}>
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product._id)}
                                                onChange={() => {}}
                                                className={styles.selectCheckbox}
                                            />
                                            <span className={styles.productCategory}>{product.category}</span>
                                        </div>

                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={styles.productImage}
                                        />

                                        <div className={styles.productInfo}>
                                            <h4>{product.name}</h4>
                                            <p className={styles.productDescription}>
                                                {product.description?.substring(0, 80)}...
                                            </p>

                                            <div className={styles.productMeta}>
                                                <span className={styles.productPrice}>
                                                    {product.currentPrice} BYN
                                                </span>
                                                <span className={product.inStock ? styles.inStock : styles.outOfStock}>
                                                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                                                </span>
                                            </div>

                                            <div className={styles.productActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(product);
                                                    }}
                                                    className={styles.cartButton}
                                                    disabled={!product.inStock}
                                                >
                                                    В корзину
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {showComparison && selectedProducts.length >= 2 && (
                                <div className={styles.comparisonTable}>
                                    <h4>Сравнение выбранных товаров</h4>
                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Параметр</th>
                                            {selectedProducts.map(productId => {
                                                const product = getProductById(productId);
                                                return product ? (
                                                    <th key={productId}>{product.name}</th>
                                                ) : null;
                                            })}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>Цена</td>
                                            {selectedProducts.map(productId => {
                                                const product = getProductById(productId);
                                                return product ? (
                                                    <td key={productId}>{product.currentPrice} BYN</td>
                                                ) : null;
                                            })}
                                        </tr>
                                        <tr>
                                            <td>Наличие</td>
                                            {selectedProducts.map(productId => {
                                                const product = getProductById(productId);
                                                return product ? (
                                                    <td key={productId}>
                                                        {product.inStock ? 'В наличии' : 'Нет'}
                                                    </td>
                                                ) : null;
                                            })}
                                        </tr>
                                        <tr>
                                            <td>Категория</td>
                                            {selectedProducts.map(productId => {
                                                const product = getProductById(productId);
                                                return product ? (
                                                    <td key={productId}>{product.category}</td>
                                                ) : null;
                                            })}
                                        </tr>
                                        <tr>
                                            <td>Для животных</td>
                                            {selectedProducts.map(productId => {
                                                const product = getProductById(productId);
                                                return product ? (
                                                    <td key={productId}>{product.animalType.join(', ')}</td>
                                                ) : null;
                                            })}
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default PetProductMatcher;
export { filterReducer };