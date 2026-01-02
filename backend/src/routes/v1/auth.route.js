const express = require('express');
const validate = require('../../middleware/validate');
const authController = require('../../controllers/auth.controller');
const Joi = require('joi');

const router = express.Router();

const registerSchema = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        name: Joi.string().required(),
    }),
};

const loginSchema = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
