const Product = require('../models/Product');
const { formatDateWithTimezone } = require('../utils/timezone');

const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            animalType,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            minPrice,
            maxPrice,
            inStock
        } = req.query;

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (animalType) {
            filter.animalType = animalType;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        if (minPrice || maxPrice) {
            filter.currentPrice = {};
            if (minPrice) filter.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.currentPrice.$lte = parseFloat(maxPrice);
        }

        if (inStock !== undefined) {
            filter.inStock = inStock === 'true';
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        }));

        res.json({
            products: formattedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        res.json({ product: formattedProduct });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body,
            createdBy: req.user.id
        };

        const product = new Product(productData);
        await product.save();

        const userTimezone = req.user.timezone;
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        res.status(201).json({
            message: 'Продукт успешно создан',
            product: formattedProduct
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'currentPrice', 'stockQuantity', 'category', 'animalType', 'imageUrl', 'minStockLevel', 'inStock'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Недопустимые поля для обновления' });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        updates.forEach(update => product[update] = req.body[update]);
        await product.save();

        const userTimezone = req.user.timezone;
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        res.json({
            message: 'Продукт успешно обновлен',
            product: formattedProduct
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        res.json({ message: 'Продукт успешно удален' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.json({ products: [] });
        }

        const products = await Product.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });

        res.json({ products });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProductStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stockQuantity' },
                    avgPrice: { $avg: '$currentPrice' },
                    minPrice: { $min: '$currentPrice' },
                    maxPrice: { $max: '$currentPrice' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({
            stockQuantity: { $lt: 10 }
        });

        res.json({
            stats,
            summary: {
                totalProducts,
                lowStockProducts,
                lowStockPercentage: (lowStockProducts / totalProducts * 100).toFixed(2)
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductStats
};