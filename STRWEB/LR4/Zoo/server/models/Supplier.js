const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Название поставщика обязательно'],
        trim: true,
        maxlength: [100, 'Название не должно превышать 100 символов']
    },
    address: {
        street: {
            type: String,
            required: [true, 'Улица обязательна'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'Город обязателен'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Страна обязательна'],
            trim: true
        },
        postalCode: {
            type: String,
            trim: true
        }
    },
    phone: {
        type: String,
        required: [true, 'Телефон обязателен'],
        validate: {
            validator: function(v) {
                const cleaned = v.replace(/[\s\-()]/g, "");
                return /^(\+375|80)(17|25|29|33|44)\d{7}$/.test(cleaned);
            },
            message: props => `${props.value} не является корректным белорусским номером телефона. Формат: +375/80 + код оператора (25,29,33,44) + 7 цифр`
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Пожалуйста, введите корректный email']
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    productsCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
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

supplierSchema.virtual('fullAddress').get(function() {
    return `${this.address.street}, ${this.address.city}, ${this.address.country}`;
});

supplierSchema.virtual('ratingStars').get(function() {
    return '★'.repeat(Math.round(this.rating)) + '☆'.repeat(5 - Math.round(this.rating));
});

module.exports = mongoose.model('Supplier', supplierSchema);