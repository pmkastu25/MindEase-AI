import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import { useNotification } from "../context/NotificationContext";
import { useCrisis, isCrisisMood } from "../context/CrisisContext";
import "./ChatBot.css";

const QUICK_REPLIES = [
  "😰 I'm feeling anxious today",
  "😞 I'm having a hard time",
  "🧘 Guide me through breathing",
  "💭 Help me reframe a thought",
  "😊 I want to share good news",
];

const BOT_RESPONSES = {
  anxious: "I hear that you're feeling anxious 💙\n\nLet's try a quick grounding exercise right now:\n• Name 5 things you can SEE\n• 4 things you can TOUCH\n• 3 things you can HEAR\n• 2 things you can SMELL\n• 1 thing you can TASTE\n\nThis 5-4-3-2-1 technique gently brings you back to the present. Can you share what's been triggering the anxiety?",
  sad: "I'm really sorry you're going through this 🤍\n\nYour feelings are completely valid. In CBT, we recognise that difficult emotions are temporary — they rise and fall like waves.\n\nA gentle exercise: can you identify one small thing that usually brings even a tiny bit of comfort? It could be as simple as a warm drink or a favourite song.",
  hard: "That sounds really difficult, and I'm glad you reached out 🌸\n\nSometimes just naming what we're going through helps it feel a little less overwhelming. Would you like to talk through what's been happening? I'm here to listen without judgment.",
  breathing: "Let's do the 4-7-8 breathing technique together 🫁\n\n1. Exhale completely through your mouth\n2. Inhale quietly through your nose for **4 counts**\n3. Hold your breath for **7 counts**\n4. Exhale completely for **8 counts**\n\nRepeat this 3–4 times. This activates your parasympathetic nervous system — your body's natural calm switch. How are you feeling after trying it?",
  reframe: "Great choice — cognitive reframing is one of the most powerful CBT tools 🧠\n\n**Step 1:** Write down the negative thought (e.g. \"I always fail\")\n**Step 2:** Ask — what's the evidence FOR and AGAINST this thought?\n**Step 3:** Create a balanced alternative (e.g. \"Sometimes I struggle, but I also succeed\")\n\nWould you like to work through a specific thought together?",
  good: "That's wonderful to hear! 😄✨\n\nPositive emotions are worth savouring and expanding — this is called 'broaden-and-build' in positive psychology. When we're happy, we think more broadly and creatively.\n\nWhat's contributing to your happiness right now? Identifying it helps you create more of it.",
  default: "Thank you for sharing that with me 💚\n\nI want you to know that whatever you're going through, you don't have to face it alone. I'm here to support you with empathy and without judgment.\n\nCould you tell me a bit more about how you're feeling? Understanding your emotions is always the first step toward wellbeing.",
};

// Extended mood detection including crisis moods from ML (7 labels)
const getMoodFromText = (text) => {
  const l = text.toLowerCase();
  // Crisis moods first (highest priority)
  if (l.match(/suicid|kill myself|end my life|don't want to live|not worth living/)) return { mood:"suicidal", emoji:"💙", conf:92 };
  if (l.match(/depress|hopeless|worthless|empty inside|no point|numb|nothing matters/)) return { mood:"depression", emoji:"🌧️", conf:88 };
  if (l.match(/self.harm|hurt myself|cutting|self.destruct/)) return { mood:"self-harm", emoji:"💙", conf:90 };
  // Regular moods
  if (l.match(/anxi|stress|worry|nervous|panic|overwhelm/)) return { mood:"anxious", emoji:"😰", conf:84 };
  if (l.match(/sad|cry|lonely|hurt|hard time/)) return { mood:"sad", emoji:"😢", conf:79 };
  if (l.match(/breath|relax|calm|meditat/)) return { mood:"calm", emoji:"😌", conf:91 };
  if (l.match(/reframe|thought|think|cbt/)) return { mood:"reflective", emoji:"💭", conf:76 };
  if (l.match(/happy|great|good news|wonderful|excited/)) return { mood:"happy", emoji:"😊", conf:88 };
  if (l.match(/angry|furious|frustrated|mad/)) return { mood:"angry", emoji:"😤", conf:82 };
  return { mood:"calm", emoji:"😌", conf:74 };
};

const getBotReply = (text) => {
  const l = text.toLowerCase();
  if (l.match(/anxi|stress|worry|nervous|panic/)) return BOT_RESPONSES.anxious;
  if (l.match(/sad|depress|cry|lonely|hard time/)) return BOT_RESPONSES.sad;
  if (l.match(/breath|breathing|4-7-8/)) return BOT_RESPONSES.breathing;
  if (l.match(/reframe|thought|cbt/)) return BOT_RESPONSES.reframe;
  if (l.match(/happy|good news|wonderful|excited/)) return BOT_RESPONSES.good;
  return BOT_RESPONSES.default;
};

export default function ChatBot() {
  const { addNotification } = useNotification();
  const { triggerCrisis, setEmailSent } = useCrisis();
  const [messages, setMessages] = useState([
    {
      id: 1, role: "bot",
      text: "Hello! I'm MindEase, your personal wellbeing companion 🌿\n\nI'm here to listen without judgment, help you explore your feelings, and offer gentle, evidence-based support. How are you feeling right now?",
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
    },
    {
      id: 2, role: "bot",
      text: "You can talk to me about anything — stress, anxiety, what's on your mind, or just how your day is going. I'll always respond with care. 🌸",
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [detectedMood, setDetectedMood] = useState({ mood:"calm", emoji:"😌", conf:87 });
  const [msgCount, setMsgCount] = useState(2);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  // ── Crisis middleware: checks ML-predicted mood from API response OR local detection
  const checkAndTriggerCrisis = (mood, emailSent = false) => {
    if (isCrisisMood(mood)) {
      // Small delay so the bot reply appears first
      setTimeout(() => triggerCrisis(emailSent), 900);
      return true;
    }
    return false;
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");

    const now = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const userMsg = { id: Date.now(), role:"user", text:msg, time:now };
    setMessages(prev => [...prev, userMsg]);
    setMsgCount(c => c + 1);

    // Detect mood from user input (local + crisis check)
    const mood = getMoodFromText(msg);
    setDetectedMood(mood);

    // ── Crisis middleware check on detected mood
    const isCrisis = checkAndTriggerCrisis(mood.mood);

    setTyping(true);
    try {
      const res = await api.post("/chat", { message: msg });

      // ── Also check the mood returned by the ML model from the API
      if (res.mood && !isCrisis) {
        setDetectedMood(prev => ({ ...prev, mood: res.mood }));
        checkAndTriggerCrisis(res.mood, res.crisis_email_sent);
      } else if (res.crisis_email_sent) {
        setEmailSent(true);
      }

      const botMsg = {
        id: Date.now()+1,
        role:"bot",
        text: res.reply || getBotReply(msg),
        time: now
      };
      setMessages(prev => [...prev, botMsg]);
      setMsgCount(c => c + 1);
      addNotification(
        "Empathetic Companion Reply 💬",
        "MindEase has sent you a supportive response.",
        "chatbot"
      );
    } catch {
      await new Promise(r => setTimeout(r, 1800));
      const botMsg = { id: Date.now()+1, role:"bot", text: getBotReply(msg), time:now };
      setMessages(prev => [...prev, botMsg]);
      setMsgCount(c => c + 1);
      addNotification(
        "Empathetic Companion Reply 💬",
        "MindEase has sent you a supportive response.",
        "chatbot"
      );
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Helper to parse bold (**bold**) and italics (*italics*)
  const parseFormatting = (line) => {
    const boldParts = line.split(/\*\*(.*?)\*\*/);
    return boldParts.map((part, j) => {
      if (j % 2 === 1) {
        return <strong key={j}>{parseItalics(part)}</strong>;
      }
      return parseItalics(part);
    });
  };

  const parseItalics = (text) => {
    const italicParts = text.split(/\*(.*?)\*/);
    return italicParts.map((part, k) => {
      if (k % 2 === 1) {
        return <em key={k}>{part}</em>;
      }
      return part;
    });
  };

  // Render rich message text (Gemini-friendly multi-token parser)
  const renderText = (text) => {
    if (!text) return null;
    
    // Split into paragraphs by double newlines
    const paragraphs = text.split("\n\n");
    
    return paragraphs.map((para, i) => {
      const lines = para.split("\n");
      
      // Determine if the paragraph is a bullet/numbered list
      const isList = lines.every(line => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith("•") || 
          trimmed.startsWith("-") || 
          trimmed.startsWith("*") ||
          /^\d+\.\s/.test(trimmed)
        );
      });

      if (isList && lines.length > 0) {
        return (
          <ul key={i} style={{ margin: "8px 0", paddingLeft: "18px", listStyleType: "disc" }}>
            {lines.map((line, idx) => {
              const cleanLine = line.trim().replace(/^(•|-|\*|\d+\.)\s*/, "");
              return (
                <li key={idx} style={{ margin: "4px 0", lineHeight: "1.6" }}>
                  {parseFormatting(cleanLine)}
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p key={i} style={{ margin: i === paragraphs.length - 1 ? 0 : "0 0 10px 0", lineHeight: "1.6" }}>
          {lines.map((line, idx) => (
            <span key={idx}>
              {parseFormatting(line)}
              {idx < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
  };

  // Mood display — show different styling for crisis moods
  const isMoodCrisis = isCrisisMood(detectedMood.mood);

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-page-header fade-up">
        <div>
          <h2 className="section-title">AI <span>Companion</span></h2>
          <p className="chat-subtitle">Rasa NLP + LLM · CBT-guided responses</p>
        </div>
        <div className="online-status">
          <span className="online-dot" />
          MindEase is online
        </div>
      </div>

      <div className="chat-layout fd1">
        {/* ── MAIN CHAT PANEL ── */}
        <div className="card chat-main">
          {/* Quick replies */}
          <div className="quick-replies">
            {QUICK_REPLIES.map((q, i) => (
              <button key={i} className="qr-chip" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="chat-messages" id="chatMessages">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.role}`}>
                {msg.role === "bot" && (
                  <div className="msg-avatar avatar-bot">🌿</div>
                )}
                {msg.role === "user" && (
                  <div className="msg-avatar avatar-user">😊</div>
                )}
                <div>
                  <div className="msg-bubble">{renderText(msg.text)}</div>
                  <div className="msg-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="msg-row bot typing-bubble">
                <div className="msg-avatar avatar-bot">🌿</div>
                <div className="msg-bubble">
                  <span className="typ-dot" />
                  <span className="typ-dot" />
                  <span className="typ-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Share what's on your mind…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || typing}>
              ➤
            </button>
          </div>
          <p className="chat-disclaimer">
            MindEase AI is a supportive companion, not a substitute for professional mental health care. If you're in crisis, please contact a professional.
          </p>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="chat-side">
          {/* Detected mood */}
          <div className={`card mood-detected-card ${isMoodCrisis ? "crisis-mood-card" : ""}`}>
            <div className={`detected-ring ${isMoodCrisis ? "crisis-ring" : ""}`}>{detectedMood.emoji}</div>
            <div className="detected-label">{isMoodCrisis ? "⚠️ Alert Detected" : "Detected Mood"}</div>
            <div className="detected-value" style={isMoodCrisis ? { color: "#e85060" } : {}}>
              {detectedMood.mood.charAt(0).toUpperCase()+detectedMood.mood.slice(1)}
            </div>
            <div className="detected-conf">Confidence: {detectedMood.conf}%</div>
            <div className="conf-bar">
              <div className="conf-fill" style={{ width:`${detectedMood.conf}%`, background: isMoodCrisis ? "linear-gradient(90deg,#e85060,#c04080)" : undefined }} />
            </div>
            {isMoodCrisis && (
              <div className="crisis-mood-note">
                🆘 Crisis support has been activated. Please reach out immediately.
              </div>
            )}
          </div>

          {/* Quick reply buttons */}
          <div className="card qr-card">
            <div className="qr-section-label">Quick Responses</div>
            {QUICK_REPLIES.map((q, i) => (
              <button key={i} className="qr-btn" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          {/* Session stats */}
          <div className="card session-stats">
            <div className="ss-title">Session Stats</div>
            <div className="ss-row"><span className="ss-label">Duration</span><span className="ss-value">Active</span></div>
            <div className="ss-row"><span className="ss-label">Messages</span><span className="ss-value">{msgCount}</span></div>
            <div className="ss-row"><span className="ss-label">Techniques</span><span className="ss-value">CBT, Mindfulness</span></div>
            <div className="ss-row"><span className="ss-label">Mood shift</span><span className="ss-value ss-good">↑ Improving</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
