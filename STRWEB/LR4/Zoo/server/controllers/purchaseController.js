const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { formatDateWithTimezone } = require('../utils/timezone');

const getAllPurchases = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            supplierId,
            productId,
            startDate,
            endDate,
            status,
            sortBy = 'purchaseDate',
            sortOrder = 'desc',
            minAmount,
            maxAmount
        } = req.query;

        const filter = {};

        if (supplierId) {
            filter.supplier = supplierId;
        }

        if (productId) {
            filter.product = productId;
        }

        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }

        if (status) {
            filter.status = status;
        }

        if (minAmount || maxAmount) {
            const amountFilter = await Purchase.aggregate([
                { $addFields: { totalAmount: { $multiply: ['$quantity', '$purchasePrice'] } } },
                { $match: {} }
            ]);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [purchases, total] = await Promise.all([
            Purchase.find(filter)
                .populate('product', 'name sku category')
                .populate('supplier', 'name address.city')
                .populate('createdBy', 'username email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Purchase.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPurchases = purchases.map(purchase => ({
            ...purchase.toObject(),
            purchaseDateLocal: formatDateWithTimezone(purchase.purchaseDate, userTimezone),
            deliveryDateLocal: purchase.deliveryDate ? formatDateWithTimezone(purchase.deliveryDate, userTimezone) : null,
            purchaseDateUTC: purchase.purchaseDate.toISOString(),
            deliveryDateUTC: purchase.deliveryDate ? purchase.deliveryDate.toISOString() : null,
            createdAtLocal: formatDateWithTimezone(purchase.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(purchase.updatedAt, userTimezone)
        }));

        const stats = await Purchase.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                    avgUnitPrice: { $avg: '$purchasePrice' }
                }
            }
        ]);

        res.json({
            purchases: formattedPurchases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats[0] || {}
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('product', 'name sku currentPrice category')
            .populate('supplier', 'name address phone email')
            .populate('createdBy', 'username email');

        if (!purchase) {
            return res.status(404).json({ error: 'Закупка не найдена' });
        }

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPurchase = {
            ...purchase.toObject(),
            purchaseDateLocal: formatDateWithTimezone(purchase.purchaseDate, userTimezone),
            deliveryDateLocal: purchase.deliveryDate ? formatDateWithTimezone(purchase.deliveryDate, userTimezone) : null,
            purchaseDateUTC: purchase.purchaseDate.toISOString(),
            deliveryDateUTC: purchase.deliveryDate ? purchase.deliveryDate.toISOString() : null,
            createdAtLocal: formatDateWithTimezone(purchase.createdAt, userTimezone),
            updatedAtLocal: formatDateWithTimezone(purchase.updatedAt, userTimezone)
        };

        res.json({ purchase: formattedPurchase });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createPurchase = async (req, res) => {
    try {
        const { product: productId, supplier: supplierId, quantity, purchasePrice } = req.body;

        const [product, supplier] = await Promise.all([
            Product.findById(productId),
            Supplier.findById(supplierId)
        ]);

        if (!product) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        if (!supplier.isActive) {
            return res.status(400).json({ error: 'Поставщик неактивен' });
        }

        const purchaseData = {
            ...req.body,
            createdBy: req.user.id,
            status: req.body.status || 'ordered'
        };

        const purchase = new Purchase(purchaseData);
        await purchase.save();

        if (purchase.status === 'delivered') {
            product.stockQuantity += purchase.quantity;
            await product.save();
        }

        await purchase.populate('product supplier createdBy');

        const userTimezone = req.user.timezone;
        const formattedPurchase = {
            ...purchase.toObject(),
            purchaseDateLocal: formatDateWithTimezone(purchase.purchaseDate, userTimezone),
            deliveryDateLocal: purchase.deliveryDate ? formatDateWithTimezone(purchase.deliveryDate, userTimezone) : null,
            purchaseDateUTC: purchase.purchaseDate.toISOString(),
            deliveryDateUTC: purchase.deliveryDate ? purchase.deliveryDate.toISOString() : null
        };

        res.status(201).json({
            message: 'Закупка успешно создана',
            purchase: formattedPurchase
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePurchase = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['quantity', 'purchasePrice', 'purchaseDate', 'deliveryDate', 'status', 'invoiceNumber', 'notes'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Недопустимые поля для обновления' });
        }

        const purchase = await Purchase.findById(req.params.id)
            .populate('product');

        if (!purchase) {
            return res.status(404).json({ error: 'Закупка не найдена' });
        }

        const oldStatus = purchase.status;
        const oldQuantity = purchase.quantity;
        const product = purchase.product;

        updates.forEach(update => purchase[update] = req.body[update]);
        await purchase.save();

        if (product && (oldStatus !== purchase.status || oldQuantity !== purchase.quantity)) {
            let stockAdjustment = 0;

            if (oldStatus !== 'delivered' && purchase.status === 'delivered') {
                stockAdjustment += purchase.quantity;
            }
            else if (oldStatus === 'delivered' && purchase.status !== 'delivered') {
                stockAdjustment -= oldQuantity;
            }
            else if (purchase.status === 'delivered' && oldQuantity !== purchase.quantity) {
                stockAdjustment += (purchase.quantity - oldQuantity);
            }

            if (stockAdjustment !== 0) {
                product.stockQuantity += stockAdjustment;
                await product.save();
            }
        }

        await purchase.populate('product supplier createdBy');

        const userTimezone = req.user.timezone;
        const formattedPurchase = {
            ...purchase.toObject(),
            purchaseDateLocal: formatDateWithTimezone(purchase.purchaseDate, userTimezone),
            deliveryDateLocal: purchase.deliveryDate ? formatDateWithTimezone(purchase.deliveryDate, userTimezone) : null,
            purchaseDateUTC: purchase.purchaseDate.toISOString(),
            deliveryDateUTC: purchase.deliveryDate ? purchase.deliveryDate.toISOString() : null
        };

        res.json({
            message: 'Закупка успешно обновлена',
            purchase: formattedPurchase
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('product');

        if (!purchase) {
            return res.status(404).json({ error: 'Закупка не найдена' });
        }

        if (purchase.status === 'delivered' && purchase.product) {
            purchase.product.stockQuantity -= purchase.quantity;
            await purchase.product.save();
        }

        await purchase.deleteOne();
        res.json({ message: 'Закупка успешно удалена' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePurchaseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['ordered', 'pending', 'delivered', 'cancelled'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        const purchase = await Purchase.findById(req.params.id)
            .populate('product');

        if (!purchase) {
            return res.status(404).json({ error: 'Закупка не найдена' });
        }

        const oldStatus = purchase.status;
        purchase.status = status;
        await purchase.save();

        if (purchase.product) {
            if (oldStatus !== 'delivered' && status === 'delivered') {
                purchase.product.stockQuantity += purchase.quantity;
                await purchase.product.save();
            } else if (oldStatus === 'delivered' && status !== 'delivered') {
                purchase.product.stockQuantity -= purchase.quantity;
                await purchase.product.save();
            }
        }

        res.json({
            message: `Статус закупки обновлен на "${status}"`,
            purchase
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getPurchaseStats = async (req, res) => {
    try {
        const { startDate, endDate, supplierId, productId } = req.query;

        const matchFilter = {};

        if (startDate || endDate) {
            matchFilter.purchaseDate = {};
            if (startDate) matchFilter.purchaseDate.$gte = new Date(startDate);
            if (endDate) matchFilter.purchaseDate.$lte = new Date(endDate);
        }

        if (supplierId) {
            matchFilter.supplier = supplierId;
        }

        if (productId) {
            matchFilter.product = productId;
        }

        const monthlyStats = await Purchase.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$purchaseDate' },
                        month: { $month: '$purchaseDate' }
                    },
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                    avgPrice: { $avg: '$purchasePrice' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        const supplierStats = await Purchase.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$supplier',
                    count: { $sum: 1 },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } }
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: 10 }
        ]);

        const productStats = await Purchase.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$product',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } }
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: 10 }
        ]);

        const overallStats = await Purchase.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: 1 },
                    totalItems: { $sum: '$quantity' },
                    totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                    avgOrderValue: { $avg: { $multiply: ['$quantity', '$purchasePrice'] } }
                }
            }
        ]);

        const populatedSupplierStats = await Promise.all(
            supplierStats.map(async stat => {
                const supplier = await Supplier.findById(stat._id);
                return {
                    ...stat,
                    supplierName: supplier ? supplier.name : 'Неизвестный поставщик'
                };
            })
        );

        const populatedProductStats = await Promise.all(
            productStats.map(async stat => {
                const product = await Product.findById(stat._id);
                return {
                    ...stat,
                    productName: product ? product.name : 'Неизвестный продукт',
                    sku: product ? product.sku : 'N/A'
                };
            })
        );

        res.json({
            monthlyStats,
            supplierStats: populatedSupplierStats,
            productStats: populatedProductStats,
            overallStats: overallStats[0] || {}
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getUpcomingDeliveries = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingDeliveries = await Purchase.find({
            status: { $in: ['ordered', 'pending'] },
            deliveryDate: { $gte: today, $lte: nextWeek }
        })
            .populate('product', 'name sku')
            .populate('supplier', 'name phone')
            .sort({ deliveryDate: 1 });

        res.json({ upcomingDeliveries });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase,
    updatePurchaseStatus,
    getPurchaseStats,
    getUpcomingDeliveries
};