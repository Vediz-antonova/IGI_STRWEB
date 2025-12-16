const Product = require('../models/Product');
const { formatDateWithTimezone } = require('../utils/timezone');

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
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
        if (category) filter.category = category;
        if (animalType) filter.animalType = animalType;
        if (search && search.trim() !== '') {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (minPrice || maxPrice) {
            filter.currentPrice = {};
            if (minPrice) filter.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.currentPrice.$lte = parseFloat(maxPrice);
        }
        if (inStock && inStock !== '') {
            filter.inStock = inStock === 'true';
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
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

        sendResponse(res, true, 'Список продуктов получен', {
            products: formattedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return sendResponse(res, false, 'Продукт не найден', null, 404);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Продукт найден', { product: formattedProduct });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, sku, category, animalType, currentPrice } = req.body;
        if (!name || !sku || !category || !animalType || !currentPrice) {
            return sendResponse(res, false, 'Обязательные поля: name, sku, category, animalType, currentPrice', null, 400);
        }

        const existing = await Product.findOne({ sku });
        if (existing) return sendResponse(res, false, 'Продукт с таким SKU уже существует', null, 400);

        const product = new Product({ ...req.body, createdBy: req.user.id });
        await product.save();

        const userTimezone = req.user.timezone;
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Продукт успешно создан', { product: formattedProduct }, 201);
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updateProduct = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'description', 'currentPrice', 'stockQuantity', 'category', 'animalType', 'imageUrl', 'minStockLevel', 'inStock'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);

        const product = await Product.findById(req.params.id);
        if (!product) return sendResponse(res, false, 'Продукт не найден', null, 404);

        updates.forEach(update => product[update] = req.body[update]);
        product.updatedAt = Date.now();
        await product.save();

        const userTimezone = req.user.timezone;
        const formattedProduct = {
            ...product.toObject(),
            createdAtLocal: formatDateWithTimezone(product.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(product.updatedAt, userTimezone),
            createdAtUTC: product.createdAt.toISOString(),
            updatedAtUTC: product.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Продукт успешно обновлен', { product: formattedProduct });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return sendResponse(res, false, 'Продукт не найден', null, 404);

        await product.deleteOne();

        sendResponse(res, true, 'Продукт успешно удален');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') return sendResponse(res, true, 'Поиск пустой', { products: [] });

        const products = await Product.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });

        sendResponse(res, true, 'Результаты поиска', { products });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
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
            { $sort: { count: -1 } }
        ]);

        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({
            $expr: { $lt: ['$stockQuantity', '$minStockLevel'] }
        });

        sendResponse(res, true, 'Статистика по продуктам', {
            stats,
            summary: {
                totalProducts,
                lowStockProducts,
                lowStockPercentage: totalProducts > 0 ? (lowStockProducts / totalProducts * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
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