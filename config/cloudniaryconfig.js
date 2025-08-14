const {v2} = require("cloudinary")

v2.config({ 
    cloud_name: process.env.C_NAME, 
    api_key: process.env.C_API_KEY, 
    api_secret: process.env.C_API_SECRET
});

 const cloudinaryInstance = v2;

 module.exports={
    cloudinaryInstance
 }