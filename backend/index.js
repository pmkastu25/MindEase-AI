const express = require("express")
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


