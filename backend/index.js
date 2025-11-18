const express = require("express")
const mongoose = require("mongoose")
const axios = require('axios'); // You'll need to install: npm install axios
const cors = require('cors'); 

const app = express()

app.use(cors()); // Allow requests from your React frontend
app.use(express.json()); // Allow parsing of JSON bodies

// Define the URL for your Python ML service
const ML_SERVICE_URL = 'http://127.0.0.1:5000/analyze-mood';

app.post("/api/analyze-mood", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        console.log(`Forwarding text to ML service: ${text}`);
        
        // 1. Call the Python/Flask API
        // This is the key integration step
        const mlResponse = await axios.post(ML_SERVICE_URL, {
            text: text
        });

        // 2. Forward the response from the ML service
        // back to your React frontend.
        res.json(mlResponse.data);

    } catch (error) {
        console.error("Error calling ML service:", error.message);
        res.status(500).json({ error: 'Error processing mood analysis' });
    }
})

// app.get("/dashboard", (req, res) => {
//     res.send("This is the Dashboard")
// })

// app.get("/", (req, res) => {
//     res.send("Hello, this is homee")
// })

app.listen(8080, () => {
    console.log("listening on PORT 8080");
})

const start = async()=>{
    const connectdb = await mongoose.connect(`mongodb+srv://pmkastu25_db_user:BLqjDjvdQZu7UlKK@cluster0.cscladd.mongodb.net/?appName=Cluster0`)

    console.log("Database Connected")
}

start()