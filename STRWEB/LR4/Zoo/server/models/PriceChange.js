const mongoose = require('mongoose');

const priceChangeSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Товар обязателен']
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Поставщик обязателен']
    },
    oldPrice: {
        type: Number,
        required: [true, 'Старая цена обязательна'],
        min: [0, 'Цена не может быть отрицательной']
    },
    newPrice: {
        type: Number,
        required: [true, 'Новая цена обязательна'],
        min: [0, 'Цена не может быть отрицательной']
    },
    changeDate: {
        type: Date,
        required: [true, 'Дата изменения цены обязательна']
    },
    effectiveDate: {
        type: Date,
        required: [true, 'Дата вступления в силу обязательна'],
        default: Date.now
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Причина не должна превышать 500 символов']
    },
    notified: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

priceChangeSchema.index({ product: 1, effectiveDate: -1 });
priceChangeSchema.index({ supplier: 1, effectiveDate: -1 });

module.exports = mongoose.model('PriceChange', priceChangeSchema);