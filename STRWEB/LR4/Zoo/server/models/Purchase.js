const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: [true, 'Количество обязательно'],
        min: [1, 'Количество должно быть не менее 1']
    },
    purchasePrice: {
        type: Number,
        required: [true, 'Цена закупки обязательна'],
        min: [0, 'Цена не может быть отрицательной']
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Дата закупки обязательна'],
        default: Date.now
    },
    deliveryDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['ordered', 'delivered', 'cancelled', 'pending'],
        default: 'ordered'
    },
    invoiceNumber: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Заметки не должны превышать 500 символов']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

purchaseSchema.virtual('totalCost').get(function() {
    return this.quantity * this.purchasePrice;
});

purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ product: 1, purchaseDate: -1 });
purchaseSchema.index({ supplier: 1, purchaseDate: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);