const initializeFirebaseAdmin = require('../config/firebaseAdmin');
const User = require('../model/userModel');

async function sendNotificationToRoles(roles, title, body, data = {}) {
    const admin = initializeFirebaseAdmin();

    const users = await User.find({ role: { $in: roles }, fcmtoken: { $ne: '' } }).select('fcmtoken').lean();
    const tokens = users.map(u => u.fcmtoken).filter(Boolean);

    if (tokens.length === 0) return { success: true, sent: 0 };

    const message = {
        notification: { title, body },
        data: Object.entries(data).reduce((acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
        }, {}),
        tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return { success: true, sent: response.successCount, failure: response.failureCount };
}

module.exports = {
    sendNotificationToRoles,
};


