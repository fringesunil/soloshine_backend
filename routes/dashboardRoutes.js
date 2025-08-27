const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');
const { getDashboardStats } = require('../controller/dashboardController');

const router = express.Router();

router.get('/', authenticateToken,checkAdmin, getDashboardStats);

module.exports = router; 