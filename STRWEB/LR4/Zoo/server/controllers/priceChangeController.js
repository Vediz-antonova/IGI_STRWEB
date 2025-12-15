const PriceChange = require('../models/PriceChange');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { formatDateWithTimezone } = require('../utils/timezone');

const getAllPriceChanges = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            productId,
            supplierId,
            startDate,
            endDate,
            notified,
            sortBy = 'changeDate',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};

        if (productId) {
            filter.product = productId;
        }

        if (supplierId) {
            filter.supplier = supplierId;
        }

        if (startDate || endDate) {
            filter.changeDate = {};
            if (startDate) filter.changeDate.$gte = new Date(startDate);
            if (endDate) filter.changeDate.$lte = new Date(endDate);
        }

        if (notified !== undefined) {
            filter.notified = notified === 'true';
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [priceChanges, total] = await Promise.all([
            PriceChange.find(filter)
                .populate('product', 'name sku currentPrice')
                .populate('supplier', 'name')
                .populate('createdBy', 'username')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            PriceChange.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPriceChanges = priceChanges.map(change => ({
            ...change.toObject(),
            changeDateLocal: formatDateWithTimezone(change.changeDate, userTimezone),
            effectiveDateLocal: formatDateWithTimezone(change.effectiveDate, userTimezone),
            changeDateUTC: change.changeDate.toISOString(),
            effectiveDateUTC: change.effectiveDate.toISOString(),
            createdAtLocal: formatDateWithTimezone(change.createdAt, userTimezone),
            percentageChange: ((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(2)
        }));

        res.json({
            priceChanges: formattedPriceChanges,
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

const getPriceChangeById = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id)
            .populate('product', 'name sku category currentPrice')
            .populate('supplier', 'name email phone')
            .populate('createdBy', 'username email');

        if (!priceChange) {
            return res.status(404).json({ error: 'Изменение цены не найдено' });
        }

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPriceChange = {
            ...priceChange.toObject(),
            changeDateLocal: formatDateWithTimezone(priceChange.changeDate, userTimezone),
            effectiveDateLocal: formatDateWithTimezone(priceChange.effectiveDate, userTimezone),
            changeDateUTC: priceChange.changeDate.toISOString(),
            effectiveDateUTC: priceChange.effectiveDate.toISOString(),
            createdAtLocal: formatDateWithTimezone(priceChange.createdAt, userTimezone),
            percentageChange: ((priceChange.newPrice - priceChange.oldPrice) / priceChange.oldPrice * 100).toFixed(2),
            absoluteChange: (priceChange.newPrice - priceChange.oldPrice).toFixed(2)
        };

        res.json({ priceChange: formattedPriceChange });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createPriceChange = async (req, res) => {
    try {
        const { product: productId, supplier: supplierId, newPrice, effectiveDate } = req.body;

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

        const oldPrice = product.currentPrice;

        const priceChangeData = {
            ...req.body,
            oldPrice,
            createdBy: req.user.id,
            notified: req.body.notified || false,
            effectiveDate: effectiveDate || new Date()
        };

        const priceChange = new PriceChange(priceChangeData);
        await priceChange.save();

        if (!effectiveDate || new Date(effectiveDate) <= new Date()) {
            product.currentPrice = newPrice;
            await product.save();
        }

        await priceChange.populate('product supplier createdBy');

        const userTimezone = req.user.timezone;
        const formattedPriceChange = {
            ...priceChange.toObject(),
            changeDateLocal: formatDateWithTimezone(priceChange.changeDate, userTimezone),
            effectiveDateLocal: formatDateWithTimezone(priceChange.effectiveDate, userTimezone),
            changeDateUTC: priceChange.changeDate.toISOString(),
            effectiveDateUTC: priceChange.effectiveDate.toISOString(),
            percentageChange: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
        };

        res.status(201).json({
            message: 'Изменение цены успешно создано',
            priceChange: formattedPriceChange,
            productUpdated: (!effectiveDate || new Date(effectiveDate) <= new Date())
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePriceChange = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['newPrice', 'changeDate', 'effectiveDate', 'reason', 'notified'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Недопустимые поля для обновления' });
        }

        const priceChange = await PriceChange.findById(req.params.id)
            .populate('product');

        if (!priceChange) {
            return res.status(404).json({ error: 'Изменение цены не найдено' });
        }

        const shouldUpdateProductPrice = updates.includes('newPrice') &&
            new Date(priceChange.effectiveDate) <= new Date() &&
            priceChange.product;

        const oldNewPrice = priceChange.newPrice;

        updates.forEach(update => priceChange[update] = req.body[update]);
        await priceChange.save();

        if (shouldUpdateProductPrice && priceChange.product) {
            priceChange.product.currentPrice = priceChange.newPrice;
            await priceChange.product.save();
        }

        await priceChange.populate('product supplier createdBy');

        const userTimezone = req.user.timezone;
        const formattedPriceChange = {
            ...priceChange.toObject(),
            changeDateLocal: formatDateWithTimezone(priceChange.changeDate, userTimezone),
            effectiveDateLocal: formatDateWithTimezone(priceChange.effectiveDate, userTimezone),
            changeDateUTC: priceChange.changeDate.toISOString(),
            effectiveDateUTC: priceChange.effectiveDate.toISOString(),
            percentageChange: ((priceChange.newPrice - priceChange.oldPrice) / priceChange.oldPrice * 100).toFixed(2),
            productUpdated: shouldUpdateProductPrice
        };

        res.json({
            message: 'Изменение цены успешно обновлено',
            priceChange: formattedPriceChange
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deletePriceChange = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id)
            .populate('product');

        if (!priceChange) {
            return res.status(404).json({ error: 'Изменение цены не найдено' });
        }

        if (priceChange.product && new Date(priceChange.effectiveDate) <= new Date()) {
            const previousPriceChange = await PriceChange.findOne({
                product: priceChange.product._id,
                effectiveDate: { $lt: priceChange.effectiveDate }
            }).sort({ effectiveDate: -1 });

            if (previousPriceChange) {
                priceChange.product.currentPrice = previousPriceChange.newPrice;
            } else {
                priceChange.product.currentPrice = priceChange.oldPrice;
            }

            await priceChange.product.save();
        }

        await priceChange.deleteOne();
        res.json({ message: 'Изменение цены успешно удалено' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const markAsNotified = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id);

        if (!priceChange) {
            return res.status(404).json({ error: 'Изменение цены не найдено' });
        }

        priceChange.notified = true;
        await priceChange.save();

        res.json({
            message: 'Изменение цены отмечено как уведомленное',
            priceChange
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getUpcomingPriceChanges = async (req, res) => {
    try {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

        const upcomingChanges = await PriceChange.find({
            effectiveDate: { $gt: today, $lte: nextMonth },
            notified: false
        })
            .populate('product', 'name sku currentPrice')
            .populate('supplier', 'name')
            .sort({ effectiveDate: 1 });

        const changesByDate = upcomingChanges.reduce((acc, change) => {
            const dateKey = change.effectiveDate.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(change);
            return acc;
        }, {});

        res.json({
            upcomingChanges,
            changesByDate,
            totalUpcoming: upcomingChanges.length
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getProductPriceHistory = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { supplierId, limit = 20 } = req.query;

        const filter = { product: productId };

        if (supplierId) {
            filter.supplier = supplierId;
        }

        const priceHistory = await PriceChange.find(filter)
            .populate('supplier', 'name')
            .sort({ effectiveDate: -1 })
            .limit(parseInt(limit));

        const stats = {
            totalChanges: priceHistory.length,
            avgIncrease: 0,
            avgDecrease: 0,
            maxIncrease: 0,
            maxDecrease: 0
        };

        if (priceHistory.length > 0) {
            const increases = [];
            const decreases = [];

            priceHistory.forEach(change => {
                const percentageChange = ((change.newPrice - change.oldPrice) / change.oldPrice * 100);

                if (percentageChange > 0) {
                    increases.push(percentageChange);
                    if (percentageChange > stats.maxIncrease) {
                        stats.maxIncrease = percentageChange;
                    }
                } else if (percentageChange < 0) {
                    decreases.push(percentageChange);
                    if (percentageChange < stats.maxDecrease) {
                        stats.maxDecrease = percentageChange;
                    }
                }
            });

            stats.avgIncrease = increases.length > 0 ?
                (increases.reduce((a, b) => a + b, 0) / increases.length).toFixed(2) : 0;
            stats.avgDecrease = decreases.length > 0 ?
                (decreases.reduce((a, b) => a + b, 0) / decreases.length).toFixed(2) : 0;
        }

        res.json({
            productId,
            priceHistory,
            stats
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const applyPendingPriceChanges = async (req, res) => {
    try {
        const today = new Date();

        const pendingChanges = await PriceChange.find({
            effectiveDate: { $lte: today },
            notified: false
        }).populate('product');

        const results = {
            applied: 0,
            failed: 0,
            details: []
        };

        for (const change of pendingChanges) {
            try {
                if (change.product) {
                    change.product.currentPrice = change.newPrice;
                    await change.product.save();

                    change.notified = true;
                    await change.save();

                    results.applied++;
                    results.details.push({
                        product: change.product.name,
                        oldPrice: change.oldPrice,
                        newPrice: change.newPrice,
                        success: true
                    });
                }
            } catch (error) {
                results.failed++;
                results.details.push({
                    product: change.product?.name || 'Unknown',
                    error: error.message,
                    success: false
                });
            }
        }

        res.json({
            message: `Применено ${results.applied} изменений цен, не удалось применить ${results.failed}`,
            results
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllPriceChanges,
    getPriceChangeById,
    createPriceChange,
    updatePriceChange,
    deletePriceChange,
    markAsNotified,
    getUpcomingPriceChanges,
    getProductPriceHistory,
    applyPendingPriceChanges
};