import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useNotification } from "../context/NotificationContext";
import { useCrisis, isCrisisMood } from "../context/CrisisContext";
import "./Journal.css";

const MOOD_META = {
  happy:   { color:"#7c9e8a", emoji:"😊", needle:"74%" },
  calm:    { color:"#8ab4c8", emoji:"😌", needle:"62%" },
  neutral: { color:"#8fa69a", emoji:"😐", needle:"50%" },
  anxious: { color:"#c4a060", emoji:"😰", needle:"28%" },
  sad:     { color:"#9b8ec4", emoji:"😢", needle:"18%" },
  angry:   { color:"#c47880", emoji:"😤", needle:"12%" },
};
const getMeta = (m) => MOOD_META[m?.toLowerCase()] || MOOD_META.neutral;

const SUGGESTIONS = {
  happy:   "Your positivity is wonderful! Savor this feeling and consider gratitude journaling to reinforce it.",
  calm:    "This grounded state is precious. Use this clarity to reflect or plan something meaningful.",
  neutral: "A balanced state is a good foundation. Is there anything you've been pushing aside that needs attention?",
  anxious: "Try the 4-7-8 breathing technique. Inhale 4s, hold 7s, exhale 8s. Then name 5 things you can see.",
  sad:     "It's okay to feel sad — emotions are information, not weakness. Offer yourself the kindness you'd give a friend.",
  angry:   "Anger signals an unmet need. Brisk movement can help process this energy before revisiting the situation.",
};

const PROMPTS = [
  '"What emotions am I carrying with me today, and where might they be coming from?"',
  '"What am I grateful for right now, even in the small things?"',
  '"What would I tell a dear friend going through what I am experiencing?"',
  '"What is one thing I can do today to nurture my wellbeing?"',
];

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

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/journal");
      setEntries(res.entries || []);
    } catch {
      setEntries([
        { _id:"d1", text:"Feeling grateful today, the sun was so warm and welcoming.", mood:"happy",   score:.84, createdAt:new Date(Date.now()-86400000).toISOString() },
        { _id:"d2", text:"Had a rough meeting, felt anxious about the upcoming deadline.", mood:"anxious", score:.42, createdAt:new Date(Date.now()-172800000).toISOString() },
        { _id:"d3", text:"Spent time with family, really grounding and peaceful.", mood:"calm",    score:.76, createdAt:new Date(Date.now()-259200000).toISOString() },
        { _id:"d4", text:"Couldn't sleep last night, feeling a bit drained today.", mood:"sad",     score:.35, createdAt:new Date(Date.now()-345600000).toISOString() },
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
      setEntries(prev => [res.entry || { _id:Date.now(), text, ...analysis, createdAt:new Date().toISOString() }, ...prev]);
      setText("");
      addNotification(
        "New Journal Analyzed ✍️",
        `Mood analyzed as "${analysis.mental_state || analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
        "journal"
      );
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
      let mood = "neutral";
      if (lower.match(/happy|joy|wonderful|excited|love|great|fantastic|blessed/)) mood = "happy";
      else if (lower.match(/sad|depress|cry|lonely|hurt|hopeless/)) mood = "sad";
      else if (lower.match(/anxi|stress|worry|nervous|panic|overwhelm/)) mood = "anxious";
      else if (lower.match(/angry|furious|frustrated|mad|rage/)) mood = "angry";
      else if (lower.match(/calm|peace|relax|content|serene/)) mood = "calm";
      const m = getMeta(mood);
      const analysis = { mood, score: mood==="happy"?.82:mood==="calm"?.72:mood==="neutral"?.52:mood==="anxious"?.3:mood==="sad"?.28:.22, suggestion: SUGGESTIONS[mood] };
      setResult(analysis);
      setEntries(prev => [{ _id:Date.now(), text, ...analysis, createdAt:new Date().toISOString() }, ...prev]);
      setText("");
      addNotification(
        "New Journal Analyzed ✍️",
        `Mood analyzed as "${analysis.mood}". Confidence: ${Math.round(analysis.score * 100)}%.`,
        "journal"
      );
      // ── Crisis middleware: local keyword check for extreme patterns
      // Also scan the raw text for suicidal/depressive language as final safety net
      const hasCrisisKeyword = /suicid|kill myself|end my life|don't want to live|not worth living|depress|hopeless|self.harm/i.test(text);
      if (isCrisisMood(mood) || hasCrisisKeyword) {
        setTimeout(() => triggerCrisis(), 600);
      }
    } finally { setAnalyzing(false); }
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
            📅 {new Date().toLocaleDateString("en-IN",{ weekday:"long", month:"long", day:"numeric", year:"numeric" })}
          </div>
          <div className="journal-prompt">{prompt}</div>
          <textarea
            className="journal-textarea"
            value={text}
            onChange={e => setText(e.target.value.slice(0, 600))}
            placeholder={"Begin writing freely… this is your safe space. MindEase AI will gently analyze the emotions behind your words.\n\nThere are no right or wrong answers — just your truth."}
          />
          {error && <p className="journal-error">{error}</p>}
          <div className="journal-actions">
            <span className="word-count">{wordCount} / 600 words</span>
            <div style={{ display:"flex", gap:10 }}>
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
            <div style={{ fontSize:"10.5px", color:"var(--soft)", marginBottom:10, textTransform:"uppercase", letterSpacing:"1.2px", fontWeight:600 }}>
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
                <div className="entry-item" key={e._id} style={{ borderRadius:13 }}>
                  <div className="entry-dot" style={{ background: m.color }} />
                  <div>
                    <div className="entry-dt">{new Date(e.createdAt).toLocaleDateString("en-IN",{ month:"short", day:"numeric", year:"numeric" })}</div>
                    <div className="entry-prev">{e.text}</div>
                    <div className="entry-emo" style={{ color: m.color }}>
                      {m.emoji} {e.mood} · {Math.round((e.score||.5)*100)}/100
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
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:400 }}>All Entries</h3>
          </div>
          <div className="entries-grid">
            {entries.map((entry, i) => {
              const m = getMeta(entry.mood);
              return (
                <div className="card entry-card" key={entry._id} style={{ animationDelay:`${i*.05}s`, borderColor:`${m.color}30` }}>
                  <div className="entry-card-top">
                    <span className="entry-card-emoji">{m.emoji}</span>
                    <span className="chip" style={{ background:`${m.color}18`, color:m.color, fontSize:"11px" }}>
                      {entry.mood} · {Math.round((entry.score||.5)*100)}%
                    </span>
                    <span className="entry-card-date">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="entry-card-text">{entry.text}</p>
                  <div className="entry-score-bar">
                    <div className="entry-score-fill" style={{ width:`${(entry.score||.5)*100}%`, background:m.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
