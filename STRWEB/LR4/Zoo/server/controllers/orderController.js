const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { formatDateWithTimezone } = require('../utils/timezone');

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            supplierId,
            status,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        if (supplierId) filter.supplier = supplierId;
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('supplier', 'name address.city')
                .populate('createdBy', 'username email')
                .populate({
                    path: 'purchases',
                    populate: { path: 'product', select: 'name sku' }
                })
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedOrders = orders.map(order => ({
            ...order.toObject(),
            createdAtLocal: formatDateWithTimezone(order.createdAt, userTimezone),
            deliveryDateLocal: order.deliveryDate ? formatDateWithTimezone(order.deliveryDate, userTimezone) : null,
            estimatedDeliveryDateLocal: order.estimatedDeliveryDate ? formatDateWithTimezone(order.estimatedDeliveryDate, userTimezone) : null,
            createdAtUTC: order.createdAt.toISOString(),
            deliveryDateUTC: order.deliveryDate ? order.deliveryDate.toISOString() : null
        }));

        sendResponse(res, true, 'Список заказов получен', {
            orders: formattedOrders,
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

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('supplier', 'name address phone email')
            .populate('createdBy', 'username email')
            .populate({
                path: 'purchases',
                populate: [
                    { path: 'product', select: 'name sku currentPrice category' },
                    { path: 'supplier', select: 'name phone' }
                ]
            });

        if (!order) return sendResponse(res, false, 'Заказ не найден', null, 404);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedOrder = {
            ...order.toObject(),
            createdAtLocal: formatDateWithTimezone(order.createdAt, userTimezone),
            deliveryDateLocal: order.deliveryDate ? formatDateWithTimezone(order.deliveryDate, userTimezone) : null,
            estimatedDeliveryDateLocal: order.estimatedDeliveryDate ? formatDateWithTimezone(order.estimatedDeliveryDate, userTimezone) : null,
            createdAtUTC: order.createdAt.toISOString(),
            deliveryDateUTC: order.deliveryDate ? order.deliveryDate.toISOString() : null
        };

        sendResponse(res, true, 'Заказ найден', { order: formattedOrder });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createOrder = async (req, res) => {
    try {
        const { supplier: supplierId, purchases: purchaseItems, deliveryAddress, estimatedDeliveryDate, notes } = req.body;

        if (!supplierId || !purchaseItems || !Array.isArray(purchaseItems) || purchaseItems.length === 0) {
            return sendResponse(res, false, 'Обязательные поля: supplier, purchases (массив)', null, 400);
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) return sendResponse(res, false, 'Поставщик не найден', null, 404);
        if (!supplier.isActive) return sendResponse(res, false, 'Поставщик неактивен', null, 400);

        let totalQuantity = 0;
        let totalCost = 0;
        const createdPurchases = [];
        const errors = [];

        for (const item of purchaseItems) {
            const { productId, quantity, price } = item;

            if (!productId || !quantity || !price) {
                errors.push(`Неверные данные для товара: ${productId}`);
                continue;
            }

            const product = await Product.findById(productId);
            if (!product) {
                errors.push(`Товар ${productId} не найден`);
                continue;
            }

            const supplierProduct = supplier.products.find(p => p.product.toString() === productId);
            if (!supplierProduct) {
                errors.push(`У поставщика нет товара ${product.name}`);
                continue;
            }

            if (supplierProduct.stockQuantity < quantity) {
                errors.push(`Недостаточно товара ${product.name} (остаток: ${supplierProduct.stockQuantity})`);
                continue;
            }

            totalQuantity += quantity;
            totalCost += quantity * price;
        }

        if (errors.length > 0) {
            return sendResponse(res, false, 'Ошибки при проверке товаров', errors, 400);
        }

        const year = new Date().getFullYear();
        const count = await Order.countDocuments({
            createdAt: { $gte: new Date(year, 0, 1) }
        });
        const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;

        const order = new Order({
            orderNumber,
            supplier: supplierId,
            totalQuantity,
            totalCost,
            status: 'created',
            deliveryAddress: deliveryAddress || {
                street: supplier.address.street,
                city: supplier.address.city,
                country: supplier.address.country
            },
            estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes,
            createdBy: req.user.id
        });

        await order.save();

        for (const item of purchaseItems) {
            const { productId, quantity, price } = item;
            const product = await Product.findById(productId);
            const supplierProduct = supplier.products.find(p => p.product.toString() === productId);

            const purchase = new Purchase({
                order: order._id,
                product: productId,
                supplier: supplierId,
                quantity,
                purchasePrice: price,
                purchaseDate: new Date(),
                status: 'ordered',
                createdBy: req.user.id
            });

            await purchase.save();

            supplierProduct.stockQuantity -= quantity;
            createdPurchases.push(purchase._id);
        }

        await supplier.save();

        order.purchases = createdPurchases;
        await order.save();

        await order.populate('supplier createdBy');
        await order.populate({
            path: 'purchases',
            populate: { path: 'product', select: 'name sku' }
        });

        sendResponse(res, true, 'Заказ успешно создан', { order }, 201);
    } catch (error) {
        console.error('Error creating order:', error);
        sendResponse(res, false, error.message, null, 400);
    }
};

const updateOrder = async (req, res) => {
    try {
        const allowedUpdates = ['status', 'deliveryDate', 'estimatedDeliveryDate', 'deliveryAddress', 'notes'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);

        const order = await Order.findById(req.params.id);
        if (!order) return sendResponse(res, false, 'Заказ не найден', null, 404);

        const oldStatus = order.status;
        const newStatus = req.body.status;

        updates.forEach(update => order[update] = req.body[update]);
        await order.save();

        if (oldStatus !== newStatus && newStatus) {
            await Purchase.updateMany(
                { order: order._id },
                { $set: { status: newStatus === 'delivered' ? 'delivered' : 'ordered' } }
            );

            if (newStatus === 'delivered') {
                const purchases = await Purchase.find({ order: order._id }).populate('product');
                for (const purchase of purchases) {
                    if (purchase.product) {
                        purchase.product.stockQuantity += purchase.quantity;
                        await purchase.product.save();
                    }
                }
            }
        }

        await order.populate('supplier createdBy');
        await order.populate({
            path: 'purchases',
            populate: { path: 'product', select: 'name sku' }
        });

        sendResponse(res, true, 'Заказ успешно обновлен', { order });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('supplier');
        if (!order) return sendResponse(res, false, 'Заказ не найден', null, 404);

        if (order.status !== 'created' && order.status !== 'cancelled') {
            return sendResponse(res, false, 'Нельзя удалить заказ в статусе отличном от "created" или "cancelled"', null, 400);
        }

        const purchases = await Purchase.find({ order: order._id }).populate('supplier');
        for (const purchase of purchases) {
            const supplierProduct = purchase.supplier.products.find(p =>
                p.product.toString() === purchase.product.toString()
            );
            if (supplierProduct) {
                supplierProduct.stockQuantity += purchase.quantity;
                await purchase.supplier.save();
            }
        }

        await Purchase.deleteMany({ order: order._id });
        await order.deleteOne();

        sendResponse(res, true, 'Заказ успешно удален');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['created', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!allowedStatuses.includes(status)) return sendResponse(res, false, 'Недопустимый статус', null, 400);

        const order = await Order.findById(req.params.id);
        if (!order) return sendResponse(res, false, 'Заказ не найден', null, 404);

        const oldStatus = order.status;
        order.status = status;

        if (status === 'cancelled') {
            const purchases = await Purchase.find({ order: order._id }).populate('supplier');
            for (const purchase of purchases) {
                const supplierProduct = purchase.supplier.products.find(p =>
                    p.product.toString() === purchase.product.toString()
                );
                if (supplierProduct) {
                    supplierProduct.stockQuantity += purchase.quantity;
                    await purchase.supplier.save();
                }
                purchase.status = 'cancelled';
                await purchase.save();
            }
        } else if (status === 'delivered') {
            order.deliveryDate = new Date();
            const purchases = await Purchase.find({ order: order._id }).populate('product');
            for (const purchase of purchases) {
                purchase.status = 'delivered';
                purchase.deliveryDate = new Date();
                await purchase.save();

                if (purchase.product) {
                    purchase.product.stockQuantity += purchase.quantity;
                    await purchase.product.save();
                }
            }
        } else {
            await Purchase.updateMany(
                { order: order._id },
                { $set: { status: 'ordered' } }
            );
        }

        await order.save();

        await order.populate('supplier createdBy');
        await order.populate({
            path: 'purchases',
            populate: { path: 'product', select: 'name sku' }
        });

        sendResponse(res, true, `Статус заказа обновлен на "${status}"`, { order });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getOrderStats = async (req, res) => {
    try {
        const { startDate, endDate, supplierId } = req.query;
        const matchFilter = {};

        if (startDate || endDate) {
            matchFilter.createdAt = {};
            if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
            if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
        }

        if (supplierId) {
            matchFilter.supplier = supplierId;
        }

        const monthlyStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$totalQuantity' },
                    totalCost: { $sum: '$totalCost' },
                    avgOrderValue: { $avg: '$totalCost' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        const statusStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalCost: { $sum: '$totalCost' }
                }
            }
        ]);

        const supplierStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$supplier',
                    count: { $sum: 1 },
                    totalCost: { $sum: '$totalCost' }
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: 10 }
        ]);

        const overallStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalItems: { $sum: '$totalQuantity' },
                    totalCost: { $sum: '$totalCost' },
                    avgOrderValue: { $avg: '$totalCost' }
                }
            }
        ]);

        sendResponse(res, true, 'Статистика заказов получена', {
            monthlyStats,
            statusStats,
            supplierStats,
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

        const upcomingDeliveries = await Order.find({
            status: { $in: ['confirmed', 'processing', 'shipped'] },
            estimatedDeliveryDate: { $gte: today, $lte: nextWeek }
        })
            .populate('supplier', 'name phone')
            .sort({ estimatedDeliveryDate: 1 });

        sendResponse(res, true, 'Ближайшие поставки получены', {
            upcomingDeliveries,
            totalUpcoming: upcomingDeliveries.length
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createBulkOrders = async (req, res) => {
    try {
        const { orders } = req.body;
        const createdOrders = [];
        const errors = [];

        for (const orderData of orders) {
            try {
                const { supplier: supplierId, purchases: purchaseItems } = orderData;

                const supplier = await Supplier.findById(supplierId);
                if (!supplier) {
                    errors.push({ supplierId, error: 'Поставщик не найден' });
                    continue;
                }

                if (!supplier.isActive) {
                    errors.push({ supplierId, error: 'Поставщик неактивен' });
                    continue;
                }

                const order = new Order({
                    ...orderData,
                    createdBy: req.user.id,
                    status: 'created'
                });

                await order.save();
                createdOrders.push(order);
            } catch (error) {
                errors.push({ orderData, error: error.message });
            }
        }

        sendResponse(res, true, 'Пакетная обработка заказов завершена', {
            created: createdOrders.length,
            errors,
            orders: createdOrders
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrderStats,
    getUpcomingDeliveries,
    createBulkOrders
};