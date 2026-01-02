const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const recommendationService = require('../services/recommendation.service');
const { Product } = require('../models');
require('dotenv').config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const verifyOptimization = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        if (!redisClient.isOpen) await redisClient.connect();

        const sessionId = 'opt-test-' + Date.now();

        // 1. Initial Fetch (Cache Miss)
        console.log('1. Fetching Recommendations (Should be MISS)...');
        const start1 = Date.now();
        await recommendationService.getRecommendations(null, sessionId);
        console.log(`   Time: ${Date.now() - start1}ms`);

        // 2. Second Fetch (Cache Hit)
        console.log('2. Fetching Recommendations (Should be HIT)...');
        const start2 = Date.now();
        await recommendationService.getRecommendations(null, sessionId);
        console.log(`   Time: ${Date.now() - start2}ms`);

        if ((Date.now() - start2) >= (Date.now() - start1)) {
            console.warn('WARNING: Cache hit was not significantly faster. (Local redis might be too fast regardless)');
        }

        // 3. Trigger Invalidation via Service directly (simulating controller action)
        console.log('3. Triggering Invalidation (New Event)...');
        await recommendationService.invalidateRecommendations(null, sessionId);

        // 4. Fetch Again (Cache Miss)
        console.log('4. Fetching Recommendations (Should be MISS/Refetch)...');
        const start3 = Date.now();
        await recommendationService.getRecommendations(null, sessionId);
        console.log(`   Time: ${Date.now() - start3}ms`);

        console.log('Optimization Verification Complete.');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        await redisClient.quit();
    }
};

verifyOptimization();
