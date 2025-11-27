const express = require('express');
const { login } = require('../controller/authController');



const router = express.Router();


router.post('/login', login);

router.get('/ping',(req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is active",
    timestamp: new Date()
  });
})


module.exports = router; 