const admin = require('firebase-admin');

let appInitialized = false;

function initializeFirebaseAdmin() {
    if (appInitialized) return admin;

    const {
        FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY
    } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin environment variables');
    }

    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey
        })
    });

    appInitialized = true;
    return admin;
}

module.exports = initializeFirebaseAdmin;


