# Order App Backend API

## Overview
This is a Node.js/Express backend API for managing orders with support for multipart form data and file uploads.

## Features
- User authentication and management
- Order management with ornament details
- File upload support
- Multipart form data handling

## API Endpoints

### Orders

#### POST /order
Create a new order with multipart form data support.

**Form Data Fields:**
- `userid`: User ID (string)
- `orderdate`: Order date (string, will be converted to Date)
- `ordertype`: Order type - "Single" or "Bulk" (string)
- `status`: Order status - "Pending", "In Progress", "Completed", "Cancelled" (string)
- `ornamentDetails`: JSON string or array of ornament details
- `attachments`: Files (optional)

**ornamentDetails Format:**
```json
[
  {
    "name": "Gold Ring",
    "material": "Gold",
    "weight": 5.5,
    "purity": "18K",
    "quantity": 1
  }
]
```

**Example Postman Setup:**
1. Set request type to POST
2. Set URL to `http://localhost:3000/order`
3. In Body tab, select "form-data"
4. Add fields:
   - `userid`: `507f1f77bcf86cd799439011`
   - `ornamentDetails`: `[{"name":"Gold Ring","material":"Gold","weight":5.5,"purity":"18K","quantity":1}]`
   - `attachments`: Select file (optional)

#### PATCH /order/:orderid
Update an existing order.

#### GET /order
Get all orders with optional query parameters.

#### GET /order/:orderid
Get a specific order by ID.

#### DELETE /order/:orderid
Delete an order.

## File Upload
- Supported file types: Images only
- Maximum file size: 5MB
- Files are stored in the `uploads/` directory
- File information is stored in the order document

## Multipart Form Data Handling
The API automatically handles multipart form data and converts:
- String representations of arrays back to arrays
- File uploads to file metadata
- Ensures proper data types for all fields

## Error Handling
- File size validation
- File type validation
- JSON parsing for array fields
- Comprehensive error messages

## Running the Application
1. Install dependencies: `npm install`
2. Set up environment variables in `.env` file
3. Start the server: `npm start`
4. Server runs on port 3000

## Environment Variables
- `DATA_BASE_URL`: MongoDB connection string

