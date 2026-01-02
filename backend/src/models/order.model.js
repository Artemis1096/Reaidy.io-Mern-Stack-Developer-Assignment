const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Index for analytics on sales over time
orderSchema.index({ createdAt: 1 });

// Index to find orders containing specific products (collaborative filtering)
orderSchema.index({ 'products.product': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
