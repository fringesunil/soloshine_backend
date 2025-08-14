const Order = require("../model/orderModel");
const { imageUpload } = require("../utlis/imageUpload");

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
          let imageUrl=[];
          const { ornamentDetails,userid,orderdate,ordertype } = req.body;
          let parsedOrnamentDetails = ornamentDetails;
        if (typeof ornamentDetails === 'string') {
            parsedOrnamentDetails = JSON.parse(ornamentDetails);

        }     
        if (req.files && req.files['image']) {
      imageUrl = await Promise.all(
        req.files['image'].map(file => imageUpload(file.path))
      );
    } 
        const order = new Order({
            userid:userid,
            orderdate:orderdate,
            ordertype:ordertype,
            ornamentdetails:parsedOrnamentDetails,
            image:imageUrl

        })
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
}

 const updateOrder = async (req, res) => {
    try{
           let imageUrl=[];
          const { ornamentDetails,userid,orderdate,ordertype } = req.body;
          let parsedOrnamentDetails = ornamentDetails;
        if (typeof ornamentDetails === 'string') {
            parsedOrnamentDetails = JSON.parse(ornamentDetails);

        }     
        if (req.files && req.files['image']) {
      imageUrl = await Promise.all(
        req.files['image'].map(file => imageUpload(file.path))
      );
    } 
     const order = {
            userid:userid,
            orderdate:orderdate,
            ordertype:ordertype,
            ornamentdetails:parsedOrnamentDetails,
            image:imageUrl

        }
    const updateorder = await Order.findByIdAndUpdate(req.params.orderid, order, {new:true})
     res.status(200).json({
            success: true,
            data: updateorder,
            message: "Order Updated successfully"
        });
    }catch(error){
         res.status(500).json({
            success: false,
            data: null,
            message: "Server error",
            error: error.message
        });  
    }
  }

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