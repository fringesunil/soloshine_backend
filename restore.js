const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("./model/orderModel");

const rawData = [
    {
        "_id": "697d8dafcfeb4b083f98402e",
        "userid": {
            "_id": "68ca4fd17f881a69aaf5522e",
            "name": "Jitu bhai",
            "email": "jitumali7722@gmail.com",
            "phone": "97856 55909",
            "role": "employee",
            "address": "Mumbai",
            "fcmtoken": "cjy4Q3rrQDaURc4UfxX3dJ:APA91bE4rSvCIy48rBomiVD1ESYydwPYVkfligJrIUe5cSH8zHuhjU0lsEdM18eYVQuJGDzuQj8h6dz8vheVq4ZjdLrKBEe0hkJzWd1LDjoDe5rCD2BEEls",
            "createdAt": "2025-09-17T06:06:09.721Z",
            "updatedAt": "2026-02-24T03:11:34.451Z",
            "__v": 0
        },
        "orderdate": "2026-01-31T10:34:42.887Z",
        "ordertype": "Bulk",
        "orderno": "2365 18 k yellwo md",
        "status": "Completed",
        "orderpriority": "Regular",
        "ornamentdetails": [
            {
                "name": {
                    "_id": "68c33ba89968c260814a76f5",
                    "categoryname": "Ring",
                    "size": [
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                        "13",
                        "14",
                        "15",
                        "16",
                        "17",
                        "18",
                        "Others"
                    ],
                    "unit": [
                        "Oscar",
                        "Pn Budh"
                    ],
                    "__v": 0
                },
                "size": "",
                "unit": "",
                "colorstone": "",
                "rhodium": "",
                "dull": "",
                "weight": 0,
                "purity": "18K Yellow gold",
                "quantity": 17,
                "deliverycount": 17,
                "partialdelivery": [
                    {
                        "deliverydate": "2026-02-09T19:23:57.893Z",
                        "qty": 17,
                        "_id": "6989e7ce879f4dcb30b3d848"
                    }
                ],
                "image": [
                    "https://ugkbbqxkinnqlsikltya.supabase.co/storage/v1/object/public/pdfs/orders/20260131_050545_923_2365_18_YELLWO_MD.PDF"
                ],
                "_id": "6989e7e0879f4dcb30b3dae0"
            }
        ],
        "partyname": {
            "_id": "6931709e7fbb18314615ade1",
            "name": "MD"
        },
        "updatedby": {
            "_id": "693941aa958ee2352c09a7a9",
            "name": "Sales"
        },
        "createdAt": "2026-01-31T05:05:51.344Z",
        "updatedAt": "2026-02-09T13:57:52.571Z",
        "__v": 0
    },
    {
        "_id": "6985ae2c879f4dcb30afbf2e",
        "userid": {
            "_id": "68ca4fd17f881a69aaf5522e",
            "name": "Jitu bhai",
            "email": "jitumali7722@gmail.com",
            "phone": "97856 55909",
            "role": "employee",
            "address": "Mumbai",
            "fcmtoken": "cjy4Q3rrQDaURc4UfxX3dJ:APA91bE4rSvCIy48rBomiVD1ESYydwPYVkfligJrIUe5cSH8zHuhjU0lsEdM18eYVQuJGDzuQj8h6dz8vheVq4ZjdLrKBEe0hkJzWd1LDjoDe5rCD2BEEls",
            "createdAt": "2025-09-17T06:06:09.721Z",
            "updatedAt": "2026-02-24T03:11:34.451Z",
            "__v": 0
        },
        "orderdate": "2026-02-06T14:31:20.053Z",
        "ordertype": "Bulk",
        "orderno": "2410 WhatsApp order 18 k rose",
        "status": "Completed",
        "orderpriority": "Urgent",
        "ornamentdetails": [
            {
                "name": {
                    "_id": "68c8253711544136c09b4f4f",
                    "categoryname": "Loose Bracelet",
                    "size": [
                        "6",
                        "6.5",
                        "7",
                        "7.5",
                        "Regular",
                        "Others"
                    ],
                    "unit": [
                        "Inches"
                    ],
                    "__v": 0
                },
                "size": "",
                "unit": "",
                "colorstone": "",
                "rhodium": "",
                "dull": "",
                "weight": 0,
                "purity": "18K Rose gold",
                "quantity": 6,
                "deliverycount": 6,
                "partialdelivery": [
                    {
                        "deliverydate": "2026-02-13T00:00:00.000Z",
                        "qty": 6,
                        "_id": "698ff5b14c5d37e4331b0166"
                    }
                ],
                "remarks": "18ct rose gold\nEach design 2 pc\nAs per pdf instructions ",
                "image": [
                    "https://ugkbbqxkinnqlsikltya.supabase.co/storage/v1/object/public/pdfs/orders/20260206_090234_475_MilanGold_Pvt_Ltd_Rajkot176830567554762.pdf"
                ],
                "_id": "698ff5c54c5d37e4331b0445"
            }
        ],
        "partyname": {
            "_id": "69649267a8e510d392c991a9",
            "name": "MM"
        },
        "updatedby": {
            "_id": "693941aa958ee2352c09a7a9",
            "name": "Sales"
        },
        "createdAt": "2026-02-06T09:02:36.516Z",
        "updatedAt": "2026-02-14T04:10:45.858Z",
        "__v": 0
    },
    {
        "_id": "69901c0e4c5d37e4331ba822",
        "userid": {
            "_id": "68ca4fd17f881a69aaf5522e",
            "name": "Jitu bhai",
            "email": "jitumali7722@gmail.com",
            "phone": "97856 55909",
            "role": "employee",
            "address": "Mumbai",
            "fcmtoken": "cjy4Q3rrQDaURc4UfxX3dJ:APA91bE4rSvCIy48rBomiVD1ESYydwPYVkfligJrIUe5cSH8zHuhjU0lsEdM18eYVQuJGDzuQj8h6dz8vheVq4ZjdLrKBEe0hkJzWd1LDjoDe5rCD2BEEls",
            "createdAt": "2025-09-17T06:06:09.721Z",
            "updatedAt": "2026-02-24T03:11:34.451Z",
            "__v": 0
        },
        "orderdate": "2026-02-14T12:21:43.874Z",
        "ordertype": "Bulk",
        "orderno": "2407 MIX SS 18K ROSE",
        "status": "Completed",
        "orderpriority": "Urgent",
        "ornamentdetails": [
            {
                "name": {
                    "_id": "68c26d9af41c2be4ba0fb860",
                    "categoryname": "Bracelet (Kada)",
                    "size": [
                        "2",
                        "2.1",
                        "2.2",
                        "2.3",
                        "2.4",
                        "2.5",
                        "2.6",
                        "2.7",
                        "Other"
                    ],
                    "unit": [
                        "Aani"
                    ],
                    "__v": 0
                },
                "size": "",
                "unit": "",
                "colorstone": "",
                "rhodium": "",
                "dull": "",
                "weight": 0,
                "purity": "18K Rose gold",
                "quantity": 17,
                "deliverycount": 17,
                "partialdelivery": [
                    {
                        "deliverydate": "2026-02-18T18:59:15.864Z",
                        "qty": 13,
                        "_id": "6995bf714c5d37e43322597d"
                    },
                    {
                        "deliverydate": "2026-02-17T00:00:00.000Z",
                        "qty": 4,
                        "_id": "6995c0894c5d37e433225fa6"
                    }
                ],
                "image": [
                    "https://ugkbbqxkinnqlsikltya.supabase.co/storage/v1/object/public/pdfs/orders/20260214_065402_729_2407_SSS_(2).pdf"
                ],
                "_id": "6995c0a34c5d37e4332262e5"
            }
        ],
        "partyname": {
            "_id": "693150447fbb18314615ad47",
            "name": "SS"
        },
        "updatedby": {
            "_id": "693941aa958ee2352c09a7a9",
            "name": "Sales"
        },
        "createdAt": "2026-02-14T06:54:06.540Z",
        "updatedAt": "2026-02-18T13:37:39.549Z",
        "__v": 0
    }
];

const processedData = rawData.map(order => ({
    ...order,
    userid: order.userid?._id || order.userid,
    partyname: order.partyname?._id || order.partyname,
    updatedby: order.updatedby?._id || order.updatedby,
    ornamentdetails: order.ornamentdetails.map(item => ({
        ...item,
        name: item.name?._id || item.name
    }))
}));

const restore = async () => {
    try {
        await mongoose.connect(process.env.DATA_BASE_URL);
        console.log("MongoDB Connected");

        const result = await Order.insertMany(processedData);
        console.log(`Inserted ${result.length} orders into MongoDB.`);

        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log("Looks like some of these are already in the DB according to unique constraints:", error.message);
        } else {
            console.error("Error during restore:", error);
        }
        process.exit(1);
    }
};

restore();
