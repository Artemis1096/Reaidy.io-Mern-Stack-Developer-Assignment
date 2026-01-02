try {
    console.log('Requiring redis config...');
    require('../config/redis');
    console.log('Redis config OK');

    console.log('Requiring models...');
    require('../models');
    console.log('Models OK');

    console.log('Requiring catchAsync...');
    require('../utils/catchAsync');
    console.log('catchAsync OK');

    console.log('Requiring tracking controller...');
    require('../controllers/tracking.controller');
    console.log('Tracking Controller OK');

    console.log('Requiring tracking route...');
    require('../routes/v1/tracking.route');
    console.log('Tracking Route OK');

} catch (err) {
    console.error('Import Failed:', err);
}
