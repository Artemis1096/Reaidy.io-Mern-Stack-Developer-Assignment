const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.log('Redis Client Error', err.message));

(async () => {
    try {
        console.log('Connecting to Redis at:', process.env.REDIS_URL || 'redis://localhost:6379');
        await client.connect();
        console.log('Redis Connected Successfully!');
        await client.quit();
        process.exit(0);
    } catch (e) {
        console.error('Connection Failed:', e.message);
        process.exit(1);
    }
})();
