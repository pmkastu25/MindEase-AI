const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth",    require("./routes/auth"));
app.use("/api/journal", require("./routes/journal"));
app.use("/api/chat",    require("./routes/chat"));
app.use("/api/mood",    require("./routes/mood"));
app.use("/api/therapists", require("./routes/therapists"));
app.get("/api/health",  (_, res) => res.json({ status:"ok" }));

const { startDailyEngagementCron } = require("./cron/dailyEngagement");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mindease")
  .then(() => { 
    console.log("✅ MongoDB connected");
    const port = process.env.PORT || 5001;
    app.listen(port, () => {
      console.log("🚀 Server on port " + port);
      startDailyEngagementCron();
    });
  }).catch(err => console.error("❌ DB error:", err));
