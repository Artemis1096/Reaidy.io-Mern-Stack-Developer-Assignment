const catchAsync = require('../utils/catchAsync');
const recommendationService = require('../services/recommendation.service');
const ApiError = require('../utils/ApiError');

const getUserIdAndSession = (req) => {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.query.session_id || (req.user ? req.user._id.toString() : null);
    return { userId, sessionId };
};

const getPaginationParams = (req) => {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    return { page, limit };
};

const getHomeRecommendations = catchAsync(async (req, res) => {
    const { userId, sessionId } = getUserIdAndSession(req);
    const { page, limit } = getPaginationParams(req);

    if (!userId && !sessionId) {
        throw new ApiError(400, 'User ID or Session ID required');
    }

    const recommendations = await recommendationService.getHomeRecommendations(userId, sessionId, page, limit);
    res.send(recommendations);
});

const getProductRecommendations = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const { page, limit } = getPaginationParams(req); // Optional context

    const recommendations = await recommendationService.getProductRecommendations(productId, page, limit);
    res.send(recommendations);
});

const getCartRecommendations = catchAsync(async (req, res) => {
    const { userId, sessionId } = getUserIdAndSession(req);
    const { page, limit } = getPaginationParams(req);

    if (!userId && !sessionId) {
        throw new ApiError(400, 'User ID or Session ID required');
    }

    const recommendations = await recommendationService.getCartRecommendations(userId, sessionId, page, limit);
    res.send(recommendations);
});

module.exports = {
    getHomeRecommendations,
    getProductRecommendations,
    getCartRecommendations
};
