const router  = require("express").Router();
const auth    = require("../middleware/auth");
const Journal = require("../models/Journal");
const User    = require("../models/User");
const { analyze } = require("../services/sentiment");
const { sendCrisisAlertEmail } = require("../services/emailService");

router.get("/", auth, async (req,res) => {
  try {
    const limit = parseInt(req.query.limit)||20;
    const entries = await Journal.find({ user:req.user._id }).sort({ createdAt:-1 }).limit(limit);
    res.json({ entries });
  } catch(e) { res.status(500).json({ message:e.message }); }
});

router.post("/", auth, async (req,res) => {
  try {
    const { text } = req.body;
    if (!text||text.trim().length<10) return res.status(400).json({ message:"Please enter at least 10 characters" });
    const analysis = await analyze(text);

    // Ignore greeting messages like Hello, etc.
    const isGreet = /^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|wassup|yo|hii|heyy)(?:\s|[.!?]|$)/i.test(text.trim()) || analysis.mood === "greet";
    if (isGreet) {
      return res.status(200).json({
        entry: null,
        analysis,
        is_greet: true,
        is_crisis: false,
        crisis_label: null,
        crisis_email_sent: false
      });
    }

    const entry = await Journal.create({
      user: req.user._id,
      text: text.trim(),
      mood: analysis.mood,
      mental_state: analysis.mental_state || "Normal",
      score: Math.max(-1, Math.min(1, analysis.score || 0)),
      emotions: analysis.emotions || [],
      suggestion: analysis.suggestion
    });

    // ── Crisis email trigger from journal entries
    let crisisEmailSent = false;
    const CRISIS_MOOD_LIST = ["suicidal","suicide","depression","depressed","self-harm","hopeless","crisis"];
    const isCrisis = analysis.is_crisis || CRISIS_MOOD_LIST.some(m => (analysis.mood || "").toLowerCase().includes(m));
    if (isCrisis) {
      try {
        const fullUser = await User.findById(req.user._id).select("parentalContacts otherContacts name gender");
        if (fullUser) {
          if (fullUser.parentalContacts?.length || fullUser.otherContacts?.length) {
            sendCrisisAlertEmail(fullUser.parentalContacts, fullUser.otherContacts, fullUser.name, text.trim(), fullUser.gender)
              .then(sent => { if (sent) console.log("📧 Crisis email dispatched from journal."); })
              .catch(err => console.error("Crisis email dispatch from journal error:", err));
            crisisEmailSent = true;
          } else {
            console.log(`⚠️ Crisis alert triggered from journal for ${fullUser.name}, but no emergency contacts are registered in their profile.`);
          }
        }
      } catch (err) {
        console.error("Crisis email lookup from journal error:", err.message);
      }
    }

    res.status(201).json({
      entry,
      analysis,
      // Top-level crisis fields for easy frontend destructuring
      is_crisis: isCrisis,
      crisis_label: analysis.crisis_label || null,
      crisis_email_sent: crisisEmailSent
    });
  } catch(e) { res.status(500).json({ message:e.message }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ message: "Please enter at least 10 characters" });
    }

    const entry = await Journal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const analysis = await analyze(text);

    // Ignore greeting messages like Hello, etc.
    const isGreet = /^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|wassup|yo|hii|heyy)(?:\s|[.!?]|$)/i.test(text.trim()) || analysis.mood === "greet";
    if (isGreet) {
      return res.status(400).json({ message: "Greeting messages cannot be saved as journal entries" });
    }
    
    entry.text = text.trim();
    entry.mood = analysis.mood;
    entry.mental_state = analysis.mental_state || "Normal";
    entry.score = Math.max(-1, Math.min(1, analysis.score || 0));
    entry.emotions = analysis.emotions || [];
    entry.suggestion = analysis.suggestion;

    await entry.save();

    // ── Crisis email trigger from journal update
    let crisisEmailSent = false;
    const CRISIS_MOOD_LIST = ["suicidal","suicide","depression","depressed","self-harm","hopeless","crisis"];
    const isCrisis = analysis.is_crisis || CRISIS_MOOD_LIST.some(m => (analysis.mood || "").toLowerCase().includes(m));
    if (isCrisis) {
      try {
        const fullUser = await User.findById(req.user._id).select("parentalContacts otherContacts name gender");
        if (fullUser) {
          if (fullUser.parentalContacts?.length || fullUser.otherContacts?.length) {
            sendCrisisAlertEmail(fullUser.parentalContacts, fullUser.otherContacts, fullUser.name, text.trim(), fullUser.gender)
              .then(sent => { if (sent) console.log("📧 Crisis email dispatched from updated journal."); })
              .catch(err => console.error("Crisis email dispatch from updated journal error:", err));
            crisisEmailSent = true;
          } else {
            console.log(`⚠️ Crisis alert triggered from updated journal for ${fullUser.name}, but no emergency contacts are registered in their profile.`);
          }
        }
      } catch (err) {
        console.error("Crisis email lookup from updated journal error:", err.message);
      }
    }

    res.json({
      entry,
      analysis,
      is_crisis: isCrisis,
      crisis_label: analysis.crisis_label || null,
      crisis_email_sent: crisisEmailSent
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.delete("/:id", auth, async (req,res) => {
  try {
    const entry = await Journal.findOneAndDelete({ _id:req.params.id, user:req.user._id });
    if (!entry) return res.status(404).json({ message:"Entry not found" });
    res.json({ message:"Entry deleted" });
  } catch(e) { res.status(500).json({ message:e.message }); }
});

module.exports = router;
