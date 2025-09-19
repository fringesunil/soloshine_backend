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

    orderno: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Due', 'Delay', 'Partial Delivery'],
        default: 'Pending'
    },

    orderpriority: {
        type: String,
        enum: ["Regular", "Urgent"],
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
                enum: ["Red", "Blue", "Green", "Black", "White", "Same as image", ""],
                default: ""
            },
            rhodium: {
                type: String,
                enum: ["Setting Rhodium", "Ganga Jamuna", "No Rhodium", "Same as image", ""],
                default: ""
            },
            dull: {
                type: String,
                enum: ["Dull", "No Dull", "Same as image", ""],
                default: ""
            },
            weight: {
                type: Number,
                required: true,
            },
            purity: {
                type: String,
                required: true,
                enum: ['18K Yellow gold', '18K Rose gold', '18K White gold', 'Other', '22k']
            },
            quantity: {
                type: Number,
                required: true,
            },
            deliverycount: {
                type: Number,

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