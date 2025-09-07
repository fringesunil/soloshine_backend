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
        
        // Set default date range if not provided
        let defaultStartDate, defaultEndDate;
        if (!startDate || !endDate) {
            // If no date range provided, get the last 30 days by default
            defaultEndDate = new Date();
            defaultStartDate = new Date();
            defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        }

        // Build date filter
        let dateFilter = {};
        const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
        const actualEndDate = endDate ? new Date(endDate) : defaultEndDate;
        
        dateFilter.orderdate = {
            $gte: actualStartDate,
            $lte: actualEndDate
        };

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

        // Create a map of existing data for quick lookup
        const dataMap = new Map();
        orderGraphData.forEach(item => {
            const singleOrder = item.orders.find(order => order.orderType === 'Single');
            const bulkOrder = item.orders.find(order => order.orderType === 'Bulk');
            
            dataMap.set(item._id, {
                date: item._id,
                totalOrders: item.totalOrders,
                singleOrders: singleOrder ? singleOrder.count : 0,
                bulkOrders: bulkOrder ? bulkOrder.count : 0
            });
        });

        // Generate complete date range and fill missing dates with zeros
        const formattedData = [];
        const currentDate = new Date(actualStartDate);
        
        while (currentDate <= actualEndDate) {
            let dateKey;
            
            switch (groupBy) {
                case 'day':
                    dateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                case 'week':
                    const year = currentDate.getFullYear();
                    const week = getWeekNumber(currentDate);
                    dateKey = `${year}-${week.toString().padStart(2, '0')}`;
                    break;
                case 'month':
                    dateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
                case 'year':
                    dateKey = currentDate.getFullYear().toString();
                    break;
                default:
                    dateKey = currentDate.toISOString().split('T')[0];
            }
            
            // Add data for this date (existing or zero)
            if (dataMap.has(dateKey)) {
                formattedData.push(dataMap.get(dateKey));
            } else {
                formattedData.push({
                    date: dateKey,
                    totalOrders: 0,
                    singleOrders: 0,
                    bulkOrders: 0
                });
            }
            
            // Move to next period
            switch (groupBy) {
                case 'day':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'week':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'month':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'year':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
                default:
                    currentDate.setDate(currentDate.getDate() + 1);
            }
        }

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

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports={
    getDashboardStats,
    getOrderGraphData
}