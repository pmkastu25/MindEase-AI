const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
const path      = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const clientOrigin = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
app.use(cors({ origin: clientOrigin, credentials: true }));
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
    console.log("MongoDB connected");
    const port = process.env.PORT || 5001;
    app.listen(port, () => {
      console.log("Server on port " + port);
      startDailyEngagementCron();
    });
  }).catch(err => console.error("DB error:", err));
