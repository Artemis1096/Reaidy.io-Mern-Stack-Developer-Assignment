const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const recommendationService = require('../services/recommendation.service');
const { Product } = require('../models');
require('dotenv').config();

const verifyAi = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        if (!redisClient.isOpen) await redisClient.connect();

        // Invalidate first to ensure fresh fetch
        const sessionId = 'ai-test-session-' + Date.now();
        await recommendationService.invalidateRecommendations(null, sessionId);

        // Simulate view
        const products = await Product.find().limit(1);
        const viewedProduct = products[0];
        const eventData = { eventType: 'view', product: viewedProduct._id.toString(), timestamp: new Date() };
        await redisClient.lPush(`recent_events:${sessionId}`, JSON.stringify(eventData));

        console.log('Fetching AI Recommendations...');
        const recs = await recommendationService.getRecommendations(null, sessionId, 3);

        console.log('--- Top Recommendations ---');
        recs.forEach((p, index) => {
            console.log(`${index + 1}. ${p.name} (Score: ${p.score})`);
            console.log(`   Explanation: ${p.explanation || 'N/A'}`);
        });

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        await redisClient.quit();
    }
};

verifyAi();
