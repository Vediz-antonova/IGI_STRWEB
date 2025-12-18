const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { formatDateWithTimezone } = require('../utils/timezone');

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

const getAllPurchases = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            orderId,
            supplierId,
            productId,
            startDate,
            endDate,
            status,
            sortBy = 'purchaseDate',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        if (orderId) filter.order = orderId;
        if (supplierId) filter.supplier = supplierId;
        if (productId) filter.product = productId;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [purchases, total] = await Promise.all([
            Purchase.find(filter)
                .populate('order', 'orderNumber status')
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
            totalCost: purchase.quantity * purchase.purchasePrice
        }));

        sendResponse(res, true, 'Список закупок получен', {
            purchases: formattedPurchases,
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

const getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('order', 'orderNumber status totalCost')
            .populate('product', 'name sku currentPrice category')
            .populate('supplier', 'name address phone email')
            .populate('createdBy', 'username email');

        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPurchase = {
            ...purchase.toObject(),
            purchaseDateLocal: formatDateWithTimezone(purchase.purchaseDate, userTimezone),
            deliveryDateLocal: purchase.deliveryDate ? formatDateWithTimezone(purchase.deliveryDate, userTimezone) : null,
            purchaseDateUTC: purchase.purchaseDate.toISOString(),
            deliveryDateUTC: purchase.deliveryDate ? purchase.deliveryDate.toISOString() : null
        };

        sendResponse(res, true, 'Закупка найдена', { purchase: formattedPurchase });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updatePurchase = async (req, res) => {
    try {
        const allowedUpdates = ['quantity', 'purchasePrice', 'deliveryDate', 'notes'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);

        const purchase = await Purchase.findById(req.params.id).populate('order product supplier');
        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        if (purchase.order.status !== 'created') {
            return sendResponse(res, false, 'Нельзя редактировать закупку в подтвержденном заказе', null, 400);
        }

        const supplierProduct = purchase.supplier.products.find(p => p.product.toString() === purchase.product._id.toString());
        if (!supplierProduct) return sendResponse(res, false, 'У поставщика нет такого товара', null, 400);

        const oldQuantity = purchase.quantity;
        const newQuantity = req.body.quantity || oldQuantity;
        const quantityDiff = newQuantity - oldQuantity;

        if (quantityDiff > 0) {
            if (supplierProduct.stockQuantity < quantityDiff) {
                return sendResponse(res, false, 'Недостаточно товара на складе поставщика', null, 400);
            }
            supplierProduct.stockQuantity -= quantityDiff;
        } else if (quantityDiff < 0) {
            supplierProduct.stockQuantity += Math.abs(quantityDiff);
        }

        updates.forEach(update => purchase[update] = req.body[update]);
        await purchase.save();
        await purchase.supplier.save();

        if (purchase.order) {
            const allPurchases = await Purchase.find({ order: purchase.order._id });
            const totalQuantity = allPurchases.reduce((sum, p) => sum + p.quantity, 0);
            const totalCost = allPurchases.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);

            purchase.order.totalQuantity = totalQuantity;
            purchase.order.totalCost = totalCost;
            await purchase.order.save();
        }

        await purchase.populate('order product supplier createdBy');
        sendResponse(res, true, 'Закупка успешно обновлена', { purchase });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id).populate('order product supplier');
        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        if (purchase.order && purchase.order.status !== 'created') {
            return sendResponse(res, false, 'Нельзя удалить закупку в подтвержденном заказе', null, 400);
        }

        const supplierProduct = purchase.supplier.products.find(p => p.product.toString() === purchase.product._id.toString());
        if (supplierProduct) {
            supplierProduct.stockQuantity += purchase.quantity;
            await purchase.supplier.save();
        }

        const orderId = purchase.order;
        await purchase.deleteOne();

        if (orderId) {
            const remainingPurchases = await Purchase.find({ order: orderId });
            if (remainingPurchases.length === 0) {
                await mongoose.model('Order').findByIdAndDelete(orderId);
            } else {
                const totalQuantity = remainingPurchases.reduce((sum, p) => sum + p.quantity, 0);
                const totalCost = remainingPurchases.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);

                const order = await mongoose.model('Order').findById(orderId);
                order.totalQuantity = totalQuantity;
                order.totalCost = totalCost;
                await order.save();
            }
        }

        sendResponse(res, true, 'Закупка успешно удалена');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
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
                    avgPurchaseValue: { $avg: { $multiply: ['$quantity', '$purchasePrice'] } }
                }
            }
        ]);

        sendResponse(res, true, 'Статистика закупок получена', {
            monthlyStats,
            supplierStats,
            productStats,
            overallStats: overallStats[0] || {}
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getPurchaseStats
};