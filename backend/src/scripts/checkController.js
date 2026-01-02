try {
    console.log('Loading tracking controller...');
    require('../controllers/tracking.controller');
    console.log('Tracking Controller Loaded Successfully');
} catch (err) {
    console.error('Failed to load tracking controller:', err);
}
