const express = require("express")
const mongoose = require("mongoose")

const app = express()

app.get("/dashboard", (req, res) => {
    res.send("This is the Dashboard")
})

app.get("/", (req, res) => {
    res.send("Hello, this is homee")
})

app.listen(8080, () => {
    console.log("listening on PORT 8080");
})

const start = async()=>{
    const connectdb = await mongoose.connect(`mongodb+srv://pmkastu25_db_user:BLqjDjvdQZu7UlKK@cluster0.cscladd.mongodb.net/?appName=Cluster0`)

    console.log("Database Connected")
}

start()