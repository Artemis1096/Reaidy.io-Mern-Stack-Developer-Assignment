const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');

/**
 * Optional authentication middleware
 * If token is provided and valid, sets req.user
 * If no token or invalid token, continues without req.user (guest mode)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided - guest user, continue
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const payload = jwt.verify(token, config.jwt.secret);
            
            if (payload && payload.sub) {
                const user = await User.findById(payload.sub);
                if (user) {
                    req.user = user;
                }
            }
        } catch (tokenError) {
            // Invalid token - continue as guest
            // Don't throw error, just continue without req.user
        }

        next();
    } catch (error) {
        // On any error, continue as guest
        next();
    }
};

module.exports = optionalAuth;

