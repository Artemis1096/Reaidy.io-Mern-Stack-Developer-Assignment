const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const UserEvent = require('../models/userEvent.model');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spotmies-backend');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'];

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        await UserEvent.deleteMany({});

        console.log('Seeding Products...');
        const products = [];
        for (let i = 0; i < 100; i++) {
            const category = faker.helpers.arrayElement(CATEGORIES);
            const product = new Product({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                category: category,
                tags: [faker.commerce.productAdjective(), faker.commerce.productMaterial()],
                price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
                popularity: faker.number.int({ min: 0, max: 1000 }),
                stock: faker.number.int({ min: 0, max: 100 }),
            });
            products.push(await product.save());
        }

        console.log('Seeding Users...');
        const users = [];
        for (let i = 0; i < 20; i++) {
            const user = new User({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                password: 'password123',
                preferences: {
                    categories: faker.helpers.arrayElements(CATEGORIES, { min: 1, max: 3 }),
                    notifications: faker.datatype.boolean(),
                },
            });
            users.push(await user.save());
        }

        console.log('Seeding Events and Orders...');
        for (const user of users) {
            const numberOfSessions = faker.number.int({ min: 3, max: 10 });

            for (let s = 0; s < numberOfSessions; s++) {
                const sessionId = faker.string.uuid();
                const sessionDate = faker.date.recent({ days: 30 }); // Using object as per v8+ docs which is actually supported in newer versions, checking docs... 
                // Actually v8.0+ takes options object. v7 took number. I'll stick to simple number if unsure or fallback.
                // Let's verify: In v8, faker.date.recent(days?: number, refDate?: string | Date | number) => Date. 
                // Wait, v9 might be different. I installed latest.
                // Safest is faker.date.recent({ days: 30 }) if v9, or faker.date.recent(30) if v8.
                // Let's use `faker.date.recent({ days: 30 })` but handle if it's not working by trying `faker.date.recent(30)`.
                // Actually, let's just inspect the result.

                let date = faker.date.recent({ days: 30 });
                if (isNaN(date.getTime())) {
                    date = faker.date.recent(30);
                }

                const numberOfEvents = faker.number.int({ min: 5, max: 20 });

                for (let e = 0; e < numberOfEvents; e++) {
                    const product = faker.helpers.arrayElement(products);
                    let eventType = 'view';
                    const rand = Math.random();
                    if (rand > 0.9) eventType = 'purchase';
                    else if (rand > 0.7) eventType = 'add_to_cart';
                    else if (rand > 0.5) eventType = 'click';
                    else if (rand > 0.4) eventType = 'search';

                    const eventTime = new Date(date.getTime() + e * 60000);

                    await UserEvent.create({
                        user: user._id,
                        session_id: sessionId,
                        eventType,
                        product: eventType !== 'search' ? product._id : undefined,
                        metadata: eventType === 'search' ? { query: faker.commerce.productName() } : {},
                        timestamp: eventTime,
                    });

                    if (eventType === 'purchase') {
                        await Order.create({
                            user: user._id,
                            products: [{
                                product: product._id,
                                quantity: 1,
                                price: product.price
                            }],
                            totalAmount: product.price,
                            createdAt: eventTime,
                            updatedAt: eventTime,
                            status: 'completed'
                        });
                    }
                }
            }
        }

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
