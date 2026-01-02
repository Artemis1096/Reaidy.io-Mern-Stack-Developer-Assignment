const mongoose = require('mongoose');
require('dotenv').config();

const check = async () => {
    try {
        console.log('Attempting to connect to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
};

check();
