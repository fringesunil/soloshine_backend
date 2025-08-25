const Order = require("../model/orderModel");
const { imageUpload, imageUploadimgbb } = require("../utlis/imageUpload");

const getAllOrder = async (req, res) => {
    try {
        const order = await Order.find(req.query).populate('userid','-password').exec();
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
        const order = await Order.findById(req.params.orderid).populate('userid','-password').exec();
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
  
      for (let i = 0; i < ornamentDetails.length; i++) {
        const fieldName = `image${i}`;
        const filesForItem = req.files.filter(file => file.fieldname === fieldName);
  
        const uploadedUrls = await Promise.all(
          filesForItem.map(file => imageUploadimgbb(file.path))
        );
  
        ornamentDetails[i].image = uploadedUrls;
      }
  
      const order = new Order({
        userid,
        orderdate,
        ordertype,
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

        // Parse ornamentDetails if it's a string
        if (typeof ornamentDetails === 'string') {
            ornamentDetails = JSON.parse(ornamentDetails);
        }

        // Fetch the existing order to preserve current images
        const existingOrder = await Order.findById(req.params.orderid);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Order not found"
            });
        }

        // Process images only if req.files exists and has entries
        if (ornamentDetails && req.files && req.files.length > 0) {
            for (let i = 0; i < ornamentDetails.length; i++) {
                const fieldName = `image${i}`;
                const filesForItem = req.files.filter(file => file.fieldname === fieldName);

                if (filesForItem.length > 0) {
                    // Update images only if new files are provided
                    const uploadedUrls = await Promise.all(
                        filesForItem.map(file => imageUploadimgbb(file.path))
                    );
                    ornamentDetails[i].image = uploadedUrls;
                } else {
                    // Retain existing images from the database if no new files are provided
                    ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
                }
            }
        } else if (ornamentDetails) {
            // If ornamentDetails is provided but no files, retain existing images
            for (let i = 0; i < ornamentDetails.length; i++) {
                ornamentDetails[i].image = existingOrder.ornamentdetails[i]?.image || [];
            }
        }

        // Create update object with only provided fields
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

  module.exports={
    getAllOrder,
    getOrderbyid,
    addOrder,
    updateOrder,
    deleteOrder
  }