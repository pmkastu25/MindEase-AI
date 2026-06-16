const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const SECRET = process.env.JWT_SECRET || "mindease_secret_2024";
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ","");
    if (!token) return res.status(401).json({ message:"Not authenticated" });
    const decoded = jwt.verify(token, SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message:"User not found" });
    next();
  } catch { res.status(401).json({ message:"Invalid token" }); }
};
