const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("./model/orderModel"); // adjust path if needed
const { deleteFilesFromStorage } = require("./utlis/storageManager");

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.DATA_BASE_URL);
        console.log("MongoDB Connected");

        const ordersToDelete = await Order.find({ status: { $in: ['Delivered', 'Cancelled'] } });

        if (!ordersToDelete || ordersToDelete.length === 0) {
            console.log("No cancelled or delivered orders found to delete");
            process.exit(0);
        }

        let imageUrls = [];
        ordersToDelete.forEach(order => {
            if (order.ornamentdetails && Array.isArray(order.ornamentdetails)) {
                order.ornamentdetails.forEach(item => {
                    if (item.image && Array.isArray(item.image)) {
                        imageUrls.push(...item.image);
                    }
                });
            }
        });

        console.log(`Found ${ordersToDelete.length} orders and ${imageUrls.length} images to delete.`);

        if (imageUrls.length > 0) {
            console.log("Deleting images/pdfs from storage provider...");
            await deleteFilesFromStorage(imageUrls);
            console.log("Images/pdfs deleted from storage.");
        }

        const orderIds = ordersToDelete.map(order => order._id);
        const result = await Order.deleteMany({ _id: { $in: orderIds } });
        console.log(`Deleted ${result.deletedCount} orders from MongoDB.`);

        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
};

cleanup();
