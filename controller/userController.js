const User= require('../model/userModel')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const getAlluser = async (req, res) => {
    try {
      const user = await User.find().exec();
      const response = user.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      }));
      res.status(200).json({
        success: true,
        data: response,
        message: "User retrieved successfully"
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

const getUserbyid = async (req, res) => {
    try {
      const user = await User.findById(req.params.userid).exec();
      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "User not found"
        });
      }
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      };
      res.status(200).json({
        success: true,
        data: response,
        message: "User retrieved successfully"
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
  
  const addUser = async (req, res) => {
    try {
      const { email, password, ...data } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
     
      const hash = bcrypt.hashSync(password, saltRounds);
      
      const user = new User({
        ...data,
        email, 
        password: hash,
      });
      await user.save();
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      };
    
     res.status(200).json({
      success: true,
      data: response,
      message: "User added successfully"
    });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
 
 const updateUser = async (req, res) => {
    try {
      const updateuser = await User.findByIdAndUpdate(req.params.userid, req.body, {new:true})
      if (!updateuser) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "User not found"
        });
      }
      const response = {
        _id: updateuser._id,
        name: updateuser.name,
        email: updateuser.email,
        phone: updateuser.phone,
        role: updateuser.role,
        address: updateuser.address,
        fcmtoken: updateuser.fcmtoken
      };
      res.status(200).json({
        success: true,
        data: response,
        message: "User updated successfully"
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
  
 const deleteUser = async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.userid);
      res.status(200).json({
        success: true,
        data: null,
        message: "User deleted successfully"
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


  module.exports={
    getAlluser,
    getUserbyid,
    addUser,
    updateUser,
    deleteUser
  }