const mongoose = require('mongoose');

const priceChangeSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Товар обязателен'],
        index: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Поставщик обязателен'],
        index: true
    },
    oldPrice: {
        type: Number,
        required: [true, 'Старая цена обязательна'],
        min: [0.01, 'Цена должна быть больше 0'],
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Старая цена должна быть положительной'
        }
    },
    newPrice: {
        type: Number,
        required: [true, 'Новая цена обязательна'],
        min: [0.01, 'Цена должна быть больше 0'],
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Новая цена должна быть положительной'
        }
    },
    changeDate: {
        type: Date,
        required: [true, 'Дата изменения цены обязательна'],
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'Дата изменения не может быть в будущем'
        }
    },
    notificationDate: {
        type: Date,
        required: [true, 'Дата уведомления обязательна'],
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'Дата уведомления не может быть в будущем'
        }
    },
    effectiveDate: {
        type: Date,
        required: [true, 'Дата вступления в силу обязательна'],
        validate: {
            validator: function(v) {
                return v >= this.notificationDate;
            },
            message: 'Дата вступления в силу должна быть после даты уведомления'
        }
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Причина не должна превышать 500 символов'],
        validate: {
            validator: function(v) {
                if (!v) return true; // опционально
                const words = v.trim().split(/\s+/);
                return words.length <= 100;
            },
            message: 'Причина должна содержать не более 100 слов'
        }
    },
    changeType: {
        type: String,
        enum: ['increase', 'decrease', 'no_change'],
        default: 'increase'
    },
    percentageChange: {
        type: Number,
        min: -100,
        max: 1000
    },
    applied: {
        type: Boolean,
        default: false
    },
    appliedDate: {
        type: Date
    },
    requiresConfirmation: {
        type: Boolean,
        default: false
    },
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    confirmationDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

priceChangeSchema.pre('save', async function() {
    if (this.oldPrice && this.newPrice) {
        this.percentageChange = ((this.newPrice - this.oldPrice) / this.oldPrice) * 100;
        this.changeType = this.newPrice > this.oldPrice ? 'increase' :
            this.newPrice < this.oldPrice ? 'decrease' : 'no_change';
    }

    if (this.effectiveDate <= new Date() && !this.applied) {
        this.applied = true;
        this.appliedDate = new Date();
    }
});

priceChangeSchema.path('effectiveDate').validate(function(value) {
    return value >= this.notificationDate;
}, 'Дата вступления в силу должна быть после даты уведомления');

priceChangeSchema.index({ product: 1, supplier: 1, effectiveDate: 1 }, { unique: true });

priceChangeSchema.virtual('status').get(function() {
    const now = new Date();
    if (this.applied) return 'applied';
    if (this.effectiveDate <= now) return 'pending_application';
    if (this.notificationDate <= now) return 'notified';
    return 'scheduled';
});

priceChangeSchema.virtual('daysUntilEffective').get(function() {
    const now = new Date();
    const diff = this.effectiveDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

priceChangeSchema.index({ effectiveDate: 1, applied: 1 });
priceChangeSchema.index({ supplier: 1, effectiveDate: -1 });
priceChangeSchema.index({ status: 1, effectiveDate: 1 });

module.exports = mongoose.model('PriceChange', priceChangeSchema);