const catchAsync = require('../utils/catchAsync');
const { Order, Product } = require('../models');
const { UserEvent } = require('../models');
const redisClient = require('../config/redis');
const recommendationService = require('../services/recommendation.service');
const ApiError = require('../utils/ApiError');

/**
 * Create order from cart items
 * Requires authentication
 */
const createOrder = catchAsync(async (req, res) => {
    const { items } = req.body; // Array of { productId, quantity }
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Cart items are required');
    }

    // Fetch products and calculate totals
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
        throw new ApiError(400, 'Some products not found');
    }

    // Build order items with prices
    const orderProducts = items.map(item => {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
            throw new ApiError(400, `Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
            throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }

        return {
            product: product._id,
            quantity: item.quantity,
            price: product.price,
        };
    });

    const totalAmount = orderProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Create order
    const order = await Order.create({
        user: userId,
        products: orderProducts,
        totalAmount,
        status: 'completed', // For demo, auto-complete orders
    });

    // Update product stock
    for (const item of orderProducts) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, popularity: item.quantity }
        });
    }

    // Track purchase events for each product
    for (const item of orderProducts) {
        const eventData = {
            user: userId,
            session_id: userId.toString(),
            eventType: 'purchase',
            product: item.product,
            metadata: { orderId: order._id, quantity: item.quantity },
            timestamp: new Date(),
        };

        await UserEvent.create(eventData);

        // Update Redis cache
        const cacheKey = `recent_events:${userId}`;
        await redisClient.lPush(cacheKey, JSON.stringify(eventData));
        await redisClient.lTrim(cacheKey, 0, 99);

        // Update product stats
        const productKey = `product_stats:${item.product}`;
        await redisClient.hIncrBy(productKey, 'purchase', item.quantity);
    }

    // Invalidate recommendations
    await recommendationService.invalidateRecommendations(userId, userId.toString());

    // Populate product details for response
    await order.populate('products.product');

    res.status(201).json({
        order,
        message: 'Order placed successfully',
    });
});

/**
 * Get user's orders
 */
const getUserOrders = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
        .populate('products.product')
        .sort({ createdAt: -1 });

    res.json(orders);
});

/**
 * Get order by ID
 */
const getOrderById = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId })
        .populate('products.product');

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    res.json(order);
});

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
};

