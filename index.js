require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const orderRoutes = require('./routes/orderRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const app = express()
const port = 3000

app.use(cors({
  credentials: true,
    origin: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use("/user",userRoutes)
app.use("/auth",authRoutes)
app.use("/order",orderRoutes)
app.use("/category",categoryRoutes)
app.use("/dashboard",dashboardRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




main().then(()=>console.log("Connected to db")).catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.DATA_BASE_URL);
}