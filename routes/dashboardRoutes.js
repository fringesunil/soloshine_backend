const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/authToken');
const { getDashboardStats, getOrderGraphData, getStorageStats } = require('../controller/dashboardController');

const router = express.Router();

router.get('/', authenticateToken, checkAdmin, getDashboardStats);
router.get('/graph', authenticateToken, checkAdmin, getOrderGraphData);
router.get('/storage', authenticateToken, checkAdmin, getStorageStats);

module.exports = router; 