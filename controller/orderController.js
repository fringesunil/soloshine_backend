const Order = require("../model/orderModel");
const User = require("../model/userModel");
const { imageUpload, imageUploadimgbb } = require("../utlis/imageUpload");
const { uploadFileToStorage, deleteFilesFromStorage } = require("../utlis/storageManager");
const { sendNotificationToRoles } = require("../utlis/notification");
const { getNextSequence } = require("../utlis/sequence");

const getAllOrder = async (req, res) => {
    try {
        const { startDate, endDate, ...otherFilters } = req.query;

        let filter = { ...otherFilters };
        if (startDate && endDate) {
            filter.orderdate = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        } else if (startDate) {
            filter.orderdate = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0))
            };
        } else if (endDate) {
            filter.orderdate = {
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const order = await Order.find(filter)
            .populate('userid', '-password')
            .populate({
                path: 'ornamentdetails.name',
                model: 'Category'
            }).populate('partyname', "_id name").populate('updatedby', "_id name").populate('statushistory.updatedby', '_id name')
            .exec();

        res.status(200).json({
            success: true,
            data: order,
            message: "Order retrieved successfully"
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



const getOrderbyid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderid).populate('userid', '-password').populate({
            path: 'ornamentdetails.name',
            model: 'Category'
        }).populate('partyname', "_id name").populate('updatedby', "_id name").populate('statushistory.updatedby', '_id name').exec();
        if (!order) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: order,
            message: "Order retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
}

const addOrder = async (req, res) => {
    try {
        let { ornamentDetails, userid, orderdate, ordertype, orderpriority, partyname, orderno } = req.body;

        if (typeof ornamentDetails === 'string') {
            ornamentDetails = JSON.parse(ornamentDetails);
        }

        if (req.files) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const imageFieldName = `image${i}`;
                const imageFilesForItem = req.files.filter(file => file.fieldname === imageFieldName);

                if (imageFilesForItem.length > 0) {
                    const uploadResults = await Promise.all(
                        imageFilesForItem.map(file => uploadFileToStorage(file.path, { fileName: file.originalname }))
                    );
                    ornamentDetails[i].image = uploadResults.map(r => r.url);
                    ornamentDetails[i].backupimage = uploadResults.map(r => r.backupUrl || '');
                }
            }
        }
        if (ordertype === 'Bulk') {
            const existingOrder = await Order.findOne({ orderno });
            if (existingOrder) {
                return res.status(400).json({
                    success: false,
                    message: "Order number already exists. Please use a different order number."
                });
            }
        }

        const seq = await getNextSequence('order');
        const length = String(seq).length;
        const totalLength = length < 4 ? 4 : length;
        let ordernos = String(seq).padStart(totalLength, '0');
        orderno = ordertype === 'Bulk' ? orderno : `BK${ordernos}`;

        const order = new Order({
            userid,
            orderdate,
            ordertype,
            orderno,
            ornamentdetails: ornamentDetails,
            orderpriority,
            partyname,
            statushistory: [{
                status: 'Pending',
                updatedby: userid,
                updatedAt: new Date()
            }]
        });

        await order.save();
        try {
            const user = await User.findById(userid).select("name email");

            const title = "New order created";
            const body = `Order #${orderno} (${ordertype}) was created by ${user?.name || 'Unknown User'}`;
            const data = {
                orderId: String(order._id),
                orderno: String(orderno),
                ordertype: String(ordertype),
                createdBy: user?.name || 'Unknown User'
            };
            sendNotificationToRoles(['admin', 'employee'], title, body, data).catch(() => { });
        } catch (_) { }

        res.status(200).json({
            success: true,
            data: order,
            message: "Order Added successfully"
        });

    } catch (error) {
        console.error("Error in addOrder controller:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
};


// const updateOrder = async (req, res) => {
//     try {
//         let { ornamentDetails, userid, orderdate, ordertype, status,orderpriority,partyname,updatedby } = req.body;

//         if (typeof ornamentDetails === 'string') {
//             ornamentDetails = JSON.parse(ornamentDetails);
//         }


//         const existingOrder = await Order.findById(req.params.orderid);
//         if (!existingOrder) {
//             return res.status(404).json({
//                 success: false,
//                 data: null,
//                 message: "Order not found"
//             });
//         }


//         if (ornamentDetails && req.files && req.files.length > 0) {
//             for (let i = 0; i < ornamentDetails.length; i++) {
//                 const imageFieldName = `image${i}`;
//                 const imageFilesForItem = req.files.filter(file => file.fieldname === imageFieldName);

//                 if (imageFilesForItem.length > 0) {
//                     const uploadedUrls = await Promise.all(
//                         imageFilesForItem.map(file => uploadFileToSupabase(file.path, { fileName: file.originalname }))
//                     );
//                     ornamentDetails[i].image = uploadedUrls;
//                 } else {
//                     ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
//                 }
//             }
//         } else if (ornamentDetails) {
//             for (let i = 0; i < ornamentDetails.length; i++) {
//                 ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
//             }
//         }


//         const updateData = {};
//         if (userid !== undefined) updateData.userid = userid;
//         if (orderdate !== undefined) updateData.orderdate = orderdate;
//         if (ordertype !== undefined) updateData.ordertype = ordertype;
//         if (status !== undefined) updateData.status = status;
//          if (orderpriority !== undefined) updateData.orderpriority = orderpriority;
//         if (ornamentDetails !== undefined) updateData.ornamentdetails = ornamentDetails;
//          if (partyname !== undefined) updateData.partyname = partyname;
//           if (updatedby !== undefined) updateData.updatedby = updatedby;

//         const updatedOrder = await Order.findByIdAndUpdate(
//             req.params.orderid,
//             { $set: updateData },
//             { new: true }
//         );
//          try {
//             const updaterId = updatedby || updatedOrder.updatedby || null;
//             const updater = updaterId ? await User.findById(updaterId).select("name email") : null;
//             const title = "Order updated";
//             let body = `Order #${updatedOrder.orderno} was updated`;
//             if (status) {
//                 body += ` — status changed to ${status}`;
//             }
//             if (updater?.name) {
//                 body += ` by ${updater.name}`;
//             }

//             const data = {
//                 orderId: String(updatedOrder._id),
//                 orderno: String(updatedOrder.orderno),
//                 updatedBy: updater?.name || 'Unknown User',
//                 status: updatedOrder.status || ''
//             };
//             sendNotificationToRoles(['admin', 'employee'], title, body, data).catch(() => { });
//         } catch (notifErr) {
//         }

//         res.status(200).json({
//             success: true,
//             data: updatedOrder,
//             message: "Order Updated successfully"
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             data: null,
//             message: "Server error",
//             error: error.message
//         });
//     }
// };





const updateOrder = async (req, res) => {
    try {
        let { ornamentDetails, userid, orderdate, ordertype, status, orderpriority, partyname, updatedby, orderno } = req.body;

        if (typeof ornamentDetails === 'string') {
            ornamentDetails = JSON.parse(ornamentDetails);
        }

        const existingOrder = await Order.findById(req.params.orderid);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Order not found"
            });
        }

        if (orderno) {
            const existingOrderWithNumber = await Order.findOne({ orderno });
            if (existingOrderWithNumber && existingOrderWithNumber._id.toString() !== req.params.orderid) {
                return res.status(400).json({
                    success: false,
                    message: "Order number already exists. Please use a different order number."
                });
            }
        }


        const newStatus = (status !== undefined && status !== null) ? status : existingOrder.status;


        if (ornamentDetails && Array.isArray(ornamentDetails)) {

            const hasPartialDeliveryInPayload = ornamentDetails.some(item =>
                item && item.partialdelivery && Array.isArray(item.partialdelivery) && item.partialdelivery.length > 0
            );

            if (hasPartialDeliveryInPayload && newStatus !== 'Partial Delivery') {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: "Cannot add partialdelivery unless order status is 'Partial Delivery'. Set status to 'Partial Delivery' to add partialdelivery."
                });
            }
        }


        if (ornamentDetails && Array.isArray(ornamentDetails)) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const currentItem = ornamentDetails[i];
                const existingItem = existingOrder.ornamentdetails[i];

                if (currentItem.partialdelivery && Array.isArray(currentItem.partialdelivery)) {
                    const existingPartialDelivery = existingItem?.partialdelivery || [];


                    currentItem.partialdelivery.forEach(newEntry => {

                        const existingEntryIndex = existingPartialDelivery.findIndex(existing =>
                            existing.deliverydate && newEntry.deliverydate &&
                            new Date(existing.deliverydate).getTime() === new Date(newEntry.deliverydate).getTime()
                        );

                        if (existingEntryIndex !== -1) {

                            existingPartialDelivery[existingEntryIndex].qty = newEntry.qty;
                        } else {

                            existingPartialDelivery.push({
                                deliverydate: newEntry.deliverydate,
                                qty: newEntry.qty,
                                deliverynote: newEntry.deliverynote
                            });
                        }
                    });


                    currentItem.partialdelivery = existingPartialDelivery;
                } else if (existingItem?.partialdelivery) {

                    currentItem.partialdelivery = existingItem.partialdelivery;
                }
            }
        }


        if (ornamentDetails && req.files && req.files.length > 0) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const imageFieldName = `image${i}`;
                const imageFilesForItem = req.files.filter(file => file.fieldname === imageFieldName);

                // Get images already present for this item (sent by client)
                let currentItemImages = [];
                if (ornamentDetails[i].image && Array.isArray(ornamentDetails[i].image)) {
                    currentItemImages = ornamentDetails[i].image;
                } else if (existingOrder.ornamentdetails[i]?.image) {
                    // Fallback to database only if client didn't provide an image list
                    currentItemImages = existingOrder.ornamentdetails[i].image;
                }

                // Get backup images already present for this item
                let currentItemBackupImages = [];
                if (ornamentDetails[i].backupimage && Array.isArray(ornamentDetails[i].backupimage)) {
                    currentItemBackupImages = ornamentDetails[i].backupimage;
                } else if (existingOrder.ornamentdetails[i]?.backupimage) {
                    currentItemBackupImages = existingOrder.ornamentdetails[i].backupimage;
                }

                if (imageFilesForItem.length > 0) {
                    const uploadResults = await Promise.all(
                        imageFilesForItem.map(file => uploadFileToStorage(file.path, { fileName: file.originalname }))
                    );
                    // Merge existing and new images
                    ornamentDetails[i].image = [...currentItemImages, ...uploadResults.map(r => r.url)];
                    ornamentDetails[i].backupimage = [...currentItemBackupImages, ...uploadResults.map(r => r.backupUrl || '')];
                } else {
                    ornamentDetails[i].image = currentItemImages;
                    ornamentDetails[i].backupimage = currentItemBackupImages;
                }
            }
        } else if (ornamentDetails) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                // If client didn't send an image array, preserve what's in the database
                if (!ornamentDetails[i].image || !Array.isArray(ornamentDetails[i].image)) {
                    ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
                }
                if (!ornamentDetails[i].backupimage || !Array.isArray(ornamentDetails[i].backupimage)) {
                    ornamentDetails[i].backupimage = existingOrder.ornamentdetails[i]?.backupimage || [];
                }
            }
        }


        const updateData = {};
        if (userid !== undefined) updateData.userid = userid;
        if (orderdate !== undefined) updateData.orderdate = orderdate;
        if (ordertype !== undefined) updateData.ordertype = ordertype;
        if (status !== undefined) updateData.status = status;
        if (orderpriority !== undefined) updateData.orderpriority = orderpriority;
        if (ornamentDetails !== undefined) updateData.ornamentdetails = ornamentDetails;
        if (partyname !== undefined) updateData.partyname = partyname;
        if (updatedby !== undefined) updateData.updatedby = updatedby;
        if (orderno !== undefined) updateData.orderno = orderno;

        const updateQuery = { $set: updateData };
        if (status !== undefined && status !== existingOrder.status) {
            updateQuery.$push = {
                statushistory: {
                    status: status,
                    updatedby: updatedby || existingOrder.updatedby || null,
                    updatedAt: new Date()
                }
            };
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderid,
            updateQuery,
            { new: true }
        );


        try {
            const updaterId = updatedby || updatedOrder.updatedby || null;
            const updater = updaterId ? await User.findById(updaterId).select("name email") : null;
            const title = "Order updated";
            let body = `Order #${updatedOrder.orderno} was updated`;
            if (status) {
                body += ` — status changed to ${status}`;
            }
            if (updater?.name) {
                body += ` by ${updater.name}`;
            }

            const data = {
                orderId: String(updatedOrder._id),
                orderno: String(updatedOrder.orderno),
                updatedBy: updater?.name || 'Unknown User',
                status: updatedOrder.status || ''
            };
            sendNotificationToRoles(['admin', 'employee'], title, body, data).catch(() => { });
        } catch (notifErr) {

        }

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: "Order Updated successfully"
        });

    } catch (error) {
        console.error("Error in updateOrder controller:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });
    }
};


const deleteOrder = async (req, res) => {
    await Order.findByIdAndDelete(req.params.orderid)
    res.status(200).json({
        success: true,
        data: [],
        message: "Order deleted successfully"
    });
}

const updateOrderStatusBulk = async (req, res) => {
    try {
        const { orderIds, status, updatedby } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Order IDs array is required and cannot be empty"
            });
        }

        if (!status || !['Pending', 'In Progress', 'Completed', 'Cancelled', 'Due', 'Delay'].includes(status)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Valid status is required (Pending, In Progress, Completed, Cancelled, Due, Delay)"
            });
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                $set: {
                    status,
                    updatedby: updatedby,
                },
                $push: {
                    statushistory: {
                        status: status,
                        updatedby: updatedby,
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "No orders found with provided IDs"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            },
            message: "Order statuses updated successfully"
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

const deleteCompletedAndCancelledOrders = async (req, res) => {
    try {
        const ordersToDelete = await Order.find({ status: { $in: ['Delivered', 'Cancelled'] } });

        if (!ordersToDelete || ordersToDelete.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No cancelled or delivered orders found to delete"
            });
        }

        let imageUrls = [];
        ordersToDelete.forEach(order => {
            if (order.ornamentdetails && Array.isArray(order.ornamentdetails)) {
                order.ornamentdetails.forEach(item => {
                    if (item.image && Array.isArray(item.image)) {
                        imageUrls.push(...item.image);
                    }
                    if (item.backupimage && Array.isArray(item.backupimage)) {
                        imageUrls.push(...item.backupimage);
                    }
                });
            }
        });

        if (imageUrls.length > 0) {
            await deleteFilesFromStorage(imageUrls);
        }

        const orderIds = ordersToDelete.map(order => order._id);
        const result = await Order.deleteMany({ _id: { $in: orderIds } });

        res.status(200).json({
            success: true,
            data: {
                deletedOrdersCount: result.deletedCount,
                deletedImagesCount: imageUrls.length
            },
            message: "Cancelled and Delivered orders and their associated images deleted successfully"
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

module.exports = {
    getAllOrder,
    getOrderbyid,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatusBulk,
    deleteCompletedAndCancelledOrders,
}