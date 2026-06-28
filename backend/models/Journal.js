// const mongoose = require("mongoose");
// const s = new mongoose.Schema({
//   user:      { type:mongoose.Schema.Types.ObjectId, ref:"User", required:true },
//   text:      { type:String, required:true, minlength:5 },
//   mood:      { type:String, default:"neutral" },
//   score:     { type:Number, default:0.5, min:0, max:1 },
//   emotions:  [String],
//   suggestion:String,
//   createdAt: { type:Date, default:Date.now },
// });
// module.exports = mongoose.model("Journal", s);

const mongoose = require("mongoose");

const s = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: {
    type: String,
    required: true,
    minlength: 5
  },

  mood: {
    type: String,
    default: "neutral"
  },

  mental_state: {
    type: String,
    default: "Normal"
  },

  score: {
    type: Number,
    default: 0,
    min: -1,
    max: 1
  },

  emotions: [String],

  suggestion: String

}, {
  timestamps: true
});

module.exports = mongoose.model("Journal", s);