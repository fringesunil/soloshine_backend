const express = require('express');
const { getAlluser, getUserbyid, addUser, updateUser, deleteUser } = require('../controller/userController');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');


const router = express.Router();

router.get('/', authenticateToken,getAlluser);

router.get('/:userid',authenticateToken, getUserbyid);

router.post('/', addUser);

router.patch('/:userid',authenticateToken,checkAdmin, updateUser);

router.delete('/:userid',authenticateToken,checkAdmin, deleteUser);


module.exports = router; 