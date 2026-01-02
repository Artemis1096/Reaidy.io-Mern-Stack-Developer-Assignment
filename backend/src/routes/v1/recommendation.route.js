const express = require('express');
const recommendationController = require('../../controllers/recommendation.controller');
const validate = require('../../middleware/validate');
const optionalAuth = require('../../middleware/optionalAuth');
const rateLimiter = require('../../middleware/rateLimiter');
const Joi = require('joi');

const router = express.Router();

// Apply Rate Limiting to all recommendation routes (e.g., 50 requests per 15 mins)
router.use(rateLimiter(50, 900));

// Apply Optional Auth - allows both authenticated and guest users
router.use(optionalAuth);

const paginationSchema = {
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
    session_id: Joi.string()
};

const getHomeSchema = {
    query: Joi.object().keys(paginationSchema),
};

const getProductRecsSchema = {
    params: Joi.object().keys({
        productId: Joi.string().required() // Should be regex for MongoID but string is ok for now
    }),
    query: Joi.object().keys(paginationSchema)
};

const getCartRecsSchema = {
    query: Joi.object().keys(paginationSchema)
};

router.get('/home', validate(getHomeSchema), recommendationController.getHomeRecommendations);
router.get('/product/:productId', validate(getProductRecsSchema), recommendationController.getProductRecommendations);
router.get('/cart', validate(getCartRecsSchema), recommendationController.getCartRecommendations);

// Backwards compatibility or default redirect
router.get('/', validate(getHomeSchema), recommendationController.getHomeRecommendations);

module.exports = router;
