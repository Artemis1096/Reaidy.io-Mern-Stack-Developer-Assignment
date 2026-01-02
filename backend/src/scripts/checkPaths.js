const fs = require('fs');
const path = require('path');

const checkPath = (relativePath) => {
    const fullPath = path.resolve(__dirname, relativePath);
    console.log(`Checking ${relativePath}... ${fs.existsSync(fullPath) ? 'EXISTS' : 'MISSING'} (${fullPath})`);
};

console.log('Checking component paths:');
checkPath('../middleware/validate.js');
checkPath('../controllers/tracking.controller.js');
checkPath('../routes/v1/tracking.route.js');
checkPath('../models/index.js');
checkPath('../models/userEvent.model.js');
checkPath('../config/redis.js');
checkPath('../utils/catchAsync.js');
checkPath('../utils/ApiError.js');

try {
    console.log('Checking joi...');
    require.resolve('joi');
    console.log('joi FOUND');
} catch (e) {
    console.error('joi MISSING');
}

try {
    console.log('Checking redis...');
    require.resolve('redis');
    console.log('redis FOUND');
} catch (e) {
    console.error('redis MISSING');
}
