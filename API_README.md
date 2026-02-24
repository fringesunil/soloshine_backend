# Storage & Cleanup API Documentation

This guide describes how to use the newly added APIs and scripts to manage your app's storage limits, clean up old orders, query your storage sizes, and restore accidentally deleted records.

---

## 1. Storage Stats API

Use this endpoint to view your current storage consumption size for both MongoDB and Supabase.
**Endpoint**: `GET /dashboard/storage`
**Headers Required**: Authorization token (`authenticateToken`), requires Admin access (`checkAdmin`)

### Response Example:
```json
{
  "success": true,
  "data": {
    "mongodb": {
      "database": "soloshine",
      "collections": 6,
      "views": 0,
      "objects": 402,
      "avgObjSize": 381,
      "dataSize": 153328,
      "storageSize": 49152,
      "totalFreeStorageSize": 0,
      "indexes": 6,
      "indexSize": 143360,
      "totalSize": 192512,
      "totalSizeMb": "0.18 MB"
    },
    "supabase": {
      "bucket": "pdfs",
      "estimatedTotalSizeInBytes": 10543200,
      "estimatedTotalSizeMb": "10.05 MB"
    }
  },
  "message": "Storage statistics retrieved successfully"
}
```

*Note: If your Supabase bucket is over quota limit, it restricts the API and the response to Supabase size might be `0 MB` until you manually clear it.*

---

## 2. Orders Storage Cleanup API

This endpoint cleans up the database from Orders marked as `Delivered` or `Cancelled` and automatically deletes their related images from Supabase to free up space limit.
**Endpoint**: `DELETE /order/cleanup/completed`
**Headers Required**: Authorization token (`authenticateToken`), requires Admin access (`checkAdmin`)

### Response Example:
```json
{
  "success": true,
  "data": {
    "deletedOrdersCount": 460,
    "deletedImagesCount": 656
  },
  "message": "Cancelled and Delivered orders and their associated images deleted successfully"
}
```

---

## 3. Storage Cleanup CLI Script
If you want to run the cleanup script manually directly on the backend server, rather than via the API, you can execute the `cleanup.js` file.

**Command:**
```bash
node cleanup.js
```

**What it does:**
- Authenticates directly with your database using the `.env` configuration.
- Queries all orders strictly with statuses `"Delivered"` or `"Cancelled"`.
- Loops through those orders, grabs the Supabase file keys, and deletes the actual images from your `pdfs` bucket.
- Safely removes the MongoDB records related to these orders entirely.
- Exits on success.

---

## 4. Record Restore CLI Script
If you accidentally execute an action where data is lost (like during today's `Completed` incident), you can use the `restore.js` tool to write specific raw JSON output back into the system.

**How to use:**
1. Open up `restore.js`.
2. Locate the Array `const rawData = [ ... ]`.
3. Paste the exact Raw JSON objects of the orders inside that array.
4. Open the terminal and execute: `node restore.js`

**Command:**
```bash
node restore.js
```

**What it does:**
- Mints the proper MongoDB Object ID formats.
- Avoids duplicates handling the `unique` validation block.
- Confirms successful insertion.
