require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const app = express()
const port = 3000

app.use(express.json())
app.use("/user",userRoutes)
app.use("/auth",authRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




main().then(()=>console.log("Connected to db")).catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.DATA_BASE_URL);
}