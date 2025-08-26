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
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    remark: String,
    ornamentdetails: [
        {
            name: {
                type: mongoose.ObjectId,
                ref: "Category",
                required: true
            },
            // material: {
            //     type: String,
            //     enum: ['Gold', 'Rose Gold', 'White Gold', 'Platinum'],
            //     required: true,
            // },
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