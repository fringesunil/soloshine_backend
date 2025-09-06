const Order = require("../model/orderModel");
const { imageUpload, imageUploadimgbb } = require("../utlis/imageUpload");

const getAllOrder = async (req, res) => {
    try {
        const order = await Order.find(req.query).populate('userid','-password').populate({path:'ornamentdetails.name',
            model:'Category'
        }).exec();
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

const getOrderbyid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderid).populate('userid','-password').populate({path:'ornamentdetails.name',
            model:'Category'
        }).exec();
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
      let { ornamentDetails, userid, orderdate, ordertype } = req.body;
  
      if (typeof ornamentDetails === 'string') {
        ornamentDetails = JSON.parse(ornamentDetails);
      }
      if(req.files){
      for (let i = 0; i < ornamentDetails.length; i++) {
        const fieldName = `image${i}`;
        const filesForItem = req.files.filter(file => file.fieldname === fieldName);
  
        const uploadedUrls = await Promise.all(
          filesForItem.map(file => imageUploadimgbb(file.path))
        );
  
        ornamentDetails[i].image = uploadedUrls;
      }
      }
       let orderno;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;
     while (!isUnique && attempts < maxAttempts) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      orderno = ordertype === 'Bulk' ? randomNum.toString() : `BK${randomNum}`;
      const existingOrder = await Order.findOne({ orderno });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      return res.status(409).json({
        success: false,
        data: [],
        message: "Unable to generate a unique order number, please try again later"
      });
    }
    const order = new Order({
      userid,
      orderdate,
      ordertype,
      orderno,
      ornamentdetails: ornamentDetails
    });
  
      await order.save();
  
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

const updateOrder = async (req, res) => {
    try {
        let { ornamentDetails, userid, orderdate, ordertype, status } = req.body;

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

        
        if (ornamentDetails && req.files && req.files.length > 0) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const fieldName = `image${i}`;
                const filesForItem = req.files.filter(file => file.fieldname === fieldName);

                if (filesForItem.length > 0) {
                   
                    const uploadedUrls = await Promise.all(
                        filesForItem.map(file => imageUploadimgbb(file.path))
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

        
        const updateData = {};
        if (userid !== undefined) updateData.userid = userid;
        if (orderdate !== undefined) updateData.orderdate = orderdate;
        if (ordertype !== undefined) updateData.ordertype = ordertype;
        if (status !== undefined) updateData.status = status;
        if (ornamentDetails !== undefined) updateData.ornamentdetails = ornamentDetails;

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderid,
            { $set: updateData },
            { new: true }
        );

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
        const { orderIds, status } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Order IDs array is required and cannot be empty"
            });
        }

        if (!status || !['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Valid status is required (Pending, In Progress, Completed, Cancelled)"
            });
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status } },
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