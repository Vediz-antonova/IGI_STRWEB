const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const mongoose = require('mongoose');
const { formatDateWithTimezone } = require('../utils/timezone');

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

const getAllSuppliers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            city,
            minRating,
            search,
            sortBy = 'rating',
            sortOrder = 'desc',
            activeOnly = 'true'
        } = req.query;

        const filter = {};
        if (city) filter['address.city'] = city;
        if (minRating) filter.rating = { $gte: parseFloat(minRating) };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } }
            ];
        }
        if (activeOnly === 'true') filter.isActive = true;

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [suppliers, total] = await Promise.all([
            Supplier.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
            Supplier.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedSuppliers = suppliers.map(supplier => ({
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        }));

        sendResponse(res, true, 'Список поставщиков получен', {
            suppliers: formattedSuppliers,
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

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return sendResponse(res, false, 'Поставщик не найден', null, 404);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedSupplier = {
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Поставщик найден', { supplier: formattedSupplier });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createSupplier = async (req, res) => {
    try {
        const { name, address, phone, email } = req.body;
        if (!name || !address || !phone || !email) {
            return sendResponse(res, false, 'Обязательные поля: name, address, phone, email', null, 400);
        }

        const existing = await Supplier.findOne({ email });
        if (existing) return sendResponse(res, false, 'Поставщик с таким email уже существует', null, 400);

        const supplier = new Supplier({ ...req.body, createdBy: req.user.id });
        await supplier.save();

        const userTimezone = req.user.timezone;
        const formattedSupplier = {
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Поставщик успешно создан', { supplier: formattedSupplier }, 201);
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updateSupplier = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'address', 'phone', 'email', 'rating', 'isActive'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);

        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return sendResponse(res, false, 'Поставщик не найден', null, 404);

        updates.forEach(update => supplier[update] = req.body[update]);
        await supplier.save();

        const userTimezone = req.user.timezone;
        const formattedSupplier = {
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        };

        sendResponse(res, true, 'Поставщик успешно обновлен', { supplier: formattedSupplier });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return sendResponse(res, false, 'Поставщик не найден', null, 404);

        const purchasesCount = await Purchase.countDocuments({ supplier: supplier._id });
        if (purchasesCount > 0) {
            supplier.isActive = false;
            await supplier.save();
            return sendResponse(res, true, 'Поставщик деактивирован (есть связанные закупки)', { supplier });
        }

        await supplier.deleteOne();
        sendResponse(res, true, 'Поставщик успешно удален');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getSupplierStats = async (req, res) => {
    try {
        const supplierId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return sendResponse(res, false, 'Некорректный ID поставщика', null, 400);
        }

        const stats = await Purchase.aggregate([
            { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
            {
                $group: {
                    _id: '$supplier',
                    totalPurchases: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                    avgPurchasePrice: { $avg: '$purchasePrice' },
                    lastPurchaseDate: { $max: '$purchaseDate' }
                }
            }
        ]);

        const supplier = await Supplier.findById(supplierId);
        const activeProducts = await Purchase.distinct('product', { supplier: supplierId });

        sendResponse(res, true, 'Статистика по поставщику получена', {
            supplier,
            stats: stats[0] || {},
            metrics: {
                activeProductsCount: activeProducts.length,
                purchaseFrequency: stats[0] ? (stats[0].totalPurchases / 30).toFixed(2) : 0
            }
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getSupplierPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate, status } = req.query;
        const supplierId = req.params.id;

        const filter = { supplier: supplierId };
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [purchases, total] = await Promise.all([
            Purchase.find(filter)
                .populate('product', 'name sku currentPrice')
                .sort({ purchaseDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Purchase.countDocuments(filter)
        ]);

        sendResponse(res, true, 'Закупки поставщика получены', {
            purchases,
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

const getSuppliersByCity = async (req, res) => {
    try {
        const { city } = req.params;

        const suppliers = await Supplier.find({
            'address.city': { $regex: city, $options: 'i' },
            isActive: true
        }).sort({ rating: -1 });

        sendResponse(res, true, 'Поставщики по городу получены', { suppliers });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierStats,
    getSupplierPurchases,
    getSuppliersByCity
};