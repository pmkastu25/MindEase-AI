import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useNotification } from "../context/NotificationContext";
import { useCrisis, isCrisisMood } from "../context/CrisisContext";
import "./Journal.css";

const MOOD_META = {
  happy: { color: "#7c9e8a", emoji: "😊", needle: "74%" },
  calm: { color: "#8ab4c8", emoji: "😌", needle: "62%" },
  neutral: { color: "#8fa69a", emoji: "😐", needle: "50%" },
  anxious: { color: "#c4a060", emoji: "😰", needle: "28%" },
  sad: { color: "#9b8ec4", emoji: "😢", needle: "18%" },
  angry: { color: "#c47880", emoji: "😤", needle: "12%" },
};
const getMeta = (m) => MOOD_META[m?.toLowerCase()] || MOOD_META.neutral;

const SUGGESTIONS = {
  happy: "Your positivity is wonderful! Savor this feeling and consider gratitude journaling to reinforce it.",
  calm: "This grounded state is precious. Use this clarity to reflect or plan something meaningful.",
  neutral: "A balanced state is a good foundation. Is there anything you've been pushing aside that needs attention?",
  anxious: "Try the 4-7-8 breathing technique. Inhale 4s, hold 7s, exhale 8s. Then name 5 things you can see.",
  sad: "It's okay to feel sad — emotions are information, not weakness. Offer yourself the kindness you'd give a friend.",
  angry: "Anger signals an unmet need. Brisk movement can help process this energy before revisiting the situation.",
};

const PROMPTS = [
  '"What emotions am I carrying with me today, and where might they be coming from?"',
  '"What am I grateful for right now, even in the small things?"',
  '"What would I tell a dear friend going through what I am experiencing?"',
  '"What is one thing I can do today to nurture my wellbeing?"',
];

const getDisplayPercentage = (score, mood) => {
  if (score > 0 && score < 1 && score !== 0.5) {
    return Math.round(score * 100);
  }
  const m = (mood || "").toLowerCase();
  if (m === "happy" || m === "joy") return 90;
  if (m === "calm") return 75;
  if (m === "neutral" || m === "greet") return 50;
  if (m === "anxious") return 30;
  if (m === "sad") return 25;
  if (m === "angry") return 20;
  if (m === "suicidal" || m === "depression") return 10;
  return score === 1 ? 100 : score === -1 ? 0 : 50;
};

const getChipStyle = (color, isModal = false) => {
  const c = color?.toLowerCase();
  // Map hex codes or getMeta output colors to high contrast accessible text versions
  const darkColor = c === '#7c9e8a' ? '#3d5c4b' : c === '#9b8ec4' ? '#4d3d7c' : c === '#c47880' ? '#7d383f' : c === '#8ab4c8' ? '#2e4f60' : c === '#c4a060' ? '#73561a' : '#38473f';
  return {
    background: `${color}1d`,
    color: darkColor,
    fontSize: isModal ? "12px" : "11px",
    fontWeight: 600,
    border: `1px solid ${color}45`,
    display: isModal ? "inline-block" : "inline-flex",
    padding: isModal ? "4px 10px" : "3px 8px",
    borderRadius: "8px",
    alignItems: "center",
    gap: "4px"
  };
};

const limitWords = (input, maxWords) => {
  if (!input) return "";
  const words = input.split(/(\s+)/);
  let wordCount = 0;
  const result = [];
  for (let i = 0; i < words.length; i++) {
    const segment = words[i];
    if (segment.trim().length > 0) {
      wordCount++;
    }
    if (wordCount > maxWords) {
      break;
    }
    result.push(segment);
  }
  return result.join("");
};

export default function Journal() {
  const { addNotification } = useNotification();
  const { triggerCrisis, setEmailSent } = useCrisis();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/journal");
      setEntries(res.entries || []);
    } catch {
      setEntries([
        { _id: "d1", text: "Feeling grateful today, the sun was so warm and welcoming.", mood: "happy", score: 1, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { _id: "d2", text: "Had a rough meeting, felt anxious about the upcoming deadline.", mood: "anxious", score: -1, createdAt: new Date(Date.now() - 172800000).toISOString() },
        { _id: "d3", text: "Spent time with family, really grounding and peaceful.", mood: "calm", score: 1, createdAt: new Date(Date.now() - 259200000).toISOString() },
        { _id: "d4", text: "Couldn't sleep last night, feeling a bit drained today.", mood: "sad", score: -1, createdAt: new Date(Date.now() - 345600000).toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (text.trim().length < 10) { setError("Please write at least 10 characters for an accurate analysis."); return; }
    setError(""); setAnalyzing(true); setResult(null);
    try {
      const res = await api.post("/journal", { text });
      const analysis = res.analysis || res;
      setResult(analysis);
      setText("");

      if (res.entry) {
        setEntries(prev => [res.entry, ...prev]);
        addNotification(
          "New Journal Analyzed ✍️",
          `Mood analyzed as "${analysis.mental_state || analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
          "journal"
        );
      } else {
        addNotification(
          "Greeting Analyzed 👋",
          "Greetings are analyzed for sentiment but not saved to your history.",
          "info"
        );
      }

      // ── Crisis middleware: PRIMARY check via is_crisis flag from ML service
      // This reliably catches Suicidal / Depression even when they're mood-aliased
      const shouldTriggerCrisis =
        res.is_crisis === true ||              // top-level flag from backend route
        analysis.is_crisis === true ||         // from analysis object
        isCrisisMood(analysis.mental_state) || // check raw ML label
        isCrisisMood(analysis.mood);           // fallback check on mapped mood
      if (shouldTriggerCrisis) {
        console.log("🚨 Crisis trigger activated for label:", analysis.mental_state || analysis.crisis_label);
        setTimeout(() => triggerCrisis(res.crisis_email_sent || analysis.crisis_email_sent || false), 600);
      }
    } catch {
      // Fallback local analysis
      const lower = text.toLowerCase();
      const isLocalGreet = /^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|wassup|yo|hii|heyy)(?:\s|[.!?]|$)/i.test(text.trim());

      let mood = "neutral";
      if (isLocalGreet) mood = "neutral";
      else if (lower.match(/happy|joy|wonderful|excited|love|great|fantastic|blessed/)) mood = "happy";
      else if (lower.match(/sad|depress|cry|lonely|hurt|hopeless/)) mood = "sad";
      else if (lower.match(/anxi|stress|worry|nervous|panic|overwhelm/)) mood = "anxious";
      else if (lower.match(/angry|furious|frustrated|mad|rage/)) mood = "angry";
      else if (lower.match(/calm|peace|relax|content|serene/)) mood = "calm";

      const m = getMeta(mood);
      const analysis = { mood, score: mood === "happy" ? 1 : mood === "calm" ? 1 : mood === "neutral" ? 0 : -1, suggestion: SUGGESTIONS[mood] };
      setResult(analysis);
      setText("");

      if (isLocalGreet) {
        addNotification(
          "Greeting Analyzed 👋",
          "Greetings are analyzed for sentiment but not saved to your history.",
          "info"
        );
      } else {
        setEntries(prev => [{ _id: Date.now(), text, ...analysis, createdAt: new Date().toISOString() }, ...prev]);
        addNotification(
          "New Journal Analyzed ✍️",
          `Mood analyzed as "${analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
          "journal"
        );
      }
      // ── Crisis middleware: local keyword check for extreme patterns
      // Also scan the raw text for suicidal/depressive language as final safety net
      const hasCrisisKeyword = /suicid|kill myself|end my life|don't want to live|not worth living|depress|hopeless|self.harm/i.test(text);
      if (isCrisisMood(mood) || hasCrisisKeyword) {
        setTimeout(() => triggerCrisis(), 600);
      }
    } finally { setAnalyzing(false); }
  };

  const handleUpdate = async (id) => {
    if (editText.trim().length < 10) return;
    setUpdatingId(id);
    try {
      const res = await api.put(`/journal/${id}`, { text: editText });
      const updatedEntry = res.entry;
      const analysis = res.analysis || res;

      // Update state
      setEntries(prev => prev.map(e => e._id === id ? updatedEntry : e));
      setEditingId(null);
      setResult(analysis);

      addNotification(
        "Journal Updated ✍️",
        `Mood analyzed as "${analysis.mental_state || analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
        "journal"
      );

      // Crisis check
      const shouldTriggerCrisis =
        res.is_crisis === true ||
        analysis.is_crisis === true ||
        isCrisisMood(analysis.mental_state) ||
        isCrisisMood(analysis.mood);
      if (shouldTriggerCrisis) {
        console.log("🚨 Crisis trigger activated for label:", analysis.mental_state || analysis.crisis_label);
        setTimeout(() => triggerCrisis(res.crisis_email_sent || analysis.crisis_email_sent || false), 600);
      }
    } catch {
      // Fallback local analysis
      const lower = editText.toLowerCase();
      let mood = "neutral";
      if (lower.match(/happy|joy|wonderful|excited|love|great|fantastic|blessed/)) mood = "happy";
      else if (lower.match(/sad|depress|cry|lonely|hurt|hopeless/)) mood = "sad";
      else if (lower.match(/anxi|stress|worry|nervous|panic|overwhelm/)) mood = "anxious";
      else if (lower.match(/angry|furious|frustrated|mad|rage/)) mood = "angry";
      else if (lower.match(/calm|peace|relax|content|serene/)) mood = "calm";
      const m = getMeta(mood);
      const analysis = { mood, score: mood === "happy" ? 1 : mood === "calm" ? 1 : mood === "neutral" ? 0 : -1, suggestion: SUGGESTIONS[mood] };

      const fallbackEntry = {
        _id: id,
        text: editText,
        mood,
        score: analysis.score,
        createdAt: new Date().toISOString()
      };

      setEntries(prev => prev.map(e => e._id === id ? { ...e, ...fallbackEntry } : e));
      setEditingId(null);
      setResult(analysis);

      addNotification(
        "Journal Updated ✍️",
        `Mood analyzed as "${analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
        "journal"
      );

      const hasCrisisKeyword = /suicid|kill myself|end my life|don't want to live|not worth living|depress|hopeless|self.harm/i.test(editText);
      if (isCrisisMood(mood) || hasCrisisKeyword) {
        setTimeout(() => triggerCrisis(), 600);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="journal-page">
      <div className="pt-row fade-up">
        <h2 className="section-title">Your <span>Journal</span></h2>
        <button className="btn-pr">+ New Entry</button>
      </div>

      <div className="journal-grid fd1">
        {/* EDITOR */}
        <div className="card journal-editor">
          <div className="journal-date">
            📅 {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div className="journal-prompt">{prompt}</div>
          <textarea
            className="journal-textarea"
            value={text}
            onChange={e => setText(limitWords(e.target.value, 600))}
            placeholder={"Begin writing freely… this is your safe space. MindEase AI will gently analyze the emotions behind your words.\n\nThere are no right or wrong answers — just your truth."}
          />
          {error && <p className="journal-error">{error}</p>}
          <div className="journal-actions">
            <span className="word-count">{wordCount} / 600 words</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-out">💾 Save Draft</button>
              <button className="analyze-btn" onClick={handleAnalyze} disabled={analyzing || text.trim().length < 10}>
                {analyzing ? <><span className="spinner" /> Analyzing…</> : "🔍 Analyze Mood"}
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="journal-sidebar">
          {/* Sentiment result */}
          <div className="card sentiment-result">
            <div style={{ fontSize: "10.5px", color: "var(--soft)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>
              Sentiment Analysis
            </div>
            <div className="sent-emoji">{result ? getMeta(result.mood).emoji : "🌿"}</div>
            <div className="sent-label">{result ? result.mood.charAt(0).toUpperCase() + result.mood.slice(1) : "Write to reveal"}</div>
            <div className="sent-desc">
              {result ? `Confidence: ${Math.round(result.score * 100)}%` : "Your emotional tone will appear here after analysis"}
            </div>
            <div className="sent-meter">
              <div className="sent-needle" style={{ left: result ? getMeta(result.mood).needle : "50%" }} />
            </div>
            <div className="sent-scale">
              <span>Negative</span><span>Neutral</span><span>Positive</span>
            </div>
            {result && (
              <div className="sent-suggestion fade-up">
                <span className="sent-suggestion-icon">💡</span>
                <span>{result.suggestion || SUGGESTIONS[result.mood]}</span>
              </div>
            )}
          </div>

          {/* Past entries */}
          <div className="card past-entries">
            <div className="past-entries-title">Recent Entries</div>
            {loading ? (
              <p className="empty-state">Loading entries…</p>
            ) : entries.slice(0, 4).map(e => {
              const m = getMeta(e.mood);
              return (
                <div className="entry-item" key={e._id} style={{ borderRadius: 13 }} onClick={() => setViewingEntry(e)}>
                  <div className="entry-dot" style={{ background: m.color }} />
                  <div>
                    <div className="entry-dt">{new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div className="entry-prev">{e.text}</div>
                    <div className="entry-emo" style={{ color: m.color }}>
                      {m.emoji} {e.mood} · {getDisplayPercentage(e.score, e.mood)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ENTRIES GRID */}
      {entries.length > 0 && (
        <div className="fd2">
          <div className="pt-row">
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 400 }}>All Entries</h3>
          </div>
          <div className="entries-grid">
            {entries.map((entry, i) => {
              const m = getMeta(entry.mood);
              const isEditing = editingId === entry._id;
              const isUpdating = updatingId === entry._id;
              return (
                <div
                  className="card entry-card"
                  key={entry._id}
                  style={{ animationDelay: `${i * .05}s`, borderColor: `${m.color}30` }}
                  onClick={() => { if (!isEditing) setViewingEntry(entry); }}
                >
                  <div className="entry-card-top">
                    <span className="entry-card-emoji">{m.emoji}</span>
                    <span className="chip" style={getChipStyle(m.color)}>
                      {entry.mood} · {getDisplayPercentage(entry.score, entry.mood)}%
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" }}>
                      <span className="entry-card-date">{new Date(entry.createdAt).toLocaleDateString()}</span>
                      {!isEditing && (
                        <button
                          className="card-edit-btn"
                          onClick={(e) => { e.stopPropagation(); setEditingId(entry._id); setEditText(entry.text); }}
                          title="Edit Entry"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="entry-edit-container">
                      <textarea
                        className="entry-edit-textarea"
                        value={editText}
                        onChange={e => setEditText(limitWords(e.target.value, 600))}
                      />
                      <div className="entry-edit-actions">
                        <button
                          className="btn-out"
                          onClick={() => setEditingId(null)}
                          disabled={isUpdating}
                          style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                        >
                          Cancel
                        </button>
                        <button
                          className="analyze-btn"
                          onClick={() => handleUpdate(entry._id)}
                          disabled={isUpdating || editText.trim().length < 10}
                          style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                      {editText.trim().length < 10 && (
                        <p style={{ color: "#c47880", fontSize: "11px", marginTop: "4px" }}>
                          Min 10 characters required.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="entry-card-text">{entry.text}</p>
                  )}
                  <div className="entry-score-bar">
                    <div className="entry-score-fill" style={{ width: `${(entry.score + 1) * 50}%`, background: m.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingEntry && (
        <div className="entry-modal-overlay" onClick={() => setViewingEntry(null)}>
          <div className="entry-modal" onClick={e => e.stopPropagation()}>
            <button className="entry-modal-close" onClick={() => setViewingEntry(null)}>×</button>
            <div className="entry-modal-header">
              <span className="entry-modal-emoji">{getMeta(viewingEntry.mood).emoji}</span>
              <div>
                <span className="chip" style={getChipStyle(getMeta(viewingEntry.mood).color, true)}>
                  {viewingEntry.mood} · {getDisplayPercentage(viewingEntry.score, viewingEntry.mood)}%
                </span>
                <div className="entry-modal-date">
                  📅 {new Date(viewingEntry.createdAt).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            <div className="entry-modal-body">
              <p className="entry-modal-text">{viewingEntry.text}</p>
            </div>
            <div className="entry-modal-footer">
              <div className="entry-modal-suggestion">
                <strong>Reflective Suggestion</strong>
                <p>{viewingEntry.suggestion || SUGGESTIONS[viewingEntry.mood?.toLowerCase()] || "Take a deep breath and acknowledge your feelings. Reflecting on your state of mind is a powerful step towards emotional well-being."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
