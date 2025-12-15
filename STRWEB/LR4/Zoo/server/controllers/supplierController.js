const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { formatDateWithTimezone } = require('../utils/timezone');

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

        if (city) {
            filter['address.city'] = city;
        }

        if (minRating) {
            filter.rating = { $gte: parseFloat(minRating) };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } }
            ];
        }

        if (activeOnly === 'true') {
            filter.isActive = true;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [suppliers, total] = await Promise.all([
            Supplier.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
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

        res.json({
            suppliers: formattedSuppliers,
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

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedSupplier = {
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        };

        res.json({ supplier: formattedSupplier });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createSupplier = async (req, res) => {
    try {
        const supplierData = {
            ...req.body,
            createdBy: req.user.id
        };

        const supplier = new Supplier(supplierData);
        await supplier.save();

        const userTimezone = req.user.timezone;
        const formattedSupplier = {
            ...supplier.toObject(),
            createdAtLocal: formatDateWithTimezone(supplier.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(supplier.updatedAt, userTimezone),
            createdAtUTC: supplier.createdAt.toISOString(),
            updatedAtUTC: supplier.updatedAt.toISOString()
        };

        res.status(201).json({
            message: 'Поставщик успешно создан',
            supplier: formattedSupplier
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'address', 'phone', 'email', 'rating', 'isActive'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Недопустимые поля для обновления' });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

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

        res.json({
            message: 'Поставщик успешно обновлен',
            supplier: formattedSupplier
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        const purchasesCount = await Purchase.countDocuments({ supplier: supplier._id });

        if (purchasesCount > 0) {
            supplier.isActive = false;
            await supplier.save();

            return res.json({
                message: 'Поставщик деактивирован (есть связанные закупки)',
                supplier
            });
        }

        await supplier.deleteOne();
        res.json({ message: 'Поставщик успешно удален' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getSupplierStats = async (req, res) => {
    try {
        const supplierId = req.params.id;

        const stats = await Purchase.aggregate([
            { $match: { supplier: require('mongoose').Types.ObjectId.createFromHexString(supplierId) } },
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

        res.json({
            supplier: supplier,
            stats: stats[0] || {},
            metrics: {
                activeProductsCount: activeProducts.length,
                purchaseFrequency: stats[0] ? (stats[0].totalPurchases / 30).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
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

        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [purchases, total] = await Promise.all([
            Purchase.find(filter)
                .populate('product', 'name sku currentPrice')
                .sort({ purchaseDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Purchase.countDocuments(filter)
        ]);

        res.json({
            purchases,
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

const getSuppliersByCity = async (req, res) => {
    try {
        const { city } = req.params;

        const suppliers = await Supplier.find({
            'address.city': { $regex: city, $options: 'i' },
            isActive: true
        }).sort({ rating: -1 });

        res.json({ suppliers });
    } catch (error) {
        res.status(400).json({ error: error.message });
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