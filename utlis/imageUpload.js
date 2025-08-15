require('dotenv').config()
const { cloudinaryInstance } = require("../config/cloudniaryconfig");
const fs = require('fs');
const FormData = require('form-data');
const { default: axios } = require("axios");

const imageUpload = async(path)=>{
    try{
        const uploadresult =  await cloudinaryInstance.uploader.upload(path)
        return uploadresult.url;
    }catch(e){
        throw new Error(`Image upload failed: ${e.message}`);
    }
}

const imageUploadimgbb = async (filePath) => {
    try {
       
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            throw new Error(`Path is not a file: ${filePath}`);
        }

        console.log('Uploading file:', filePath);
        console.log('File size:', stats.size, 'bytes');
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        
        if (response.data.success) {
            console.log('Upload successful:', response.data.data.url);
            return response.data.data.url;
        } else {
            throw new Error('ImgBB API upload failed');
        }
        
    } catch (e) {
        console.error('Image upload error:', e);
        throw new Error(`Image upload failed: ${e.message}`);
    }
}

module.exports={imageUpload,imageUploadimgbb}