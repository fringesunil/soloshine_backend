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

    // Helper pads
    const pad2 = (n) => n.toString().padStart(2, '0');

    // Helper to compute week number similar to Mongo's %U (week number of year, Sunday-first)
    const getWeekNumber = (d) => {
      // Use local date parts but compute based on UTC math to avoid DST weirdness
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((date - jan1) / 86400000);
      // jan1.getUTCDay() gives day of week of Jan 1 (0 = Sunday)
      const weekNum = Math.floor((dayOfYear + jan1.getUTCDay()) / 7);
      return weekNum; // number (0..53)
    };

    // Format dates to match $dateToString outputs used in aggregation
    const formatKey = (d, group) => {
      const y = d.getFullYear();
      if (group === 'day') {
        return `${y}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; // YYYY-MM-DD
      }
      if (group === 'week') {
        const week = getWeekNumber(d);
        return `${y}-${pad2(week)}`; // YYYY-WW (week zero-based like %U)
      }
      if (group === 'month') {
        return `${y}-${pad2(d.getMonth() + 1)}`; // YYYY-MM
      }
      if (group === 'year') {
        return `${y}`; // YYYY
      }
      return `${y}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    // Set default date range to last 30 days if not provided
    let defaultStartDate = null;
    let defaultEndDate = null;
    if (!startDate || !endDate) {
      defaultEndDate = new Date();
      defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    }

    // actualStartDate/actualEndDate (force start at 00:00:00.000 and end at 23:59:59.999)
    const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const actualEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // normalize times to include full days (override time portion)
    actualStartDate.setHours(0, 0, 0, 0);
    actualEndDate.setHours(23, 59, 59, 999);

    // Build date filter
    const dateFilter = {
      orderdate: {
        $gte: actualStartDate,
        $lte: actualEndDate,
      },
    };

    // Determine date grouping format for Mongo $dateToString
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U'; // week number, Sunday-first (matches our getWeekNumber)
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
            date: { $dateToString: { format: dateFormat, date: '$orderdate' } },
            orderType: '$ordertype',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          orders: {
            $push: {
              orderType: '$_id.orderType',
              count: '$count',
            },
          },
          totalOrders: { $sum: '$count' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Create lookup map
    const dataMap = new Map();
    orderGraphData.forEach((item) => {
      const singleOrder = item.orders.find((o) => o.orderType === 'Single');
      const bulkOrder = item.orders.find((o) => o.orderType === 'Bulk');

      dataMap.set(item._id, {
        date: item._id,
        totalOrders: item.totalOrders,
        singleOrders: singleOrder ? singleOrder.count : 0,
        bulkOrders: bulkOrder ? bulkOrder.count : 0,
      });
    });

    // Generate complete range and fill missing entries
    const formattedData = [];
    const currentDate = new Date(actualStartDate);

    while (currentDate <= actualEndDate) {
      const dateKey = formatKey(currentDate, groupBy);

      if (dataMap.has(dateKey)) {
        formattedData.push(dataMap.get(dateKey));
      } else {
        formattedData.push({
          date: dateKey,
          totalOrders: 0,
          singleOrders: 0,
          bulkOrders: 0,
        });
      }

      // Advance currentDate by period
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

    return res.status(200).json({
      success: true,
      data: formattedData,
      message: 'Order graph data retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error',
      error: error.message,
    });
  }
};




module.exports={
    getDashboardStats,
    getOrderGraphData
}