import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import "./Dashboard.css";

const MOOD_META = {
  happy: {
    color: "#7c9e8a",
    emoji: "😊",
    fill: "linear-gradient(90deg,#a8c4b0,#7c9e8a)",
  },
  joy: {
    color: "#7c9e8a",
    emoji: "😄",
    fill: "linear-gradient(90deg,#a8c4b0,#7c9e8a)",
  },
  calm: {
    color: "#8ab4c8",
    emoji: "😌",
    fill: "linear-gradient(90deg,#d8eaf3,#8ab4c8)",
  },
  sad: {
    color: "#9b8ec4",
    emoji: "😢",
    fill: "linear-gradient(90deg,#c4b9e8,#9b8ec4)",
  },
  sadness: {
    color: "#9b8ec4",
    emoji: "😔",
    fill: "linear-gradient(90deg,#c4b9e8,#9b8ec4)",
  },
  anxious: {
    color: "#c4a060",
    emoji: "😰",
    fill: "linear-gradient(90deg,#f0d090,#c4a060)",
  },
  anxiety: {
    color: "#c4a060",
    emoji: "😧",
    fill: "linear-gradient(90deg,#f0d090,#c4a060)",
  },
  angry: {
    color: "#c47880",
    emoji: "😤",
    fill: "linear-gradient(90deg,#f5d5d7,#c47880)",
  },
  neutral: {
    color: "#8fa69a",
    emoji: "😐",
    fill: "linear-gradient(90deg,#dceee4,#8fa69a)",
  },
  // Crisis labels from ML model (passed through directly now)
  depression: {
    color: "#7a5fa0",
    emoji: "🌧️",
    fill: "linear-gradient(90deg,#c4b9e8,#7a5fa0)",
  },
  suicidal: {
    color: "#c04070",
    emoji: "💙",
    fill: "linear-gradient(90deg,#f5d5e0,#c04070)",
  },
};

const getMeta = (m) =>
  MOOD_META[m?.toLowerCase()] || MOOD_META.neutral;

const scoreLabel = (s) =>
  s >= 0.72 ? "Great" : s >= 0.52 ? "Good" : s >= 0.35 ? "Okay" : "Low";

function buildDemoStats() {
  return {
    avgScore: 0.74,
    totalEntries: 21,
    streak: 5,
    dominantMood: "calm",

    moodHistory: [
      { date: "Mon", score: 0.45, mood: "anxious" },
      { date: "Tue", score: 0.62, mood: "calm" },
      { date: "Wed", score: 0.55, mood: "neutral" },
      { date: "Thu", score: 0.82, mood: "happy" },
      { date: "Fri", score: 0.5, mood: "sad" },
      { date: "Sat", score: 0.78, mood: "calm" },
      { date: "Sun", score: 0.68, mood: "calm" },
    ],

    moodBreakdown: [
      { mood: "calm", pct: 38 },
      { mood: "happy", pct: 25 },
      { mood: "anxious", pct: 17 },
      { mood: "sad", pct: 10 },
      { mood: "neutral", pct: 10 },
    ],
  };
}

export default function Dashboard({ setActivePage }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [selectedMood, setSelectedMood] = useState(null);
  const [breathPhase, setBreathPhase] = useState(null); // 'Inhale', 'Hold', 'Exhale', 'Pause', or null
  const [breathSeconds, setBreathSeconds] = useState(0);
  const [breathCycle, setBreathCycle] = useState(1);
  const [loggingMood, setLoggingMood] = useState(false);

  const breathRef = useRef(null);

  const greet = () => {
    const h = new Date().getHours();

    if (h < 12) return "morning";
    if (h < 18) return "afternoon";

    return "evening";
  };

  const handleMoodSelect = async (emoji, label) => {
    if (loggingMood) return;
    setSelectedMood(label);
    setLoggingMood(true);
    try {
      const checkInText = `Quick check-in: I am feeling ${label.toLowerCase()} today ${emoji}`;
      await api.post("/journal", { text: checkInText });
      
      addNotification?.(
        "Mood Checked-In! 🌟",
        `Your mood has been logged as "${label}". We have updated your analytics.`,
        "journal"
      );

      // Reload data
      const [s, e] = await Promise.all([
        api.get(`/mood/stats?range=${timeRange}`),
        api.get("/journal?limit=4"),
      ]);
      setStats(s);
      setRecentEntries(e.entries || []);
    } catch (err) {
      console.error("Failed to log mood check-in:", err);
    } finally {
      setLoggingMood(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const [s, e] = await Promise.all([
          api.get(`/mood/stats?range=${timeRange}`),
          api.get("/journal?limit=4"),
        ]);

        setStats(s);

        setRecentEntries(e.entries || []);
      } catch (err) {
        console.log(err);

        setStats(buildDemoStats());

        setRecentEntries([
          {
            _id: "d1",
            text: "Feeling grateful today, the sun was so warm and welcoming.",
            mood: "happy",
            score: 0.84,
            createdAt: new Date(
              Date.now() - 86400000
            ).toISOString(),
          },

          {
            _id: "d2",
            text: "Had a rough meeting, felt anxious about the upcoming deadline.",
            mood: "anxious",
            score: 0.42,
            createdAt: new Date(
              Date.now() - 172800000
            ).toISOString(),
          },

          {
            _id: "d3",
            text: "Spent time with family, really grounding and peaceful.",
            mood: "calm",
            score: 0.76,
            createdAt: new Date(
              Date.now() - 259200000
            ).toISOString(),
          },

          {
            _id: "d4",
            text: "Couldn't sleep last night, feeling a bit drained today.",
            mood: "sad",
            score: 0.35,
            createdAt: new Date(
              Date.now() - 345600000
            ).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [timeRange]);

  const startBreathing = () => {
    if (breathRef.current) {
      clearInterval(breathRef.current);
    }

    setBreathPhase("Inhale");
    setBreathSeconds(4);
    setBreathCycle(1);

    let currentPhase = "Inhale";
    let secondsLeft = 4;
    let cycle = 1;

    breathRef.current = setInterval(() => {
      secondsLeft -= 1;
      
      if (secondsLeft <= 0) {
        if (currentPhase === "Inhale") {
          currentPhase = "Hold";
          secondsLeft = 7;
        } else if (currentPhase === "Hold") {
          currentPhase = "Exhale";
          secondsLeft = 8;
        } else if (currentPhase === "Exhale") {
          currentPhase = "Pause";
          secondsLeft = 2;
        } else if (currentPhase === "Pause") {
          if (cycle >= 4) {
            clearInterval(breathRef.current);
            setBreathPhase(null);
            setBreathSeconds(0);
            setBreathCycle(1);
            return;
          } else {
            cycle += 1;
            currentPhase = "Inhale";
            secondsLeft = 4;
            setBreathCycle(cycle);
          }
        }
      }
      
      setBreathPhase(currentPhase);
      setBreathSeconds(secondsLeft);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spin-ring" />
      </div>
    );
  }

  const s = stats || buildDemoStats();

  // SAFE FALLBACK
  const moodHistory =
    s?.moodHistory?.length > 0
      ? s.moodHistory
      : [
          {
            date: "No Data",
            score: 0,
            mood: "neutral",
          },
        ];

  const moodBreakdown =
    s?.moodBreakdown?.length > 0
      ? s.moodBreakdown
      : [
          {
            mood: "neutral",
            pct: 100,
          },
        ];

  const chartMax = Math.max(
    ...moodHistory.map((d) => d.score || 0),
    0.01
  );

  // Current mood = most recent entry (latest ML prediction)
  const currentMood = moodHistory.length > 0
    ? moodHistory[moodHistory.length - 1].mood
    : "neutral";
  const currentScore = moodHistory.length > 0
    ? moodHistory[moodHistory.length - 1].score
    : 0;

  // SAFE SVG POINTS
  const pts = moodHistory.map((d, i) => {
    const x =
      moodHistory.length === 1
        ? 250
        : (i / (moodHistory.length - 1)) * 460 + 20;

    const y = 140 - ((d.score || 0) / chartMax) * 120;

    return {
      x,
      y,
      ...d,
    };
  });

  const linePath =
    pts.length > 0
      ? pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
          .join(" ")
      : "";

  const areaPath =
    pts.length > 0
      ? `${linePath} L${pts[pts.length - 1].x},160 L${pts[0].x},160 Z`
      : "";

  const peak =
    pts.length > 0
      ? pts.reduce((a, b) =>
          a.score > b.score ? a : b
        )
      : null;

  return (
    <div className="dashboard">

      {/* WELCOME */}
      <div className="welcome-banner fd1">
        <div className="wb-text">
          <h2>
            How are you <em>feeling today?</em>
          </h2>

          <p>
            MindEase AI listens, understands, and gently
            guides you through your emotional journey.
          </p>

          <div className="wb-streaks">
            <span className="streak sk-g">
              🔥 {s.streak || 0}-day streak
            </span>

            <span className="streak sk-p">
              ✨ {s.totalEntries || 0} sessions
            </span>

            <span className="streak sk-b">
              💚 Mood improving
            </span>
          </div>
        </div>

        <div className="wb-emoji floating">🌸</div>
      </div>

      {/* MOOD STRIP */}
      <div className="card mood-strip fd2">
        <span className="mood-strip-label">
          Today's mood
        </span>

        <div className="mood-buttons">
          {[
            ["😊", "Happy"],
            ["😌", "Calm"],
            ["😐", "Neutral"],
            ["😟", "Anxious"],
            ["😢", "Sad"],
            ["😤", "Stressed"],
          ].map(([emoji, label]) => (
            <button
              key={label}
              className={`mood-btn ${
                selectedMood === label ? "selected" : ""
              }`}
              onClick={() => handleMoodSelect(emoji, label)}
              disabled={loggingMood}
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          className="mood-strip-cta"
          onClick={() => setActivePage?.("journal")}
        >
          ✍️ Write Journal Entry
        </button>
      </div>

      {/* STAT CARDS GRID */}
      <div 
        className="fd2" 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
          gap: "18px", 
          margin: "10px 0" 
        }}
      >
        {/* wellness score card */}
        <div className="card stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="stat-top">
            <div className="stat-icon" style={{ background: "rgba(124,158,138,0.13)", color: "var(--sage)" }}>📈</div>
            <span className="trend-badge tr-up">
              {scoreLabel(s.avgScore)}
            </span>
          </div>
          <div>
            <div className="stat-value">{Math.round((s.avgScore || 0) * 100)}%</div>
            <div className="stat-label">Average Wellness Score</div>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${(s.avgScore || 0) * 100}%`, background: "var(--sage)" }} />
          </div>
        </div>

        {/* streak card */}
        <div className="card stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="stat-top">
            <div className="stat-icon" style={{ background: "rgba(232,180,184,0.13)", color: "var(--blush)" }}>🔥</div>
            <span className="trend-badge tr-up">Perfect</span>
          </div>
          <div>
            <div className="stat-value">{s.streak || 0} Days</div>
            <div className="stat-label">Active Streak</div>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${Math.min(100, ((s.streak || 0) / 7) * 100)}%`, background: "var(--blush)" }} />
          </div>
        </div>

        {/* total sessions card */}
        <div className="card stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="stat-top">
            <div className="stat-icon" style={{ background: "rgba(138,180,200,0.13)", color: "var(--sky)" }}>✨</div>
            <span className="trend-badge tr-neut">Active</span>
          </div>
          <div>
            <div className="stat-value">{s.totalEntries || 0}</div>
            <div className="stat-label">Total Sessions Logged</div>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${Math.min(100, (s.totalEntries || 0) * 4)}%`, background: "var(--sky)" }} />
          </div>
        </div>

        {/* dominant mood card */}
        <div className="card stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="stat-top">
            <div className="stat-icon" style={{ background: `${getMeta(s.dominantMood).color}20`, color: getMeta(s.dominantMood).color }}>
              {getMeta(s.dominantMood).emoji}
            </div>
            <span className="trend-badge tr-up" style={{ background: `${getMeta(s.dominantMood).color}15`, color: getMeta(s.dominantMood).color }}>
              Dominant
            </span>
          </div>
          <div>
            <div className="stat-value" style={{ textTransform: "capitalize" }}>{s.dominantMood || "neutral"}</div>
            <div className="stat-label">Dominant Mood</div>
          </div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: "100%", background: getMeta(s.dominantMood).color }} />
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="card chart-card">
        <div className="ch-row">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dk)", fontFamily: "'Playfair Display', serif" }}>Mood Trend</div>
            <div className="ch-sub">
              Your emotional journey this {timeRange}
            </div>
          </div>

          {/* Dominant + Current Mood badges side by side */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Dominant Mood (average of the period) */}
            {s.dominantMood && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: `${getMeta(s.dominantMood).color}14`,
                border: `1.5px solid ${getMeta(s.dominantMood).color}30`,
                borderRadius: 24, padding: "5px 12px"
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getMeta(s.dominantMood).color, display: "inline-block", flexShrink: 0 }} />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 9, color: "var(--soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>Avg. Mood</div>
                  <div style={{ fontSize: 12, color: getMeta(s.dominantMood).color, fontWeight: 700 }}>
                    {getMeta(s.dominantMood).emoji} {s.dominantMood.charAt(0).toUpperCase() + s.dominantMood.slice(1)}
                  </div>
                </div>
              </div>
            )}
            {/* Current Mood (latest prediction, live dot) */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: `${getMeta(currentMood).color}14`,
              border: `1.5px solid ${getMeta(currentMood).color}30`,
              borderRadius: 24, padding: "5px 12px"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: getMeta(currentMood).color, display: "inline-block", flexShrink: 0, animation: "pulse-ring 1.6s ease-out infinite" }} />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 9, color: "var(--soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>Current</div>
                <div style={{ fontSize: 12, color: getMeta(currentMood).color, fontWeight: 700 }}>
                  {getMeta(currentMood).emoji} {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)} &middot; {Math.round(currentScore * 100)}%
                </div>
              </div>
            </div>
            {/* Range switcher */}
            <div className="range-switcher">
              {["week", "month"].map((r) => (
                <button
                  key={r}
                  className={`range-btn ${timeRange === r ? "on" : ""}`}
                  onClick={() => setTimeRange(r)}
                >
                  {r === "week" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-svg-wrap">
          <svg
            viewBox="0 0 500 160"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="areaGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#7c9e8a"
                  stopOpacity=".28"
                />

                <stop
                  offset="100%"
                  stopColor="#7c9e8a"
                  stopOpacity="0"
                />
              </linearGradient>

              <linearGradient
                id="lineGrad"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="#a8c4b0"
                />

                <stop
                  offset="60%"
                  stopColor="#7c9e8a"
                />

                <stop
                  offset="100%"
                  stopColor="#9b8ec4"
                />
              </linearGradient>
            </defs>



            {[40, 80, 120].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="500"
                y2={y}
                stroke="rgba(124,158,138,.1)"
                strokeWidth="1"
              />
            ))}

            {pts.length > 0 && (
              <>
                <path
                  d={areaPath}
                  fill="url(#areaGrad)"
                />

                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill={
                      i === pts.length - 1
                        ? getMeta(p.mood).color
                        : "white"
                    }
                    stroke={getMeta(p.mood).color}
                    strokeWidth="2"
                  />
                ))}

                {peak && (
                  <>
                    <rect
                      x={peak.x - 22}
                      y={peak.y - 26}
                      width="44"
                      height="18"
                      rx="7"
                      fill="rgba(155,142,196,.85)"
                    />

                    <text
                      x={peak.x}
                      y={peak.y - 13}
                      fontSize="9"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {Math.round(peak.score * 100)}%
                    </text>
                  </>
                )}
              </>
            )}
          </svg>
        </div>

        <div className="ch-lbls">
          {moodHistory.map((d) => (
            <span
              key={d.date}
              className="ch-lbl"
            >
              {d.date}
            </span>
          ))}
        </div>
      </div>

      {/* RECENT ENTRIES & BREATHING ROW */}
      <div className="fd3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* RECENT ENTRIES */}
        <div className="card recent-card" style={{ margin: 0 }}>
          <div
            className="ch-ttl"
            style={{ marginBottom: 14 }}
          >
            Recent Journal Entries
          </div>

          {recentEntries.length === 0 ? (
            <p className="empty-state">
              No entries yet.
            </p>
          ) : (
            <div className="entry-list">
              {recentEntries.map((entry) => {
                const meta = getMeta(entry.mood);

                return (
                  <div
                    className="entry-item"
                    key={entry._id}
                  >
                    <div
                      className="entry-dot"
                      style={{
                        background: meta.color,
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div className="entry-dt">
                        {new Date(
                          entry.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>

                      <div className="entry-prev">
                        {entry.text}
                      </div>

                      <div
                        className="entry-emo"
                        style={{
                          color: meta.color,
                        }}
                      >
                        {meta.emoji} {entry.mood} ·{" "}
                        {Math.round(
                          (entry.score || 0.5) * 100
                        )}
                        /100
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GUIDED BREATHING CYCLE */}
        <div className="card breathing-card" style={{ margin: 0 }}>
          <div className="ch-ttl" style={{ marginBottom: 4 }}>4-7-8 Guided Breathing</div>
          <p style={{ fontSize: "12px", color: "var(--soft)", marginBottom: 14 }}>
            Calm your nervous system and activate your body's rest state.
          </p>

          <div className="breathing-circle-wrap">
            <div className={`breathing-circle ${breathPhase ? breathPhase.toLowerCase() : "idle"}`}>
              <span className="breathing-emoji">
                {breathPhase === "Inhale" ? "🫁" : 
                 breathPhase === "Hold" ? "🧘" : 
                 breathPhase === "Exhale" ? "😮‍💨" : 
                 breathPhase === "Pause" ? "✨" : "🌸"}
              </span>
            </div>
          </div>

          <div className="breath-phase-text">
            {breathPhase ? `${breathPhase}…` : "Ready to Begin"}
          </div>

          <div className="breath-seconds-text">
            {breathPhase ? `${breathSeconds}s remaining` : "Click below to start a 4-cycle grounding practice"}
          </div>

          {breathPhase ? (
            <div className="breath-cycle-indicator">
              Cycle {breathCycle} / 4
            </div>
          ) : (
            <button className="mood-strip-cta" onClick={startBreathing} style={{ margin: "5px 0 0 0" }}>
              ▶️ Start Breathing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}