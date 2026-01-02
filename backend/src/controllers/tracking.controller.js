const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { UserEvent, Order, Product } = require('../models');
const redisClient = require('../config/redis');
const recommendationService = require('../services/recommendation.service');
const ApiError = require('../utils/ApiError');

// Helper to catch async errors (standard boilerplate)
// Ensure catchAsync is defined if not importing from utils
// Assuming catchAsync is a wrapper: fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// I need to create it if it doesn't exist, but I'll assume standard structure or inline it.
const catchAsyncFn = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

const trackEvent = catchAsyncFn(async (req, res) => {
    const { eventType, productId, metadata } = req.body;
    // User might be authenticated or anonymous (session_id)
    // For this assignment, let's assume req.user is set if auth, otherwise req.body.session_id
    const userId = req.user ? req.user._id : null;
    const sessionId = req.body.session_id || (req.user ? req.user._id.toString() : 'guest');

    // Basic validation
    if (!eventType) {
        throw new ApiError(400, 'Event type is required');
    }

    const eventData = {
        user: userId,
        session_id: sessionId,
        eventType,
        product: productId,
        metadata,
        timestamp: new Date(),
    };

    // 1. Save to MongoDB
    const event = await UserEvent.create(eventData);

    // 2. Cache recent events in Redis
    // Key: recent_events:{userId or sessionId}
    // We'll store a list of last 100 events
    const cacheKey = `recent_events:${userId || sessionId}`;
    await redisClient.lPush(cacheKey, JSON.stringify(eventData));
    await redisClient.lTrim(cacheKey, 0, 99); // Keep only last 100
    await redisClient.expire(cacheKey, 3600); // Expire after 1 hour of inactivity

    // 3. Handle specific side effects (e.g. Purchase creates Order)
    // Note: Usually Order creation is a separate transaction flow (checkout), 
    // but if this is just a tracking event confirming purchase, we might duplicate logic.
    // The prompt asked for "purchase" event to be tracked. 
    // If the prompt implies this API *creates* changes, we should be careful.
    // "Store events in MongoDB and cache recent events in Redis."
    // I will strictly treat this as an analytics event ingestion endpoint.
    // However, I'll update global stats in Redis for Recommendations.

    // Global Product Popularity (Cached)
    if (productId) {
        const productKey = `product_stats:${productId}`;
        await redisClient.hIncrBy(productKey, eventType, 1);
        // await redisClient.expire(productKey, 86400); // optional expiry
    }

    // Invalidate Recommendation Cache for this user
    await recommendationService.invalidateRecommendations(userId, sessionId);

    res.status(201).send(event);
});

const getRecentEvents = catchAsyncFn(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.query.session_id || (req.user ? req.user._id.toString() : null);

    if (!sessionId && !userId) {
        throw new ApiError(400, 'User ID or Session ID required');
    }

    const cacheKey = `recent_events:${userId || sessionId}`;
    const cachedEvents = await redisClient.lRange(cacheKey, 0, -1);

    // Parse JSON strings
    const events = cachedEvents.map(e => JSON.parse(e));

    res.send(events);
});

module.exports = {
    trackEvent,
    getRecentEvents
};
