const axios = require('axios');

// Get the token from command line arguments
const token = process.argv[2];

if (!token) {
    console.error('Please provide your auth token as an argument.');
    console.error('Usage: node test_update_order.js <YOUR_AUTH_TOKEN>');
    process.exit(1);
}

const orderId = '696dcc2ca8e510d392d08ee0'; // The ID from your logs
const url = `http://localhost:3000/order/${orderId}`;

const payload = {
    orderno: "test_update_123", // The new order number to test
    ordertype: "Bulk"
    // Add other fields if necessary
};

console.log('Testing PATCH request to update orderno...');
console.log('URL:', url);
console.log('Payload:', payload);

async function testUpdate() {
    try {
        const response = await axios.patch(url, payload, {
            headers: {
                'Authorization': `Bearer ${token}`, // Assuming Bearer token format
                'Content-Type': 'application/json'
            }
        });

        console.log('\n--- SUCCESS ---');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('\n--- ERROR ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testUpdate();
