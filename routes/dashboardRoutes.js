const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');
const { getDashboardStats, getOrderGraphData } = require('../controller/dashboardController');

const router = express.Router();

router.get('/', authenticateToken,checkAdmin, getDashboardStats);
router.get('/graph', authenticateToken, checkAdmin, getOrderGraphData);

module.exports = router; 