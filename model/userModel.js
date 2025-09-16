const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'customer','employee'],
        default: 'customer'
    },
    address: {
        type: String,
    },
    fcmtoken: {
        type: String,
        default:""
    },
}, {
    timestamps: true
});



const User = mongoose.model('User', userSchema);

module.exports = User; 