const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./model/orderModel');
const { cleanOrphanedCloudinaryImages } = require('./utlis/storageManager');

async function runTest() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.DATA_BASE_URL);
        console.log('Database connected.');

        console.log('Fetching orders to gather active images...');
        const orders = await Order.find({});
        let activeImageUrls = [];
        orders.forEach(order => {
            if (order.ornamentdetails && Array.isArray(order.ornamentdetails)) {
                order.ornamentdetails.forEach(item => {
                    if (item.image && Array.isArray(item.image)) {
                        activeImageUrls.push(...item.image);
                    }
                    if (item.backupimage && Array.isArray(item.backupimage)) {
                        activeImageUrls.push(...item.backupimage);
                    }
                });
            }
        });

        console.log(`Found ${activeImageUrls.length} active image URLs in MongoDB.`);
        
        console.log('Testing cleanOrphanedCloudinaryImages with date range (last 30 days)...');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const stats = await cleanOrphanedCloudinaryImages(activeImageUrls, thirtyDaysAgo, new Date());
        console.log('Stats returned:', stats);

        console.log('Test completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Test failed with error:', e);
        process.exit(1);
    }
}

runTest();
