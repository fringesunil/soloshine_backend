const express = require('express')
const { authenticateToken, checkAdmin } = require('../middleware/authToken')
const { getAllcategory, getCategorybyid, addCategory, updateCategory, deleteCategory } = require('../controller/categoryController')
const router = express.Router()


router.get('/' ,authenticateToken,getAllcategory)

router.get('/:categoryid' ,authenticateToken,getCategorybyid )

router.post('/',authenticateToken,checkAdmin,addCategory)

router.patch('/:categoryid',authenticateToken,checkAdmin,updateCategory)

router.delete('/:categoryid',authenticateToken,checkAdmin,deleteCategory)

module.exports = router