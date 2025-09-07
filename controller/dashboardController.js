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

const getOrderGraphData = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter.orderdate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            dateFilter.orderdate = { $gte: new Date(startDate) };
        } else if (endDate) {
            dateFilter.orderdate = { $lte: new Date(endDate) };
        }

        // Determine date grouping format based on groupBy parameter
        let dateFormat;
        switch (groupBy) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFormat = '%Y-%U';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        // Aggregate orders by date and order type
        const orderGraphData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: "$orderdate" } },
                        orderType: "$ordertype"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    orders: {
                        $push: {
                            orderType: "$_id.orderType",
                            count: "$count"
                        }
                    },
                    totalOrders: { $sum: "$count" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Format the data for frontend consumption
        const formattedData = orderGraphData.map(item => {
            const singleOrder = item.orders.find(order => order.orderType === 'Single');
            const bulkOrder = item.orders.find(order => order.orderType === 'Bulk');
            
            return {
                date: item._id,
                totalOrders: item.totalOrders,
                singleOrders: singleOrder ? singleOrder.count : 0,
                bulkOrders: bulkOrder ? bulkOrder.count : 0
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            message: "Order graph data retrieved successfully"
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
    getDashboardStats,
    getOrderGraphData
}