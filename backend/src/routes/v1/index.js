const express = require('express');
const router = express.Router();

const trackingRoute = require('./tracking.route');

const defaultRoutes = [
    {
        path: '/health',
        route: (req, res) => res.send('OK'),
    },
    {
        path: '/tracking',
        route: trackingRoute,
    },
    {
        path: '/auth',
        route: require('./auth.route'),
    },
];

defaultRoutes.forEach((route) => {
    console.log('Mounting route: ' + route.path);
    router.use(route.path, route.route);
});

router.use('/recommendations', require('./recommendation.route'));
router.use('/orders', require('./order.route'));

module.exports = router;
