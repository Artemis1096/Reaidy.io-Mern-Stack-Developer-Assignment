const express = require('express');
const orderController = require('../../controllers/order.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rateLimiter = require('../../middleware/rateLimiter');
const Joi = require('joi');

const router = express.Router();

// All order routes require authentication
router.use(auth);
router.use(rateLimiter(30, 900)); // 30 requests per 15 minutes

const createOrderSchema = {
    body: Joi.object().keys({
        items: Joi.array().items(
            Joi.object().keys({
                productId: Joi.string().required(),
                quantity: Joi.number().integer().min(1).required(),
            })
        ).min(1).required(),
    }),
};

const getOrderSchema = {
    params: Joi.object().keys({
        orderId: Joi.string().required(),
    }),
};

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', validate(getOrderSchema), orderController.getOrderById);

module.exports = router;

