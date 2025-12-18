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
            limit = 5,
            supplierId,
            productId,
            startDate,
            endDate,
            status,
            sortBy = 'purchaseDate',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
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
            updatedAtLocal: formatDateWithTimezone(purchase.updatedAt, userTimezone),
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

const createPurchase = async (req, res) => {
    try {
        const { product: productId, supplier: supplierId, quantity, purchasePrice } = req.body;
        if (!productId || !supplierId || !quantity || !purchasePrice) {
            return sendResponse(res, false, 'Обязательные поля: product, supplier, quantity, purchasePrice', null, 400);
        }

        const [product, supplier] = await Promise.all([
            Product.findById(productId),
            Supplier.findById(supplierId)
        ]);

        if (!product) return sendResponse(res, false, 'Продукт не найден', null, 404);
        if (!supplier) return sendResponse(res, false, 'Поставщик не найден', null, 404);
        if (!supplier.isActive) return sendResponse(res, false, 'Поставщик неактивен', null, 400);

        const supplierProductItem = supplier.products.find(p => p.product.toString() === productId);
        if (!supplierProductItem) {
            return sendResponse(res, false, 'У поставщика нет такого товара', null, 400);
        }
        if (quantity > supplierProductItem.stockQuantity) {
            return sendResponse(res, false, 'Недостаточно товара на складе поставщика', null, 400);
        }

        const purchase = new Purchase({
            product: productId,
            supplier: supplierId,
            quantity,
            purchasePrice,
            createdBy: req.user.id,
            status: req.body.status || 'ordered'
        });
        await purchase.save();

        supplierProductItem.stockQuantity -= quantity;
        await supplier.save();

        if (purchase.status === 'delivered') {
            product.stockQuantity = (product.stockQuantity || 0) + quantity;
            await product.save();
        }

        await purchase.populate('product supplier createdBy');
        sendResponse(res, true, 'Закупка успешно создана', { purchase }, 201);
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updatePurchase = async (req, res) => {
    try {
        const allowedUpdates = ['quantity', 'purchasePrice', 'purchaseDate', 'deliveryDate', 'status', 'invoiceNumber', 'notes'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);

        const purchase = await Purchase.findById(req.params.id).populate('product supplier');
        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        const supplierProduct = purchase.supplier.products.find(p => p.product.toString() === purchase.product._id.toString());
        if (!supplierProduct) return sendResponse(res, false, 'У поставщика нет такого товара', null, 400);

        const oldStatus = purchase.status;
        const oldQuantity = purchase.quantity;

        updates.forEach(update => purchase[update] = req.body[update]);
        await purchase.save();

        let stockAdjustment = 0;
        if (oldStatus !== 'delivered' && purchase.status === 'delivered') {
            stockAdjustment -= purchase.quantity;
        } else if (oldStatus === 'delivered' && purchase.status !== 'delivered') {
            stockAdjustment += oldQuantity;
        } else if (purchase.status === 'delivered' && oldQuantity !== purchase.quantity) {
            stockAdjustment -= (purchase.quantity - oldQuantity);
        }

        if (stockAdjustment !== 0) {
            if (supplierProduct.stockQuantity + stockAdjustment < 0) {
                return sendResponse(res, false, 'Недостаточно товара на складе поставщика', null, 400);
            }
            supplierProduct.stockQuantity += stockAdjustment;
            await purchase.supplier.save();
        }

        await purchase.populate('product supplier createdBy');
        sendResponse(res, true, 'Закупка успешно обновлена', { purchase });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id).populate('product supplier');
        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        const supplierProduct = purchase.supplier.products.find(p => p.product.toString() === purchase.product._id.toString());

        if (purchase.status === 'delivered' && supplierProduct) {
            supplierProduct.stockQuantity += purchase.quantity; // возвращаем остаток
            await purchase.supplier.save();
        }

        await purchase.deleteOne();
        sendResponse(res, true, 'Закупка успешно удалена');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updatePurchaseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['ordered', 'pending', 'delivered', 'cancelled'];
        if (!allowedStatuses.includes(status)) return sendResponse(res, false, 'Недопустимый статус', null, 400);

        const purchase = await Purchase.findById(req.params.id).populate('product supplier');
        if (!purchase) return sendResponse(res, false, 'Закупка не найдена', null, 404);

        const supplierProduct = purchase.supplier.products.find(p => p.product.toString() === purchase.product._id.toString());
        if (!supplierProduct) return sendResponse(res, false, 'У поставщика нет такого товара', null, 400);

        const oldStatus = purchase.status;
        purchase.status = status;
        await purchase.save();

        if (oldStatus !== 'delivered' && status === 'delivered') {
            supplierProduct.stockQuantity -= purchase.quantity;
        } else if (oldStatus === 'delivered' && status !== 'delivered') {
            supplierProduct.stockQuantity += purchase.quantity;
        }
        await purchase.supplier.save();

        sendResponse(res, true, `Статус закупки обновлен на "${status}"`, { purchase });
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
                    avgOrderValue: { $avg: { $multiply: ['$quantity', '$purchasePrice'] } }
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

        sendResponse(res, true, 'Ближайшие поставки получены', {
            upcomingDeliveries,
            totalUpcoming: upcomingDeliveries.length
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createBulkPurchases = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return sendResponse(res, false, 'Нет товаров для заказа', null, 400);
        }

        const results = [];
        const errors = [];

        for (const item of items) {
            try {
                const [product, supplier] = await Promise.all([
                    Product.findById(item.productId),
                    Supplier.findById(item.supplierId)
                ]);

                if (!product) {
                    errors.push({ productId: item.productId, error: 'Товар не найден' });
                    continue;
                }

                if (!supplier) {
                    errors.push({ productId: item.productId, error: 'Поставщик не найден' });
                    continue;
                }

                const supplierProduct = supplier.products.find(p =>
                    p.product.toString() === item.productId
                );

                if (!supplierProduct) {
                    errors.push({ productId: item.productId, error: 'У поставщика нет этого товара' });
                    continue;
                }

                if (supplierProduct.stockQuantity < item.quantity) {
                    errors.push({
                        productId: item.productId,
                        error: `Недостаточно товара (остаток: ${supplierProduct.stockQuantity})`
                    });
                    continue;
                }

                const purchase = new Purchase({
                    product: item.productId,
                    supplier: item.supplierId,
                    quantity: item.quantity,
                    purchasePrice: item.price || product.currentPrice,
                    status: 'ordered',
                    createdBy: req.user.id
                });

                await purchase.save();

                supplierProduct.stockQuantity -= item.quantity;
                await supplier.save();

                results.push({
                    productId: item.productId,
                    purchaseId: purchase._id,
                    status: 'created'
                });

            } catch (error) {
                errors.push({ productId: item.productId, error: error.message });
            }
        }

        sendResponse(res, true, 'Массовый заказ обработан', {
            created: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
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
    getUpcomingDeliveries,
    createBulkPurchases
};