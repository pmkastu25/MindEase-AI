const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const Chat = require("../models/Chat");
const User = require("../models/User");
const { analyze, getSuggestion } = require("../services/sentiment");
const { sendCrisisAlertEmail } = require("../services/emailService");
const geminiModel = require("../services/gemini");
const ollamaService = require("../services/ollama");
const CBT = {
  greet: "Hello! I'm MindEase, your AI mental health companion. 🌿 How are you feeling today?",
  anxious: "I hear you're feeling anxious 💙\n\nLet's try grounding:\n• 5 things you can SEE\n• 4 you can TOUCH\n• 3 you can HEAR\n• 2 you can SMELL\n• 1 you can TASTE\n\nWhat's been triggering this feeling?",
  sad: "I'm really sorry you're going through this 🤍\n\nYour feelings are completely valid. In CBT, difficult emotions are temporary — they rise and fall like waves.\n\nCan you identify one small thing that usually brings a tiny bit of comfort?",
  angry: "I hear that you're frustrated 🔥\n\nAnger signals that something important has been threatened. Take 3 deep breaths — inhale 4 counts, exhale 6.\n\nWhat underlying need feels unmet right now?",
  happy: "That's wonderful to hear! 😄✨\n\nPositive emotions are worth savouring. What's contributing to your happiness today? Identifying it helps you create more of it.",
  calm: "It sounds like you're in a grounded place 🌿\n\nThis is a wonderful time for reflection. Is there something meaningful you'd like to focus on?",
  default: "Thank you for sharing that 💚\n\nI'm here to listen and support you. Tell me more about what's on your mind — there's no judgment here.",
};
router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message cannot be empty" });
    await Chat.create({ user: req.user._id, role: "user", text: message });
    const analysis = await analyze(message);

    let reply = "";
    let methodUsed = "";
    const apiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "enter_key" ? process.env.GEMINI_API_KEY : null;

    const lower = message.toLowerCase().trim();

    const localGreetings = [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good evening",
      "hii",
      "heyy"
    ];

    const localThanks = [
      "thanks",
      "thank you",
      "thank you so much",
      "appreciate it"
    ];

    // 1. Hard local bypass for greetings and thank-yous
    if (localGreetings.includes(lower) || analysis.mood === "greet") {
      reply = CBT.greet;
      methodUsed = "local_greet";
    } else if (localThanks.includes(lower)) {
      reply = "You're always welcome! 💚 I'm always here to support you.";
      methodUsed = "local_thanks";
    }

    // 2. Try Local Ollama LLM first
    if (!reply) {
      try {
        const prompt = `You are MindEase AI, a compassionate CBT-based mental health companion.
Respond with empathy, support, and gentle cognitive behavioral guidance.

User: ${message}
Assistant:`;
        console.log(`🤖 Invoking local Ollama model '${ollamaService.modelName}'...`);
        const botReply = await ollamaService.generateContent(prompt);
        if (botReply) {
          reply = botReply;
          methodUsed = "ollama";
        }
      } catch (err) {
        console.warn("⚠️ Ollama failed. Falling back...", err.message);
      }
    }

    // 3. Try Gemini as secondary cloud fallback
    if (!reply && apiKey) {
      try {
        const prompt = `You are MindEase AI, a compassionate CBT-based mental health companion.
Respond with empathy, support, and gentle cognitive behavioral guidance.

User: ${message}
Assistant:`;
        console.log(`☁️ Invoking Gemini fallback model...`);
        const result = await geminiModel.generateContentWithRetry({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7
          }
        });
        const response = await result.response;
        reply = response.text().trim();
        methodUsed = "gemini";
      } catch (err) {
        console.warn("⚠️ Gemini API failed. Falling back...", err.message);
      }
    }

    // 2. Try Rasa proxy as secondary fallback if Gemini failed or is not configured
    if (!reply) {
      console.log(`Rasa proxy triggered. RASA_URL: '${process.env.RASA_URL}', RASA_FALLBACK_URL: '${process.env.RASA_FALLBACK_URL}'`);
      try {
        const defaultRasaUrl = process.env.RASA_URL || "http://localhost:5006";
        const fallbackRasaUrl = process.env.RASA_FALLBACK_URL || "http://localhost:5005";
        const rasaUrls = [defaultRasaUrl, fallbackRasaUrl];
        let botMessages = [];

        for (const rasaUrl of rasaUrls) {
          try {
            const r = await axios.post(
              `${rasaUrl}/webhooks/rest/webhook`,
              { sender: req.user._id.toString(), message },
              { timeout: 15000 }
            );

            botMessages = Array.isArray(r.data) ? r.data : [];
            if (botMessages.length > 0) {
              reply = botMessages.map((item) => item.text).filter(Boolean).join("\n");
              methodUsed = "rasa";
              break;
            }
          } catch (e) {
            console.log(`❌ Rasa request failed at ${rasaUrl}: code=${e.code}, message=${e.message}`);
          }
        }
      } catch (e) {
        console.error("Rasa chat fallback error:", e.message);
      }
    }

    // 3. Try Local CBT Templates as tertiary fallback if both above failed
    if (!reply) {
      reply = CBT[analysis.mood] || CBT.default;
      methodUsed = "cbt_local";
    }

    console.log(`🤖 Chatbot processed using logic: ${methodUsed}`);

    // ── Crisis email: fire-and-forget to all saved contacts
    let crisisEmailSent = false;
    const CRISIS_MOOD_LIST = ["suicidal", "suicide", "depression", "depressed", "self-harm", "hopeless", "crisis"];
    const isCrisis = analysis.is_crisis || CRISIS_MOOD_LIST.some(m => (analysis.mood || "").toLowerCase().includes(m));
    if (isCrisis) {
      try {
        const fullUser = await User.findById(req.user._id).select("parentalContacts otherContacts name gender");
        if (fullUser) {
          if (fullUser.parentalContacts?.length || fullUser.otherContacts?.length) {
            sendCrisisAlertEmail(fullUser.parentalContacts, fullUser.otherContacts, fullUser.name, message, fullUser.gender)
              .then(sent => { if (sent) console.log("📧 Crisis email dispatched."); })
              .catch(err => console.error("Crisis email dispatch error:", err));
            crisisEmailSent = true;
          } else {
            console.log(`⚠️ Crisis alert triggered for ${fullUser.name}, but no emergency contacts are registered in their profile.`);
          }
        }
      } catch (err) {
        console.error("Crisis email lookup error:", err.message);
      }
    }

    await Chat.create({ user: req.user._id, role: "bot", text: reply, mood: analysis.mood, score: analysis.score });
    res.json({ reply, mood: analysis.mood, score: analysis.score, suggestion: getSuggestion(analysis.mood), crisis_email_sent: crisisEmailSent });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
router.get("/history", auth, async (req, res) => {
  try {
    const messages = await Chat.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ messages: messages.reverse() });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
module.exports = router;
