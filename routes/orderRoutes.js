const express = require('express');
const { getAllOrder, getOrderbyid, addOrder, updateOrder, deleteOrder, updateOrderStatusBulk } = require('../controller/orderController');
const { upload } = require('../middleware/multer');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');





const router = express.Router();

router.get('/',authenticateToken, getAllOrder);

router.get('/:orderid',authenticateToken,getOrderbyid);

router.post('/',authenticateToken,upload.any(),addOrder);

router.patch('/:orderid',authenticateToken,upload.any(),updateOrder);

router.delete('/:orderid',authenticateToken,checkAdmin,deleteOrder);

router.post('/updateorderstatus',authenticateToken,updateOrderStatusBulk);

module.exports = router; 