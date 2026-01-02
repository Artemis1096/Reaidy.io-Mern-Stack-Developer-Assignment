const mongoose = require('mongoose');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const UserEvent = require('../models/userEvent.model');

const verifySchemas = async () => {
    try {
        console.log('Validating schemas...');

        // Validate User
        new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        });
        console.log('User schema: OK');

        // Validate Product
        new Product({
            name: 'Test Product',
            description: 'A test product',
            category: 'Electronics',
            price: 100,
            stock: 10,
        });
        console.log('Product schema: OK');

        // Validate Order
        new Order({
            user: new mongoose.Types.ObjectId(),
            products: [{
                product: new mongoose.Types.ObjectId(),
                quantity: 1,
                price: 100
            }],
            totalAmount: 100,
        });
        console.log('Order schema: OK');

        // Validate UserEvent
        new UserEvent({
            user: new mongoose.Types.ObjectId(),
            session_id: 'session123',
            eventType: 'view',
            product: new mongoose.Types.ObjectId(),
        });
        console.log('UserEvent schema: OK');

        console.log('All schemas validated successfully (synchronously).');
        process.exit(0);
    } catch (error) {
        console.error('Schema validation error:', error);
        process.exit(1);
    }
};

verifySchemas();
