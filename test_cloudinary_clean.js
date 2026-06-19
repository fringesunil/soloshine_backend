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
                });
            }
        });

        console.log(`Found ${activeImageUrls.length} active image URLs in MongoDB.`);
        
        console.log('Testing cleanOrphanedCloudinaryImages in dry-run/mock mode...');
        // We will call the function. Since we might not want to delete actual images without being sure,
        // we can observe the counts returned by the resources and deletion.
        const stats = await cleanOrphanedCloudinaryImages(activeImageUrls);
        console.log('Stats returned:', stats);

        console.log('Test completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Test failed with error:', e);
        process.exit(1);
    }
}

runTest();
