const mongoose = require("mongoose");
const s = new mongoose.Schema({
  user:      { type:mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  role:      { type:String, enum:["user","bot"], required:true },
  text:      { type:String, required:true },
  mood:      String, score: Number,
  createdAt: { type:Date, default:Date.now },
});
module.exports = mongoose.model("Chat", s);
