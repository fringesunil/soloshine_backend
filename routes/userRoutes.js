const express = require('express');
const { getAlluser, getUserbyid, addUser, updateUser, deleteUser, forgetPassword } = require('../controller/userController');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');


const router = express.Router();

router.get('/', authenticateToken, getAlluser);

router.get('/:userid', authenticateToken, getUserbyid);

router.post('/', addUser);

router.post('/forget-password', forgetPassword);

router.patch('/:userid', authenticateToken, updateUser);

router.delete('/:userid', authenticateToken, checkAdmin, deleteUser);


module.exports = router; 