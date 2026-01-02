const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        tags: [{
            type: String,
            trim: true
        }],
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        popularity: {
            type: Number,
            default: 0,
            index: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

// Index for filtering by tags
productSchema.index({ tags: 1 });

// Compound index for getting popular items in a category
productSchema.index({ category: 1, popularity: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
