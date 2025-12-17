const PriceChange = require('../models/PriceChange');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { formatDateWithTimezone } = require('../utils/timezone');

const sendResponse = (res, success, message, data = null, status = 200) => {
    res.status(status).json({ success, message, data });
};

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
            applied,
            requiresConfirmation,
            sortBy = 'effectiveDate',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        if (productId) filter.product = productId;
        if (supplierId) filter.supplier = supplierId;
        if (startDate || endDate) {
            filter.effectiveDate = {};
            if (startDate) filter.effectiveDate.$gte = new Date(startDate);
            if (endDate) filter.effectiveDate.$lte = new Date(endDate);
        }
        if (notified !== undefined) filter.notified = notified === 'true';
        if (applied !== undefined) filter.applied = applied === 'true';
        if (requiresConfirmation !== undefined) filter.requiresConfirmation = requiresConfirmation === 'true';

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [priceChanges, total] = await Promise.all([
            PriceChange.find(filter)
                .populate('product', 'name sku currentPrice')
                .populate('supplier', 'name')
                .populate('createdBy', 'username')
                .populate('confirmedBy', 'username')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            PriceChange.countDocuments(filter)
        ]);

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedPriceChanges = priceChanges.map(change => {
            const percentageChange = ((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(2);

            return {
                ...change.toObject(),
                changeDateLocal: formatDateWithTimezone(change.changeDate, userTimezone),
                effectiveDateLocal: formatDateWithTimezone(change.effectiveDate, userTimezone),
                notificationDateLocal: formatDateWithTimezone(change.notificationDate, userTimezone),
                appliedDateLocal: change.appliedDate ? formatDateWithTimezone(change.appliedDate, userTimezone) : null,
                confirmationDateLocal: change.confirmationDate ? formatDateWithTimezone(change.confirmationDate, userTimezone) : null,
                changeDateUTC: change.changeDate.toISOString(),
                effectiveDateUTC: change.effectiveDate.toISOString(),
                notificationDateUTC: change.notificationDate.toISOString(),
                createdAtLocal: formatDateWithTimezone(change.createdAt, userTimezone),
                percentageChange,
                absoluteChange: (change.newPrice - change.oldPrice).toFixed(2),
                status: change.applied ? 'applied' :
                    change.effectiveDate <= new Date() ? 'pending' :
                        change.requiresConfirmation ? 'needs_confirmation' : 'scheduled'
            };
        });

        sendResponse(res, true, 'Список изменений цен получен', {
            priceChanges: formattedPriceChanges,
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

const getPriceChangeById = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id)
            .populate('product', 'name sku category currentPrice')
            .populate('supplier', 'name email phone')
            .populate('createdBy', 'username email')
            .populate('confirmedBy', 'username email');

        if (!priceChange) return sendResponse(res, false, 'Изменение цены не найдено', null, 404);

        const userTimezone = req.user?.timezone || 'UTC';
        const percentageChange = ((priceChange.newPrice - priceChange.oldPrice) / priceChange.oldPrice * 100).toFixed(2);

        const formattedPriceChange = {
            ...priceChange.toObject(),
            changeDateLocal: formatDateWithTimezone(priceChange.changeDate, userTimezone),
            effectiveDateLocal: formatDateWithTimezone(priceChange.effectiveDate, userTimezone),
            notificationDateLocal: formatDateWithTimezone(priceChange.notificationDate, userTimezone),
            appliedDateLocal: priceChange.appliedDate ? formatDateWithTimezone(priceChange.appliedDate, userTimezone) : null,
            confirmationDateLocal: priceChange.confirmationDate ? formatDateWithTimezone(priceChange.confirmationDate, userTimezone) : null,
            changeDateUTC: priceChange.changeDate.toISOString(),
            effectiveDateUTC: priceChange.effectiveDate.toISOString(),
            notificationDateUTC: priceChange.notificationDate.toISOString(),
            createdAtLocal: formatDateWithTimezone(priceChange.createdAt, userTimezone),
            percentageChange,
            absoluteChange: (priceChange.newPrice - priceChange.oldPrice).toFixed(2),
            status: priceChange.applied ? 'applied' :
                priceChange.effectiveDate <= new Date() ? 'pending' :
                    priceChange.requiresConfirmation ? 'needs_confirmation' : 'scheduled'
        };

        sendResponse(res, true, 'Изменение цены найдено', { priceChange: formattedPriceChange });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const createPriceChange = async (req, res) => {
    try {
        const { product: productId, supplier: supplierId, newPrice, effectiveDate, notificationDate, reason } = req.body;

        const requiredFields = ['product', 'supplier', 'newPrice', 'effectiveDate', 'notificationDate'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return sendResponse(res, false, `Отсутствуют обязательные поля: ${missingFields.join(', ')}`, null, 400);
        }

        if (typeof newPrice !== 'number' || isNaN(newPrice)) {
            return sendResponse(res, false, 'Цена должна быть числом', null, 400);
        }

        if (newPrice <= 0) {
            return sendResponse(res, false, 'Цена должна быть больше 0', null, 400);
        }

        const notifDate = new Date(notificationDate);
        const effDate = new Date(effectiveDate);
        const now = new Date();

        if (isNaN(notifDate.getTime())) {
            return sendResponse(res, false, 'Некорректная дата уведомления', null, 400);
        }

        if (isNaN(effDate.getTime())) {
            return sendResponse(res, false, 'Некорректная дата вступления в силу', null, 400);
        }

        if (effDate < notifDate) {
            return sendResponse(res, false, 'Дата вступления в силу должна быть после даты уведомления', null, 400);
        }

        if (notifDate > now) {
            return sendResponse(res, false, 'Дата уведомления не может быть в будущем', null, 400);
        }

        const [product, supplier] = await Promise.all([
            Product.findById(productId),
            Supplier.findById(supplierId)
        ]);

        if (!product) {
            return sendResponse(res, false, 'Товар не найден', null, 404);
        }

        if (!supplier) {
            return sendResponse(res, false, 'Поставщик не найден', null, 404);
        }

        if (!supplier.isActive) {
            return sendResponse(res, false, 'Поставщик неактивен', null, 400);
        }

        const supplierProduct = supplier.products.find(p => p.product.toString() === productId);
        if (!supplierProduct) {
            return sendResponse(res, false, 'Указанный поставщик не поставляет этот товар', null, 400);
        }

        const existingChange = await PriceChange.findOne({
            product: productId,
            supplier: supplierId,
            effectiveDate: effDate
        });

        if (existingChange) {
            return sendResponse(res, false, 'Изменение цены на эту дату уже существует', null, 400);
        }

        const oldPrice = product.currentPrice;
        const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;
        const requiresConfirmation = Math.abs(percentageChange) > 50;

        const priceChange = new PriceChange({
            product: productId,
            supplier: supplierId,
            oldPrice,
            newPrice,
            changeDate: notifDate,
            notificationDate: notifDate,
            effectiveDate: effDate,
            reason: reason || 'Изменение цены поставщиком',
            requiresConfirmation,
            createdBy: req.user.id
        });

        await priceChange.save();

        let productUpdated = false;
        if (effDate <= now && !requiresConfirmation) {
            product.currentPrice = newPrice;
            await product.save();
            priceChange.applied = true;
            priceChange.appliedDate = now;
            await priceChange.save();
            productUpdated = true;
        }

        await priceChange.populate('product supplier createdBy');

        sendResponse(res, true, 'Изменение цены успешно создано', {
            priceChange,
            productUpdated,
            requiresConfirmation: priceChange.requiresConfirmation,
            note: requiresConfirmation ? 'Требуется подтверждение администратора' : undefined
        }, 201);

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, false, 'Ошибка валидации', errors, 400);
        }

        if (error.code === 11000) {
            return sendResponse(res, false, 'Дублирование записи об изменении цены', null, 400);
        }

        sendResponse(res, false, error.message, null, 400);
    }
};

const updatePriceChange = async (req, res) => {
    try {
        const allowedUpdates = ['newPrice', 'changeDate', 'notificationDate', 'effectiveDate', 'reason', 'notified', 'applied', 'requiresConfirmation'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return sendResponse(res, false, 'Недопустимые поля для обновления', null, 400);
        }

        const priceChange = await PriceChange.findById(req.params.id).populate('product');
        if (!priceChange) return sendResponse(res, false, 'Изменение цены не найдено', null, 404);

        const shouldUpdateProductPrice = updates.includes('newPrice') &&
            priceChange.effectiveDate <= new Date() &&
            priceChange.product &&
            !priceChange.requiresConfirmation;

        const oldNewPrice = priceChange.newPrice;

        updates.forEach(update => {
            if (update === 'effectiveDate' || update === 'notificationDate' || update === 'changeDate') {
                priceChange[update] = new Date(req.body[update]);
            } else {
                priceChange[update] = req.body[update];
            }
        });

        if (updates.includes('newPrice') && priceChange.product) {
            const percentageChange = ((priceChange.newPrice - priceChange.oldPrice) / priceChange.oldPrice) * 100;
            priceChange.requiresConfirmation = Math.abs(percentageChange) > 50;
        }

        await priceChange.save();

        if (shouldUpdateProductPrice && priceChange.product && priceChange.newPrice !== oldNewPrice) {
            priceChange.product.currentPrice = priceChange.newPrice;
            await priceChange.product.save();
        }

        await priceChange.populate('product supplier createdBy confirmedBy');

        sendResponse(res, true, 'Изменение цены успешно обновлено', { priceChange });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return sendResponse(res, false, 'Ошибка валидации', errors, 400);
        }
        sendResponse(res, false, error.message, null, 400);
    }
};

const deletePriceChange = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id).populate('product');
        if (!priceChange) return sendResponse(res, false, 'Изменение цены не найдено', null, 404);

        if (priceChange.product && priceChange.applied && priceChange.effectiveDate <= new Date()) {
            const previousPriceChange = await PriceChange.findOne({
                product: priceChange.product._id,
                effectiveDate: { $lt: priceChange.effectiveDate },
                applied: true
            }).sort({ effectiveDate: -1 });

            priceChange.product.currentPrice = previousPriceChange ? previousPriceChange.newPrice : priceChange.oldPrice;
            await priceChange.product.save();
        }

        await priceChange.deleteOne();
        sendResponse(res, true, 'Изменение цены успешно удалено');
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const markAsNotified = async (req, res) => {
    try {
        const priceChange = await PriceChange.findById(req.params.id);
        if (!priceChange) return sendResponse(res, false, 'Изменение цены не найдено', null, 404);

        priceChange.notified = true;
        priceChange.notificationDate = new Date();
        await priceChange.save();

        sendResponse(res, true, 'Изменение цены отмечено как уведомленное', { priceChange });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getUpcomingPriceChanges = async (req, res) => {
    try {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

        const upcomingChanges = await PriceChange.find({
            effectiveDate: { $gt: today, $lte: nextMonth },
            applied: false
        })
            .populate('product', 'name sku currentPrice')
            .populate('supplier', 'name')
            .populate('createdBy', 'username')
            .sort({ effectiveDate: 1 });

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedChanges = upcomingChanges.map(change => {
            const percentageChange = ((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(2);
            const daysUntil = Math.ceil((change.effectiveDate - today) / (1000 * 60 * 60 * 24));

            return {
                ...change.toObject(),
                effectiveDateLocal: formatDateWithTimezone(change.effectiveDate, userTimezone),
                notificationDateLocal: formatDateWithTimezone(change.notificationDate, userTimezone),
                percentageChange,
                daysUntil,
                status: change.requiresConfirmation ? 'needs_confirmation' : 'scheduled'
            };
        });

        sendResponse(res, true, 'Предстоящие изменения цен', {
            upcomingChanges: formattedChanges,
            total: formattedChanges.length,
            period: 'Следующий месяц'
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const getProductPriceHistory = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { supplierId, limit = 20 } = req.query;

        const filter = { product: productId, applied: true };
        if (supplierId) filter.supplier = supplierId;

        const priceHistory = await PriceChange.find(filter)
            .populate('supplier', 'name')
            .populate('createdBy', 'username')
            .sort({ effectiveDate: -1 })
            .limit(parseInt(limit));

        const userTimezone = req.user?.timezone || 'UTC';
        const formattedHistory = priceHistory.map(change => {
            const percentageChange = ((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(2);

            return {
                ...change.toObject(),
                effectiveDateLocal: formatDateWithTimezone(change.effectiveDate, userTimezone),
                notificationDateLocal: formatDateWithTimezone(change.notificationDate, userTimezone),
                appliedDateLocal: change.appliedDate ? formatDateWithTimezone(change.appliedDate, userTimezone) : null,
                percentageChange,
                changeType: change.newPrice > change.oldPrice ? 'increase' : 'decrease'
            };
        });

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
                    if (percentageChange > stats.maxIncrease) stats.maxIncrease = percentageChange;
                } else if (percentageChange < 0) {
                    decreases.push(percentageChange);
                    if (percentageChange < stats.maxDecrease) stats.maxDecrease = percentageChange;
                }
            });

            stats.avgIncrease = increases.length > 0 ?
                (increases.reduce((a, b) => a + b, 0) / increases.length).toFixed(2) : 0;
            stats.avgDecrease = decreases.length > 0 ?
                (decreases.reduce((a, b) => a + b, 0) / decreases.length).toFixed(2) : 0;
        }

        sendResponse(res, true, 'История цен товара', {
            productId,
            priceHistory: formattedHistory,
            stats
        });
    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const applyPendingPriceChanges = async (req, res) => {
    try {
        const today = new Date();

        const pendingChanges = await PriceChange.find({
            effectiveDate: { $lte: today },
            applied: false,
            requiresConfirmation: false
        }).populate('product');

        const results = {
            applied: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        for (const change of pendingChanges) {
            try {
                if (!change.product) {
                    results.skipped++;
                    results.details.push({
                        changeId: change._id,
                        status: 'skipped',
                        reason: 'Товар не найден'
                    });
                    continue;
                }

                change.product.currentPrice = change.newPrice;
                await change.product.save();

                change.applied = true;
                change.appliedDate = new Date();
                await change.save();

                results.applied++;
                results.details.push({
                    changeId: change._id,
                    product: change.product.name,
                    oldPrice: change.oldPrice,
                    newPrice: change.newPrice,
                    status: 'applied',
                    appliedAt: new Date()
                });

            } catch (error) {
                results.failed++;
                results.details.push({
                    changeId: change._id,
                    product: change.product?.name || 'Unknown',
                    status: 'failed',
                    error: error.message
                });
            }
        }

        sendResponse(res, true,
            `Применено ${results.applied} изменений цен. Не удалось применить: ${results.failed}. Пропущено: ${results.skipped}`,
            { results }
        );

    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
    }
};

const confirmPriceChange = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirm } = req.body;

        if (typeof confirm !== 'boolean') {
            return sendResponse(res, false, 'Поле confirm должно быть boolean', null, 400);
        }

        const priceChange = await PriceChange.findById(id)
            .populate('product')
            .populate('supplier');

        if (!priceChange) {
            return sendResponse(res, false, 'Изменение цены не найдено', null, 404);
        }

        if (!priceChange.requiresConfirmation) {
            return sendResponse(res, false, 'Это изменение не требует подтверждения', null, 400);
        }

        if (priceChange.applied) {
            return sendResponse(res, false, 'Изменение уже применено', null, 400);
        }

        if (confirm) {
            priceChange.requiresConfirmation = false;
            priceChange.confirmedBy = req.user.id;
            priceChange.confirmationDate = new Date();

            if (priceChange.product) {
                priceChange.product.currentPrice = priceChange.newPrice;
                await priceChange.product.save();
            }

            priceChange.applied = true;
            priceChange.appliedDate = new Date();

            await priceChange.save();

            sendResponse(res, true, 'Изменение цены подтверждено и применено', { priceChange });
        } else {
            priceChange.requiresConfirmation = false;
            priceChange.applied = false;
            await priceChange.save();

            sendResponse(res, true, 'Изменение цены отклонено', { priceChange });
        }

    } catch (error) {
        sendResponse(res, false, error.message, null, 400);
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
    applyPendingPriceChanges,
    confirmPriceChange
};