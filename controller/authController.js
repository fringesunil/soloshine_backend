
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');

const login = async (req, res) => {
   const {email, password}=req.body;
   const user = await User.findOne({ email: email }).exec();
   if(!user){
    return res.status(404).json({
         success: false,
         data: null,
         message: "Invalid Email id"
    })
   }
   const passwordMatch =  bcrypt.compareSync(password,user.password)
   if(passwordMatch){
        const token = jwt.sign({ _id: user._id,email: user.email,role:user.role }, process.env.JWT_SECRET_KEY,{expiresIn: '6h'});
        res.status(200).json(
           {
             success: true,
             data: {
               _id: user._id,
               name:user.name,
               email: user.email,
               role: user.role,
               token: token
             },
             message: "Login Successfully"
           }
        )
   }else{
    res.status(401).json({
       success: false,
       data: null,
       message: "Invalid Password"
       })
  }
  }

  module.exports={
    login
  }