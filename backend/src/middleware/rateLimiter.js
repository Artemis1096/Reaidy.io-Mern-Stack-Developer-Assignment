const redisClient = require('../config/redis');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const rateLimiter = (limit = 100, windowSeconds = 900) => async (req, res, next) => {
    try {
        if (!redisClient.isOpen) {
            // Fail open if redis is down to avoid blocking traffic, or fail closed?
            // Let's fail open but log warning
            console.warn('Redis not connected, skipping rate limit');
            return next();
        }

        const ip = req.ip; // Or use user ID if authenticated
        const key = `ratelimit:${ip}`;

        const requests = await redisClient.incr(key);

        if (requests === 1) {
            await redisClient.expire(key, windowSeconds);
        }

        if (requests > limit) {
            const ttl = await redisClient.ttl(key);
            res.set('Retry-After', ttl);
            throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests, please try again later.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = rateLimiter;
