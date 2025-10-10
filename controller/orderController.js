const Order = require("../model/orderModel");
const User = require("../model/userModel");
const { imageUpload, imageUploadimgbb } = require("../utlis/imageUpload");
const { uploadFileToSupabase } = require("../utlis/supabase");
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
            }).populate('partyname',"_id name").populate('updatedby',"_id name")
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
        const order = await Order.findById(req.params.orderid).populate('userid','-password').populate({path:'ornamentdetails.name',
            model:'Category'
        }).populate('partyname',"_id name").populate('updatedby',"_id name").exec();
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
    let { ornamentDetails, userid, orderdate, ordertype, orderpriority,partyname,orderno } = req.body;

    if (typeof ornamentDetails === 'string') {
      ornamentDetails = JSON.parse(ornamentDetails);
    }

    if (req.files) {
      for (let i = 0; i < ornamentDetails.length; i++) {
        const imageFieldName = `image${i}`;
        const imageFilesForItem = req.files.filter(file => file.fieldname === imageFieldName);

        if (imageFilesForItem.length > 0) {
          const uploadedUrls = await Promise.all(
            imageFilesForItem.map(file => uploadFileToSupabase(file.path, { fileName: file.originalname }))
          );
          ornamentDetails[i].image = uploadedUrls;
        }
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
      partyname
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
      sendNotificationToRoles(['admin', 'employee'], title, body, data).catch(() => {});
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: order,
      message: "Order Added successfully"
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
        let { ornamentDetails, userid, orderdate, ordertype, status, orderpriority, partyname, updatedby } = req.body;

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

        // Determine what the status will be after update
        const newStatus = (status !== undefined && status !== null) ? status : existingOrder.status;

        // If ornamentDetails present, check for partialdelivery entries
        if (ornamentDetails && Array.isArray(ornamentDetails)) {
            // If any ornament item contains partialdelivery and the newStatus is not "Partial Delivery", reject
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

        // Handle images: if images are uploaded map them to respective ornament items
        if (ornamentDetails && req.files && req.files.length > 0) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const imageFieldName = `image${i}`;
                const imageFilesForItem = req.files.filter(file => file.fieldname === imageFieldName);

                if (imageFilesForItem.length > 0) {
                    const uploadedUrls = await Promise.all(
                        imageFilesForItem.map(file => uploadFileToSupabase(file.path, { fileName: file.originalname }))
                    );
                    ornamentDetails[i].image = uploadedUrls;
                } else {
                    ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
                }
            }
        } else if (ornamentDetails) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
            }
        }

        // Build update object
        const updateData = {};
        if (userid !== undefined) updateData.userid = userid;
        if (orderdate !== undefined) updateData.orderdate = orderdate;
        if (ordertype !== undefined) updateData.ordertype = ordertype;
        if (status !== undefined) updateData.status = status;
        if (orderpriority !== undefined) updateData.orderpriority = orderpriority;
        if (ornamentDetails !== undefined) updateData.ornamentdetails = ornamentDetails;
        if (partyname !== undefined) updateData.partyname = partyname;
        if (updatedby !== undefined) updateData.updatedby = updatedby;

        // Perform update
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderid,
            { $set: updateData },
            { new: true }
        );

        // Send notification (best-effort)
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
            // ignore notification errors
        }

        res.status(200).json({
            success: true,
            data: updatedOrder,
            message: "Order Updated successfully"
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


const deleteOrder = async (req, res) => {
    await  Order.findByIdAndDelete(req.params.orderid)
    res.status(200).json({
            success: true,
            data: [],
            message: "Order deleted successfully"
        });
  }

  const updateOrderStatusBulk = async (req, res) => {
    try {
        const { orderIds, status,updatedby } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Order IDs array is required and cannot be empty"
            });
        }

        if (!status || !['Pending', 'In Progress', 'Completed', 'Cancelled','Due','Delay'].includes(status)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Valid status is required (Pending, In Progress, Completed, Cancelled, Due, Delay)"
            });
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status,
                 updatedby: updatedby, 
             } },
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

  module.exports={
    getAllOrder,
    getOrderbyid,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatusBulk,
  }