const mongoose = require('mongoose');

const userEventSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        session_id: {
            type: String,
            required: true, // Useful for guest tracking
        },
        eventType: {
            type: String,
            enum: ['view', 'click', 'add_to_cart', 'purchase', 'search'],
            required: true,
            index: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            index: true, // Useful for product engagement stats
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false, // We use custom timestamp field
    }
);

// Compound index for querying recent user actions
userEventSchema.index({ user: 1, eventType: 1, timestamp: -1 });

// Compound index for product stats/analytics
userEventSchema.index({ product: 1, eventType: 1 });

const UserEvent = mongoose.model('UserEvent', userEventSchema);

module.exports = UserEvent;
