const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const s = new mongoose.Schema({
  name:      { type:String, required:true, trim:true },
  email:     { type:String, required:true, unique:true, lowercase:true },
  password:  { type:String, required:true, minlength:6 },
  emailNotifications: { type:Boolean, default:true },
  reminderTime:       { type:String, default:"09:00" },
  gender:             { type:String, enum: ["Male", "Female", "Other", "Prefer not to say"], default: "Prefer not to say" },
  // Parental / guardian contacts (email only) — used for crisis alerts
  parentalContacts: [
    {
      email: { type: String, lowercase: true, trim: true }
    }
  ],
  // Other contacts (brother, best friend, relative, etc.) — optional
  otherContacts: [
    {
      name:     { type: String, trim: true },
      email:    { type: String, lowercase: true, trim: true },
      relation: { type: String, trim: true }   // e.g. "Brother", "Best Friend"
    }
  ],
  createdAt: { type:Date, default:Date.now },
});
s.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); next();
});
s.methods.comparePassword = function(pw) { return bcrypt.compare(pw, this.password); };
module.exports = mongoose.model("User", s);
