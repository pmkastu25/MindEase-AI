const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const emailService = require("../services/emailService");
const auth = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "mindease_secret_2024";
const sign = (id) => jwt.sign({ id }, SECRET, { expiresIn: "30d" });

// Helper to serialize user for responses
const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  emailNotifications: user.emailNotifications,
  reminderTime: user.reminderTime,
  gender: user.gender || "Prefer not to say",
  parentalContacts: user.parentalContacts || [],
  otherContacts: user.otherContacts || [],
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, gender, parentalContacts, otherContacts, reminderTime } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Account already exists" });

    if (!parentalContacts || !Array.isArray(parentalContacts) || parentalContacts.length === 0 || !parentalContacts.some(c => c.email && c.email.trim())) {
      return res.status(400).json({ message: "At least one Parent/Guardian emergency email is required" });
    }

    const user = await User.create({
      name, email, password,
      gender: gender || "Prefer not to say",
      parentalContacts: parentalContacts || [],
      otherContacts: otherContacts || [],
      reminderTime: reminderTime || "09:00",
    });

    // Send welcome email asynchronously without blocking the response
    emailService.sendWelcomeEmail(user.email, user.name);

    res.status(201).json({ token: sign(user._id), user: serializeUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: sign(user._id), user: serializeUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put("/preferences", auth, async (req, res) => {
  try {
    const { name, emailNotifications, reminderTime, gender, parentalContacts, otherContacts } = req.body;
    if (name !== undefined) req.user.name = name;
    if (emailNotifications !== undefined) req.user.emailNotifications = emailNotifications;
    if (reminderTime !== undefined) req.user.reminderTime = reminderTime;
    if (gender !== undefined) req.user.gender = gender;
    if (parentalContacts !== undefined) {
      if (!Array.isArray(parentalContacts) || parentalContacts.length === 0 || !parentalContacts.some(c => c.email && c.email.trim())) {
        return res.status(400).json({ message: "At least one Parent/Guardian emergency email is required" });
      }
      req.user.parentalContacts = parentalContacts;
    }
    if (otherContacts !== undefined) req.user.otherContacts = otherContacts;

    await req.user.save();
    res.json({
      message: "Preferences updated successfully",
      user: serializeUser(req.user),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
