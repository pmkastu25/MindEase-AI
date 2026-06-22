import { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";
import "./Analytics.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const HM_COLS = ["#dceee4", "#b8d8c4", "#a8c4b0", "#7c9e8a", "#5a8870"];

const MOOD_META = {
  happy: { color: "#7c9e8a", emoji: "😊" },
  joy: { color: "#7c9e8a", emoji: "😄" },
  calm: { color: "#8ab4c8", emoji: "😌" },
  sad: { color: "#9b8ec4", emoji: "😢" },
  sadness: { color: "#9b8ec4", emoji: "😔" },
  anxious: { color: "#c4a060", emoji: "😰" },
  anxiety: { color: "#c4a060", emoji: "😧" },
  angry: { color: "#c47880", emoji: "😤" },
  neutral: { color: "#8fa69a", emoji: "😐" },
  // Crisis labels from ML model (now passed through directly)
  depression: { color: "#7a5fa0", emoji: "🌧️" },
  suicidal:   { color: "#c04070", emoji: "💙" },
};


const getMeta = (m) =>
  MOOD_META[m?.toLowerCase()] || MOOD_META.neutral;

export default function Analytics() {
  const [range, setRange] = useState("week");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(`/mood/stats?range=${range}`);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spin-ring" />
      </div>
    );
  }

  const s = stats || {};

  const avgScore = s.avgScore ?? 0.74;
  const totalEntries = s.totalEntries ?? 21;
  const streak = s.streak ?? 5;
  const dominantMood = s.dominantMood || "calm";

  const moodHistory = s.moodHistory || [
    { date: "Mon", score: 0.45, mood: "anxious" },
    { date: "Tue", score: 0.62, mood: "calm" },
    { date: "Wed", score: 0.55, mood: "neutral" },
    { date: "Thu", score: 0.82, mood: "happy" },
    { date: "Fri", score: 0.5, mood: "sad" },
    { date: "Sat", score: 0.78, mood: "calm" },
    { date: "Sun", score: 0.68, mood: "calm" },
  ];

  // Current mood = latest entry in moodHistory (most recent prediction)
  const currentMood = moodHistory.length > 0
    ? moodHistory[moodHistory.length - 1].mood
    : "neutral";
  const currentScore = moodHistory.length > 0
    ? moodHistory[moodHistory.length - 1].score
    : 0.5;

  const moodBreakdown = s.moodBreakdown || [
    { mood: "calm", pct: 38 },
    { mood: "happy", pct: 25 },
    { mood: "anxious", pct: 17 },
    { mood: "sad", pct: 10 },
    { mood: "neutral", pct: 10 },
  ];

  const heatmapData = s.heatmapData || Array(35).fill(-1);

  const correlations = s.correlations || {
    isMock: true,
    boosters: [
      { category: "Exercise & Activity", variance: 0.18, count: 4 },
      { category: "Nature & Outdoors", variance: 0.12, count: 3 },
      { category: "Family & Friends", variance: 0.08, count: 5 }
    ],
    stressors: [
      { category: "Work & Studies", variance: -0.14, count: 6 },
      { category: "Rest & Sleep", variance: -0.09, count: 4 }
    ]
  };

  const generatePrescription = () => {
    const topBooster = correlations.boosters?.[0]?.category || null;
    const topStressor = correlations.stressors?.[0]?.category || null;

    if (!topBooster && !topStressor) {
      return "Continue writing daily journal entries. As our engine maps your emotional landscape, personalized therapeutic guidelines, behavioral adjustments, and custom mindfulness prescriptions will appear here.";
    }

    const boosterTexts = {
      "Exercise & Activity": "Engaging in physical workouts and activities acts as your primary emotional anchor, releasing vital endorphins and physically regulating stress. Dedicating even 15 minutes to moving your body daily will create a major psychological buffer against daily burnout.",
      "Nature & Outdoors": "Spending time outdoors and connecting with nature is your ultimate cognitive reset. The visual stillness and open environments trigger physiological relaxation. Make a conscious habit of walking in green spaces when feeling overwhelmed.",
      "Family & Friends": "Social connection and relational dialogue serve as your psychological safety net. Conversations with loved ones drastically lower cortisol levels. Prioritize regular check-ins or shared dinners to maintain this crucial support loop.",
      "Rest & Sleep": "Quality rest and sleep hygiene are absolute game-changers for your cognitive baseline. Your mind heals and consolidates emotional resilience during deep rest cycles. Prioritize a dark, screen-free pre-sleep wind-down routine.",
      "Work & Studies": "Productive progress in your work or academic projects feeds your sense of self-efficacy and control. Translating challenges into structured checklists will amplify this positive momentum and channel your creative energy beautifully."
    };

    const stressorTexts = {
      "Work & Studies": "Academic deadlines, professional tasks, or general workload are currently your primary cognitive stressors. To mitigate this stress response, implement a strict 'time-boxing' strategy: take deliberate, scheduled micro-breaks and transition fully away from professional channels during off-hours.",
      "Rest & Sleep": "Compromised sleep or inadequate cognitive recovery cycles are severely dragging down your wellness index. Prioritize high-quality sleep hygiene; even small adjustments, like consistent sleep-wake times and avoiding blue-light screens 30 minutes before bed, will yield noticeable gains.",
      "Family & Friends": "Social friction or overwhelming relational responsibilities are elevating your mental load. Protect your emotional energy by setting clear, healthy boundaries, and ensure you make regular, quiet spaces for solo self-care.",
      "Exercise & Activity": "A lack of physical activity or prolonged sedentary routines may be exacerbating your feelings of restlessness and low energy. Try starting small—light stretching, a brief outdoor stroll, or mild physical exercise can significantly shift your biological mood baseline.",
      "Nature & Outdoors": "Spending too much time indoors or isolated from nature might be causing cognitive claustrophobia. A simple change of scenery, opening a window, or spending brief moments under sunlight can help break this cycle of mental exhaustion."
    };

    const boosterPara = topBooster 
      ? boosterTexts[topBooster] 
      : "Discovering positive correlations helps optimize daily routines.";
    const stressorPara = topStressor 
      ? stressorTexts[topStressor] 
      : "Identifying specific triggers is the first step toward self-regulation.";

    return `Based on your cognitive baseline, ${boosterPara} Meanwhile, ${stressorPara} By consciously leaning into your mood boosters and managing these primary triggers, you can systematically elevate your daily wellbeing.`;
  };

  // 1. Chart.js Config for Line Chart (Mood Score Over Time)
  const lineData = {
    labels: moodHistory.map((d) => d.date),
    datasets: [
      {
        label: "Mood Score",
        data: moodHistory.map((d) => Math.round(d.score * 100)),
        borderColor: "#7c9e8a",
        backgroundColor: "rgba(124, 158, 138, 0.12)",
        borderWidth: 2.5,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#7c9e8a",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      },
      {
        label: "Baseline",
        data: Array(moodHistory.length).fill(50),
        borderColor: "rgba(155, 142, 196, 0.4)",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(155, 142, 196, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const mood = moodHistory[index]?.mood || "neutral";
            return ` Wellness: ${context.raw}% (${mood.toUpperCase()})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#8fa69a",
          font: {
            size: 9,
            family: "DM Sans"
          }
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 50,
          color: "#8fa69a",
          font: {
            size: 9,
            family: "DM Sans"
          }
        },
        grid: {
          color: "rgba(0, 0, 0, 0.04)",
        }
      }
    }
  };

  // 2. Chart.js Config for Doughnut Chart (Emotion Mix)
  const doughnutData = {
    labels: moodBreakdown.map((b) => b.mood.charAt(0).toUpperCase() + b.mood.slice(1)),
    datasets: [
      {
        data: moodBreakdown.map((b) => b.pct),
        backgroundColor: moodBreakdown.map((b) => getMeta(b.mood).color),
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(45, 58, 52, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            return ` ${context.label}: ${context.raw}%`;
          }
        }
      }
    }
  };

  // 2.5. Chart.js Config for Emotional Drivers (Mood Boosters & Triggers)
  const boosterLabels = (correlations.boosters || []).map(b => b.category);
  const boosterData = {
    labels: boosterLabels,
    datasets: [
      {
        data: (correlations.boosters || []).map(b => Math.round(b.variance * 100)),
        backgroundColor: "rgba(124, 158, 138, 0.85)",
        borderColor: "#7c9e8a",
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: "start",
        barThickness: 16
      }
    ]
  };

  const boosterOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(45, 58, 52, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const item = correlations.boosters[context.dataIndex];
            return ` Mood Boost: +${context.raw}% (${item.count} logs)`;
          }
        }
      }
    },
    scales: {
      x: {
        min: 0,
        suggestedMax: 25,
        grid: { color: "rgba(0, 0, 0, 0.04)" },
        ticks: {
          callback: (value) => `+${value}%`,
          color: "#8fa69a",
          font: { size: 9, family: "DM Sans" }
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#2d3a34",
          font: { size: 11, family: "DM Sans", weight: "500" }
        }
      }
    }
  };

  const triggerLabels = (correlations.stressors || []).map(s => s.category);
  const triggerData = {
    labels: triggerLabels,
    datasets: [
      {
        data: (correlations.stressors || []).map(s => Math.abs(Math.round(s.variance * 100))),
        backgroundColor: "rgba(196, 120, 128, 0.85)",
        borderColor: "#c47880",
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: "start",
        barThickness: 16
      }
    ]
  };

  const triggerOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(45, 58, 52, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const item = correlations.stressors[context.dataIndex];
            return ` Mood Drag: -${context.raw}% (${item.count} logs)`;
          }
        }
      }
    },
    scales: {
      x: {
        min: 0,
        suggestedMax: 25,
        grid: { color: "rgba(0, 0, 0, 0.04)" },
        ticks: {
          callback: (value) => `-${value}%`,
          color: "#8fa69a",
          font: { size: 9, family: "DM Sans" }
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#2d3a34",
          font: { size: 11, family: "DM Sans", weight: "500" }
        }
      }
    }
  };

  // 3. Dynamic Stressors calculation
  const anxietyPct = moodBreakdown.find(m => m.mood === "anxious" || m.mood === "anxiety")?.pct || 0;
  const sadnessPct = moodBreakdown.find(m => m.mood === "sad" || m.mood === "sadness")?.pct || 0;
  const angerPct = moodBreakdown.find(m => m.mood === "angry")?.pct || 0;
  const calmPct = moodBreakdown.find(m => m.mood === "calm" || m.mood === "happy" || m.mood === "joy")?.pct || 0;

  const dynamicStressors = [
    { label: "Anxiety & Worry", level: anxietyPct > 40 ? "High" : anxietyPct > 15 ? "Medium" : "Low", pct: Math.max(12, anxietyPct * 2), gradient: "linear-gradient(90deg,#e8c4b8,#c47880)" },
    { label: "Sadness & Burnout", level: sadnessPct > 35 ? "High" : sadnessPct > 12 ? "Medium" : "Low", pct: Math.max(15, sadnessPct * 2.5), gradient: "linear-gradient(90deg,#c4b9e8,#9b8ec4)" },
    { label: "Frustration & Stress", level: angerPct > 30 ? "High" : angerPct > 10 ? "Medium" : "Low", pct: Math.max(8, angerPct * 3), gradient: "linear-gradient(90deg,#d8eaf3,#8ab4c8)" },
    { label: "Calmness & Stability", level: calmPct > 60 ? "High" : calmPct > 30 ? "Medium" : "Low", pct: Math.max(25, calmPct), gradient: "linear-gradient(90deg,#dceee4,#a8c4b0)" }
  ].sort((a, b) => b.pct - a.pct);

  // 4. Heatmap helper functions
  const getCellBg = (v) => {
    if (v === null) return "transparent";
    if (v === -1) return "rgba(0,0,0,0.04)";
    const idx = Math.min(HM_COLS.length - 1, Math.floor(v * HM_COLS.length));
    return HM_COLS[idx];
  };

  const getCellTextColor = (v) => {
    if (v === -1) return "var(--soft, #8fa69a)";
    return v >= 0.52 ? "#ffffff" : "#2d3a34";
  };

  const firstDayOffset = heatmapData.findIndex(v => v !== null);
  const getCellTitle = (v, idx) => {
    if (v === null) return undefined;
    const dayOfMonth = idx - firstDayOffset + 1;
    if (v === -1) return `Day ${dayOfMonth}: No sessions logged`;
    return `Day ${dayOfMonth}: Wellness Score ${Math.round(v * 100)}%`;
  };

  // 5. Insight Pills List
  const peakDay = moodHistory.length > 0
    ? moodHistory.reduce((a, b) => a.score > b.score ? a : b)
    : null;
  const peakText = peakDay ? `Peak: ${peakDay.date} (${Math.round(peakDay.score * 100)}%)` : "No Peak yet";

  const pills = [
    { dot: "#7c9e8a", text: `Mood avg. ${Math.round(avgScore * 100)}/100` },
    { dot: getMeta(dominantMood).color, text: `Dominant: ${(dominantMood || "neutral").toUpperCase()} ${getMeta(dominantMood).emoji}` },
    { dot: getMeta(currentMood).color,  text: `Current: ${(currentMood || "neutral").toUpperCase()} ${getMeta(currentMood).emoji}` },
    { dot: "#e8c870", text: peakText },
    { dot: "#e8b4b8", text: `Streak: ${streak || 0} Days` },
    { dot: "#8ab4c8", text: `${totalEntries || 0} sessions logged` },
  ];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="pt-row fade-up">
        <h2 className="section-title">Mood <span>Analytics</span></h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-out" onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s, null, 2));
            const dl = document.createElement("a");
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", `mindease_analytics_export_${Date.now()}.json`);
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
          }}>↓ Export</button>
          <div className="ch-tabs">
            {["week", "month", "year"].map(r => (
              <button key={r} className={`ch-tab ${range === r ? "on" : ""}`} onClick={() => setRange(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insight pills */}
      <div className="insight-row fd1">
        {pills.map((p, i) => (
          <div key={i} className="ins-pill">
            <span className="ins-dot" style={{ background: p.dot }} />
            {p.text}
          </div>
        ))}
      </div>

      {/* Main chart + donut */}
      <div className="g31 fd1">
        <div className="card chart-card">
          <div className="ch-row">
            <div>
              <div className="ch-ttl">Mood Score Over Time</div>
              <div className="ch-sub">Daily average from journal + chatbot sentiment</div>
            </div>
            {/* Dominant Mood + Current Mood side-by-side badges */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* Dominant Mood badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: `${getMeta(dominantMood).color}14`,
                border: `1.5px solid ${getMeta(dominantMood).color}30`,
                borderRadius: 24, padding: "5px 12px"
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getMeta(dominantMood).color, display: "inline-block", flexShrink: 0 }} />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 9, color: "var(--soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>Avg. Mood</div>
                  <div style={{ fontSize: 12, color: getMeta(dominantMood).color, fontWeight: 700 }}>
                    {getMeta(dominantMood).emoji} {(dominantMood || "neutral").charAt(0).toUpperCase() + (dominantMood || "neutral").slice(1)}
                  </div>
                </div>
              </div>
              {/* Current Mood badge */}
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
                    {getMeta(currentMood).emoji} {(currentMood || "neutral").charAt(0).toUpperCase() + (currentMood || "neutral").slice(1)} &middot; {Math.round(currentScore * 100)}%
                  </div>
                </div>
              </div>
              {/* Baseline legend */}
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--soft)" }}>
                <span style={{ width: 12, height: 2, background: "var(--lav)", display: "inline-block", borderRadius: 3, opacity: .6 }} />
                Baseline
              </span>
            </div>
          </div>
          <div className="chart-svg-wrap" style={{ height: 210, position: "relative" }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Donut */}
        <div className="card chart-card">
          <div className="ch-ttl" style={{ marginBottom: 3 }}>Emotion Mix</div>
          <div className="ch-sub" style={{ marginBottom: 18 }}>Last 30 days</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18, position: "relative", width: "115px", height: "115px", margin: "0 auto 18px" }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              pointerEvents: "none"
            }}>
              <span style={{ fontSize: "8.5px", color: "#8fa69a", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "600" }}>Dominant</span>
              <span style={{ fontSize: "12.5px", color: "#2d3a34", fontWeight: "700", textTransform: "capitalize", marginTop: "2px" }}>
                {dominantMood}
              </span>
            </div>
          </div>
          {moodBreakdown.map((breakdown, i) => {
            const label = breakdown.mood.charAt(0).toUpperCase() + breakdown.mood.slice(1);
            const color = getMeta(breakdown.mood).color;
            return (
              <div key={i} className="dl-row">
                <span className="dl-label">
                  <span className="dl-swatch" style={{ background: color }} />
                  {label}
                </span>
                <span className="dl-pct">{breakdown.pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap + stressors */}
      <div className="g3 fd2">
        {/* Heatmap — spans 2 cols */}
        <div className="card chart-card" style={{ gridColumn: "span 2" }}>
          <div className="hm-header">
            <div>
              <div className="ch-ttl">Mood Heatmap</div>
              <div className="ch-sub">Current Month — daily intensity</div>
            </div>
            <div className="hm-legend">
              <span className="hm-swatch" style={{ background: "#dceee4" }} />Low
              <span className="hm-swatch" style={{ background: "var(--sage-l)" }} />Mid
              <span className="hm-swatch" style={{ background: "var(--sage)" }} />High
            </div>
          </div>
          {/* Day labels */}
          <div className="hm-days">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="hm-day">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="hm-grid">
            {heatmapData.map((v, i) => {
              const dayOfMonth = i - firstDayOffset + 1;
              return (
                <div
                  key={i}
                  className={v !== null ? "hm-cell" : ""}
                  style={{
                    position: "relative",
                    paddingBottom: "100%",
                    borderRadius: 6,
                    background: getCellBg(v),
                    cursor: v !== null && v !== -1 ? "pointer" : "default",
                    transition: "transform .2s",
                  }}
                  title={getCellTitle(v, i)}
                  onMouseEnter={e => v !== null && v !== -1 && (e.target.style.transform = "scale(1.2)")}
                  onMouseLeave={e => v !== null && v !== -1 && (e.target.style.transform = "scale(1)")}
                >
                  {v !== null && (
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: getCellTextColor(v),
                        userSelect: "none"
                      }}
                    >
                      {dayOfMonth}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stressors */}
        <div className="card chart-card">
          <div className="ch-ttl" style={{ marginBottom: 3 }}>Stressors Detected</div>
          <div className="ch-sub" style={{ marginBottom: 18 }}>AI-identified patterns</div>
          {dynamicStressors.map((st, i) => (
            <div key={i} className="stressor-row">
              <div className="stressor-top">
                <span className="stressor-lbl">{st.label}</span>
                <span className="stressor-lvl">{st.level}</span>
              </div>
              <div className="stressor-bar">
                <div className="stressor-fill" style={{ width: `${st.pct}%`, background: st.gradient }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Emotional Drivers */}
      <div className="card chart-card fd2" style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="ch-ttl">Your Emotional Drivers 🧠</div>
            <div className="ch-sub">Variance in wellness scores correlated with specific activities</div>
          </div>
          {correlations.isMock && (
            <span className="trend-badge tr-neut" style={{ fontSize: 10.5 }}>
              ✨ Sample Insights (Write more journals to personalize)
            </span>
          )}
        </div>

        <div className="g2-drivers" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {/* Boosters Column */}
          <div>
            <div style={{ fontSize: 13, fontWeight: "600", color: "var(--sage)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📈</span> Top Mood Boosters
            </div>
            {correlations.boosters && correlations.boosters.length > 0 ? (
              <div style={{ height: 140, position: "relative" }}>
                <Bar data={boosterData} options={boosterOptions} />
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--soft)", padding: "24px 12px", textAlign: "center", background: "rgba(0,0,0,0.02)", borderRadius: 10 }}>
                No clear boosters identified yet.
              </div>
            )}
          </div>

          {/* Stressors/Triggers Column */}
          <div>
            <div style={{ fontSize: 13, fontWeight: "600", color: "#c47880", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📉</span> Top Emotional Triggers
            </div>
            {correlations.stressors && correlations.stressors.length > 0 ? (
              <div style={{ height: 140, position: "relative" }}>
                <Bar data={triggerData} options={triggerOptions} />
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--soft)", padding: "24px 12px", textAlign: "center", background: "rgba(0,0,0,0.02)", borderRadius: 10 }}>
                No clear stressors identified yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Wellbeing Prescription */}
      <div className="card chart-card fd3" style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div className="ch-ttl">AI Wellbeing Prescription 💡</div>
            <div className="ch-sub">Dynamically compiled clinical guidelines and therapeutic recommendations</div>
          </div>
          <span className="trend-badge tr-up" style={{ background: "rgba(124,158,138,0.12)", color: "var(--sage)", fontSize: 11 }}>
            ✨ Hyper-Personalized
          </span>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(124,158,138,0.06) 0%, rgba(155,142,196,0.05) 100%)",
          border: "1px solid rgba(124,158,138,0.12)",
          padding: "20px 24px",
          borderRadius: 16,
          lineHeight: "1.7",
          color: "var(--dk)",
          fontSize: "13.5px"
        }}>
          <p style={{ margin: 0, fontWeight: "400", letterSpacing: "0.2px" }}>
            {generatePrescription()}
          </p>
        </div>
      </div>

    </div>
  );
}
