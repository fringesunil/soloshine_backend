const express = require('express');
const { getAllOrder, getOrderbyid, addOrder, updateOrder, deleteOrder } = require('../controller/orderController');
const { upload } = require('../middleware/multer');





const router = express.Router();

router.get('/', getAllOrder);

router.get('/:orderid',getOrderbyid);

router.post('/',upload.fields([{ name: 'image' }]),addOrder);

router.patch('/:orderid',upload.fields([{ name: 'image' }]),updateOrder);

router.delete('/:orderid',deleteOrder);


module.exports = router; 