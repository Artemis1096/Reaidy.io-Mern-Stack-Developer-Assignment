const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const recommendationService = require('../services/recommendation.service');
const { Product } = require('../models');
require('dotenv').config();

const verifyContextual = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        if (!redisClient.isOpen) await redisClient.connect();

        const sessionId = 'ctx-test-' + Date.now();

        // 1. Setup Data
        const products = await Product.find().limit(5);
        const prodA = products[0]; // For Product Page context
        const prodB = products[1]; // For Cart
        const prodC = products[2]; // For Cart

        // Simulate Add to Cart for Cart Context
        const cartEvent1 = { eventType: 'add_to_cart', product: prodB._id.toString(), timestamp: new Date() };
        const cartEvent2 = { eventType: 'add_to_cart', product: prodC._id.toString(), timestamp: new Date() };

        await redisClient.lPush(`recent_events:${sessionId}`, JSON.stringify(cartEvent1));
        await redisClient.lPush(`recent_events:${sessionId}`, JSON.stringify(cartEvent2));

        console.log('--- Testing Contextual APIs ---');

        console.log(`\n1. Product Page Recommendations (Context: ${prodA.name})`);
        const pResults = await recommendationService.getProductRecommendations(prodA._id.toString(), 1, 3);
        pResults.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} [${p.category}]`));

        console.log(`\n2. Cart Recommendations (Context: ${prodB.name}, ${prodC.name})`);
        const cResults = await recommendationService.getCartRecommendations(null, sessionId, 1, 3);
        cResults.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} [${p.category}]`));

        console.log(`\n3. Home Recommendations (Generic/History)`);
        const hResults = await recommendationService.getHomeRecommendations(null, sessionId, 1, 3);
        hResults.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} [Score: ${p.score}]`));

        console.log(`\n4. Pagination (Home Page 2)`);
        const hResults2 = await recommendationService.getHomeRecommendations(null, sessionId, 2, 3);
        hResults2.forEach((p, i) => console.log(`   ${i + 1}. ${p.name} [Score: ${p.score}]`));

        // Verify different items
        const firstId = hResults.length > 0 ? hResults[0]._id.toString() : 'A';
        const page2Id = hResults2.length > 0 ? hResults2[0]._id.toString() : 'A';

        if (hResults.length > 0 && hResults2.length > 0 && firstId !== page2Id) {
            console.log('   SUCCESS: Pagination returned different items.');
        } else {
            console.log('   NOTE: Pagination items might be same or empty pool.');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        await redisClient.quit();
    }
};

verifyContextual();
