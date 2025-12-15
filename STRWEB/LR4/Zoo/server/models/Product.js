const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Название товара обязательно'],
        trim: true,
        maxlength: [200, 'Название не должно превышать 200 символов']
    },
    sku: {
        type: String,
        required: [true, 'Артикул обязателен'],
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Описание не должно превышать 1000 символов']
    },
    category: {
        type: String,
        required: [true, 'Категория обязательна'],
        enum: ['Корма', 'Аксессуары', 'Игрушки', 'Здоровье', 'Гигиена', 'Переноски', 'Одежда']
    },
    animalType: {
        type: [String],
        required: [true, 'Тип животного обязателен'],
        enum: ['Собака', 'Кошка', 'Птица', 'Рыбка', 'Грызун', 'Рептилия', 'Все']
    },
    currentPrice: {
        type: Number,
        required: [true, 'Текущая цена обязательна'],
        min: [0, 'Цена не может быть отрицательной']
    },
    unit: {
        type: String,
        required: [true, 'Единица измерения обязательна'],
        enum: ['шт', 'кг', 'л', 'уп', 'г']
    },
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        min: 0,
        default: 0
    },
    minStockLevel: {
        type: Number,
        min: 0,
        default: 10
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/300x300?text=Pet+Product'
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

productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ animalType: 1 });

module.exports = mongoose.model('Product', productSchema);