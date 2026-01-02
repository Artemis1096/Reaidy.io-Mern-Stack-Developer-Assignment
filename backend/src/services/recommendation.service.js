const { Product, Order } = require('../models');
const redisClient = require('../config/redis');
const geminiService = require('./gemini.service');

const invalidateRecommendations = async (userId, sessionId) => {
    const keys = await redisClient.keys(`rec_*:${userId || sessionId}:*`);
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
};

const getPagination = (page, limit) => {
    return {
        offset: (page - 1) * limit,
        limit
    };
};

/**
 * Get Home recommendations (Hybrid: History + Popularity)
 */
const getHomeRecommendations = async (userId, sessionId, page = 1, limit = 10) => {
    const cacheKey = `rec_home:${userId || sessionId}:${page}:${limit}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 1. Fetch Context (Recent Views)
    const recentEventsKey = `recent_events:${userId || sessionId}`;
    const rawEvents = await redisClient.lRange(recentEventsKey, 0, 19); // Check last 20 events
    const recentEvents = rawEvents.map(e => JSON.parse(e));

    const viewedProductIds = recentEvents
        .filter(e => e.eventType === 'view' && e.product)
        .map(e => e.product);

    let interestCategories = new Set();
    let userHistoryContext = [];

    if (viewedProductIds.length > 0) {
        const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } });
        viewedProducts.forEach(p => {
            interestCategories.add(p.category);
            const event = recentEvents.find(e => e.product === p._id.toString());
            if (event) userHistoryContext.push({ eventType: event.eventType, product: p });
        });
    }

    if (userId) {
        const orders = await Order.find({ user: userId }).populate('products.product');
        orders.forEach(order => {
            order.products.forEach(item => {
                if (item.product && item.product.category) {
                    interestCategories.add(item.product.category);
                    userHistoryContext.push({ eventType: 'purchase', product: item.product });
                }
            });
        });
    }

    const uniqueCategories = Array.from(interestCategories);

    // 2. Candidate Generation
    const query = { _id: { $nin: viewedProductIds } };
    if (uniqueCategories.length > 0) {
        query.$or = [{ category: { $in: uniqueCategories } }, { popularity: { $gt: 50 } }];
    }
    // Fetch generic pool, say 60 products, then score and paginate in memory.
    // For large catalogs, real pagination logic in DB is needed, but for recommendations (ranking),
    // usually we rank the top N candidates.
    const candidates = await Product.find(query).limit(60).lean();

    // 3. AI Ranking (Only on first page to check top candidates contextually)
    // We only use AI if page === 1 to act as a "Featured/Top Picks" re-ranker.
    let aiResults = [];
    if (page === 1) {
        try {
            if (candidates.length > 0) {
                const topCandidates = [...candidates]
                    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                    .slice(0, 20);

                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 400));
                aiResults = await Promise.race([
                    geminiService.generateAiRecommendations(userHistoryContext, topCandidates),
                    timeoutPromise
                ]);
            }
        } catch (e) { /* Fallback */ }
    }

    // 4. Scoring
    const scoredCandidates = candidates.map(product => {
        let score = product.popularity || 0;
        let explanation = null;
        if (uniqueCategories.includes(product.category)) score += 50;

        const aiMatch = Array.isArray(aiResults) ? aiResults.find(r => r.productId === product._id.toString()) : null;
        if (aiMatch) {
            score += (aiMatch.score || 0) * 2;
            explanation = aiMatch.explanation;
        }
        return { ...product, score, explanation };
    });

    // 5. Sort and Paginate
    scoredCandidates.sort((a, b) => b.score - a.score);
    const { offset } = getPagination(page, limit);
    const result = scoredCandidates.slice(offset, offset + limit);

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });
    return result;
};

/**
 * Get Product recommendations (Similar Products)
 */
const getProductRecommendations = async (productId, page = 1, limit = 10) => {
    const cacheKey = `rec_prod:${productId}:${page}:${limit}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const product = await Product.findById(productId);
    if (!product) return [];

    // Find same category, similar price range?
    const query = {
        _id: { $ne: productId },
        category: product.category
    };

    // Simple sort by popularity
    const { offset } = getPagination(page, limit);
    const recommendations = await Product.find(query)
        .sort({ popularity: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

    await redisClient.set(cacheKey, JSON.stringify(recommendations), { EX: 600 }); // Longer cache for similar items
    return recommendations;
};

/**
 * Get Cart recommendations (Complementary Products)
 */
const getCartRecommendations = async (userId, sessionId, page = 1, limit = 10) => {
    // Invalidate cart recs more often or use specific cart hash?
    // For simplicity, using session based key.
    const cacheKey = `rec_cart:${userId || sessionId}:${page}:${limit}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Get items currently in cart (implied by 'add_to_cart' events in Redis or similar)
    // Ideally we have a 'Cart' model, but let's use recent add_to_cart events as proxy.
    const recentEventsKey = `recent_events:${userId || sessionId}`;
    const rawEvents = await redisClient.lRange(recentEventsKey, 0, -1);
    const events = rawEvents.map(e => JSON.parse(e));

    const cartProductIds = events
        .filter(e => e.eventType === 'add_to_cart' && e.product)
        .map(e => e.product);

    const uniqueCartIds = [...new Set(cartProductIds)];

    if (uniqueCartIds.length === 0) {
        // Empty cart, return popular items
        return getHomeRecommendations(userId, sessionId, page, limit);
    }

    const cartProducts = await Product.find({ _id: { $in: uniqueCartIds } });
    const cartCategories = cartProducts.map(p => p.category);

    // Logic: Find products in same categories or "related" (hard to do without rule engine).
    // Let's simplified: Recommend products in same categories but NOT in cart.
    const query = {
        _id: { $nin: uniqueCartIds },
        category: { $in: cartCategories }
    };

    const { offset } = getPagination(page, limit);
    const recommendations = await Product.find(query)
        .sort({ popularity: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

    await redisClient.set(cacheKey, JSON.stringify(recommendations), { EX: 300 });
    return recommendations;
};

module.exports = {
    getHomeRecommendations,
    getProductRecommendations,
    getCartRecommendations,
    invalidateRecommendations
};
