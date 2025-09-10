const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userid: {
        type: mongoose.ObjectId,
        ref: "User"
    },
    orderdate: Date,
    ordertype: {
        type: String,
        enum: ["Single", "Bulk"],
        default: "Single"
    },
    
    orderno:{
        type:String,
        unique:true
    },
    updatedby:{
        type:mongoose.ObjectId,
        ref:"User"
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled','Due','Delay'],
        default: 'Pending'
    },
    remark: String,
    orderpriority: {
        type: String,
        enum: ["Regular","Urgent"],
        default: 'Regular'  
    },
    ornamentdetails: [
        {
            name: {
                type: mongoose.ObjectId,
                ref: "Category",
                required: true

            },
            size: {
                type: String,
                required: true,
            },
            unit: {
                type: String,
                required: true,
            },
            colorstone: {
                type: String,
                enum: ["Red", "Blue", "Green", "Black", "White","Same as image"],
                default: "Same as image"
            },
            rhodium : {
                type: String,
                enum: ["Setting Rhodium", "Ganga Jamuna", "No Rhodium", "Same as image"],
                default: "Same as image"
            },
            dull : {
                type: String,
                enum: ["Dull", "No Dull", "Same as image"],
                default: "Same as image"
            },
            weight: {
                type: Number,
                required: true,
            },
            purity: {
                type: String,
                required: true,
                enum: ['18K Yellow gold', '18K Rose gold', '18K White gold', 'Other']
            },
            quantity: {
                type: Number,
                required: true,
            },
            remarks: {
                type: String,
            },
            image: [String]
        }
    ],
});



const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 