import React, { createContext, useState, useEffect } from 'react';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            const data = await response.json();
            if (data.success) {
                setProducts(data.data.products || []);
                setFilteredProducts(data.data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const matchProductsForPet = (petType, petAge, specialNeeds = []) => {
        let matched = products.filter(product =>
            product.animalType.includes(petType) || product.animalType.includes('Все')
        );

        if (petAge === 'baby') {
            matched = matched.filter(p =>
                p.category === 'Корма' || p.category === 'Игрушки' || p.category === 'Гигиена'
            );
        }

        if (specialNeeds.includes('allergy')) {
            matched = matched.filter(p =>
                !p.name.toLowerCase().includes('аллерг') &&
                !p.description?.toLowerCase().includes('аллерг')
            );
        }

        if (specialNeeds.includes('diet')) {
            matched = matched.filter(p =>
                p.category === 'Корма' || p.category === 'Здоровье'
            );
        }

        setFilteredProducts(matched);
        return matched;
    };

    const getRandomRecommendation = () => {
        if (products.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * products.length);
        return products[randomIndex];
    };

    const resetFilter = () => {
        setFilteredProducts(products);
    };

    const getProductById = (id) => {
        return products.find(p => p._id === id);
    };

    return (
        <ProductContext.Provider value={{
            products,
            filteredProducts,
            loading,
            matchProductsForPet,
            resetFilter,
            getRandomRecommendation,
            getProductById,
            totalProducts: products.length,
            refreshProducts: fetchProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
};