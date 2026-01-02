const jwt = require('jsonwebtoken');
const httpStatus = require('http-status').status;
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        const token = authHeader.split(' ')[1];

        const payload = jwt.verify(token, config.jwt.secret);
        if (!payload || !payload.sub) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(httpStatus.UNAUTHORIZED, error.message || 'Please authenticate'));
    }
};

module.exports = auth;
