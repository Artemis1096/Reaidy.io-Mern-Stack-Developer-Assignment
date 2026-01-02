const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const { UserEvent, Product } = require('../models');
const recommendationService = require('../services/recommendation.service');
require('dotenv').config();

const verifyRecommendations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Make sure redis is connected
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        console.log('Connected to Redis');

        // 1. Simulate User Behavior
        const sessionId = 'test-rec-session-' + Date.now();

        // Find some products to "view"
        const products = await Product.find().limit(5);
        const viewedProduct = products[0]; // Let's say we view the first one

        console.log(`Simulating view for product: ${viewedProduct.name} (Category: ${viewedProduct.category})`);

        // Add to Redis manually to simulate recent view
        const eventData = {
            eventType: 'view',
            product: viewedProduct._id.toString(),
            timestamp: new Date()
        };
        await redisClient.lPush(`recent_events:${sessionId}`, JSON.stringify(eventData));

        // 2. Get Recommendations
        console.log('Fetching recommendations...');
        const recs = await recommendationService.getRecommendations(null, sessionId, 5);

        console.log('--- Recommendations ---');
        recs.forEach((p, index) => {
            console.log(`${index + 1}. ${p.name} [Category: ${p.category}] (Score: ${p.score})`);
        });

        // 3. Verify Logic
        const hasCategoryMatch = recs.some(p => p.category === viewedProduct.category);
        console.log(`\nVerification: Contains products from category '${viewedProduct.category}'? ${hasCategoryMatch ? 'YES' : 'NO'}`);

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        await redisClient.quit();
    }
};

verifyRecommendations();
