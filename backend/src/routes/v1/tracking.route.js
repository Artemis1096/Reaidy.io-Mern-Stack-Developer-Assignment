const express = require('express');
const trackingController = require('../../controllers/tracking.controller');
const validate = require('../../middleware/validate');
const Joi = require('joi');

const router = express.Router();

const trackEventSchema = {
    body: Joi.object().keys({
        eventType: Joi.string().required().valid('view', 'click', 'add_to_cart', 'purchase', 'search'),
        productId: Joi.string().when('eventType', {
            is: 'search',
            then: Joi.optional(),
            otherwise: Joi.optional() // Product might not be present for generic clicks? But usually is.
        }),
        session_id: Joi.string(),
        metadata: Joi.object(),
    }),
};

console.log('Loading tracking routes...');
router.post('/', validate(trackEventSchema), trackingController.trackEvent);
router.get('/recent', trackingController.getRecentEvents);
console.log('Tracking routes loaded.');

module.exports = router;
