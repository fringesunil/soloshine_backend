const Order = require("../model/orderModel");

const getDashboardStats = async (req, res) => {
    try {
      
        const singleOrderCount = await Order.countDocuments({ ordertype: 'Single' });
        const bulkOrderCount = await Order.countDocuments({ ordertype: 'Bulk' });
        
        const pendingCount = await Order.countDocuments({ status: 'Pending' });
        const inProgressCount = await Order.countDocuments({ status: 'In Progress' });
        const completedCount = await Order.countDocuments({ status: 'Completed' });
        const cancelledCount = await Order.countDocuments({ status: 'Cancelled' });
        
        const totalOrders = await Order.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                orderTypeCounts: {
                    single: singleOrderCount,
                    bulk: bulkOrderCount,
                    total: totalOrders
                },
                statusCounts: {
                    pending: pendingCount,
                    inProgress: inProgressCount,
                    completed: completedCount,
                    cancelled: cancelledCount
                }
            },
            message: "Dashboard statistics retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
};

module.exports={
    getDashboardStats
}