const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    purchases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase'
    }],
    totalQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['created', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'created'
    },
    deliveryAddress: {
        street: String,
        city: String,
        country: String,
        postalCode: String
    },
    deliveryDate: {
        type: Date
    },
    estimatedDeliveryDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
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

orderSchema.pre('save', async function() {
    if (this.isNew && !this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Order').countDocuments({
            createdAt: { $gte: new Date(year, 0, 1) }
        });
        this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
    }
});

orderSchema.virtual('itemsCount').get(function() {
    return this.purchases ? this.purchases.length : 0;
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ supplier: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);