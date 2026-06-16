import { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Resources.css";

const RESOURCES = {
  all: [
    { emoji: "🧘", tag: "Mindfulness", title: "5-Minute Morning Grounding Ritual", desc: "Start your day anchored. Simple body-scan and breath awareness to reduce anxiety.", read: "5 min read", cat: "mindfulness", link: "https://insighttimer.com/meditation-topics/grounding", ytLink: "https://www.youtube.com/watch?v=9GWnQXVEiJM" },
    { emoji: "🧠", tag: "CBT Technique", title: "Cognitive Restructuring: Change Your Inner Dialogue", desc: "Identify and challenge distorted thoughts that fuel anxiety and depression.", read: "8 min read", cat: "cbt", link: "https://www.therapistaid.com/therapy-guide/cognitive-restructuring", ytLink: "https://www.youtube.com/watch?v=5zuv4DD0BO4" },
    { emoji: "😴", tag: "Sleep & Recovery", title: "Sleep Hygiene for Mental Clarity", desc: "Evidence-backed routines to improve sleep quality and emotional resilience.", read: "6 min read", cat: "mindfulness", link: "https://www.sleepfoundation.org/sleep-hygiene", ytLink: "https://www.youtube.com/watch?v=JaRGJVrJBQ8" },
    { emoji: "🫂", tag: "Anxiety", title: "Managing Social Anxiety with Gradual Exposure", desc: "Step-by-step approach to build confidence in social situations comfortably.", read: "10 min read", cat: "anxiety", link: "https://www.verywellmind.com/practice-social-anxiety-disorder-exposure-therapy-3024845", ytLink: "https://www.youtube.com/watch?v=ikcYECIQeqA" },
    { emoji: "🌱", tag: "Self-Compassion", title: "Talking to Yourself with Kindness", desc: "Kristin Neff's self-compassion practices for reducing self-criticism and shame.", read: "7 min read", cat: "mindfulness", link: "https://self-compassion.org/category/exercises/", ytLink: "https://www.youtube.com/watch?v=LX71ZTAsmg8" },
    { emoji: "🎵", tag: "Relaxation", title: "Guided Visualization for Stress Relief", desc: "15-minute audio journey to calm your nervous system and restore balance.", read: "15 min audio", cat: "anxiety", link: "https://www.youtube.com/results?search_query=guided+visualization+for+stress+relief", ytLink: "https://www.youtube.com/watch?v=TWI639oEzmE" },
    { emoji: "🌊", tag: "CBT Technique", title: "Behavioural Activation for Low Mood", desc: "Break the cycle of low mood by scheduling meaningful, enjoyable activities.", read: "9 min read", cat: "cbt", link: "https://www.mind.org.uk/information-support/drugs-and-treatments/talking-therapy-and-counselling/cognitive-behavioural-therapy-cbt/", ytLink: "https://www.youtube.com/watch?v=KFmn2G1asbg" },
    { emoji: "🫁", tag: "Anxiety", title: "4-7-8 Breathing: Your Calm Switch", desc: "The science behind this powerful breath technique and how to make it a daily habit.", read: "4 min read", cat: "anxiety", link: "https://www.healthline.com/health/4-7-8-breathing", ytLink: "https://www.youtube.com/watch?v=p8fjYPC-k2k" },
    { emoji: "📔", tag: "CBT Technique", title: "Thought Records: Tracking Your Mind", desc: "Use a structured journal approach to notice, challenge and reframe unhelpful thoughts.", read: "11 min read", cat: "cbt", link: "https://www.psychologytools.com/resource/cbt-thought-record/", ytLink: "https://www.youtube.com/watch?v=3VIL1L_ypMg" },
  ],
};

const TIPS = [
  { emoji: "💭", text: "Name your emotions. Labelling feelings activates the prefrontal cortex, calming the amygdala." },
  { emoji: "🌿", text: "Spending 20 minutes in nature can significantly lower cortisol and improve your mood." },
  { emoji: "🤝", text: "Social connection is a basic human need. Even a short conversation can lift your spirits." },
  { emoji: "💤", text: "Sleep is the brain's emotional reset button. Prioritise 7–9 hours per night." },
];

const EXPANDED_CONTENT = {
  "5-Minute Morning Grounding Ritual": "Find a comfortable seated position and close your eyes. Take three slow, deep breaths — inhaling through your nose and exhaling through your mouth. Starting at the top of your head, slowly scan downward through your body. Notice any tension or discomfort without judgment. Breathe gently into each area, imagining warmth and softness releasing any tightness. Continue down to your feet. Open your eyes and set one gentle intention for the day ahead.",
  "Cognitive Restructuring: Change Your Inner Dialogue": "Step 1: Catch the thought — write down the automatic negative thought exactly as it appeared. Step 2: Rate your belief (0–100%). Step 3: List all evidence SUPPORTING the thought. Step 4: List all evidence AGAINST the thought. Step 5: Write a more balanced, realistic perspective. Step 6: Re-rate your belief. With practice, this becomes a natural mental habit.",
  "4-7-8 Breathing: Your Calm Switch": "Exhale completely through your mouth with a whoosh sound. Close your mouth and inhale quietly through your nose for exactly 4 counts. Hold your breath for 7 counts. Exhale completely through your mouth for 8 counts. This constitutes one full cycle. Repeat 3–4 times. The extended exhale activates your parasympathetic nervous system, counteracting the stress response.",
  "Managing Social Anxiety with Gradual Exposure": "Create a fear ladder — list situations from least to most anxiety-provoking. Start with the easiest step and stay in the situation until anxiety reduces by at least 50%. Repeat until it no longer causes significant anxiety, then move to the next step. Celebrate every step forward, however small. Progress matters more than speed.",
};

const FEATURED_BY_MOOD = {
  anxious: {
    emoji: "🌊",
    title: "The Art of Emotional Regulation",
    desc: "Discover evidence-based strategies from CBT and mindfulness research to understand, accept, and gently guide your anxiety.",
    time: "12",
    readLink: "https://www.anxietycanada.com/",
    listenLink: "https://www.youtube.com/watch?v=ikcYECIQeqA"
  },
  anxiety: {
    emoji: "🌊",
    title: "The Art of Emotional Regulation",
    desc: "Discover evidence-based strategies from CBT and mindfulness research to understand, accept, and gently guide your anxiety.",
    time: "12",
    readLink: "https://www.anxietycanada.com/",
    listenLink: "https://www.youtube.com/watch?v=ikcYECIQeqA"
  },
  sad: {
    emoji: "🌅",
    title: "Navigating Low Mood with Compassion",
    desc: "Learn about behavioural activation and self-compassion techniques to slowly rebuild your energy and motivation.",
    time: "15",
    readLink: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/depression/about-depression/",
    listenLink: "https://www.youtube.com/watch?v=KFmn2G1asbg"
  },
  sadness: {
    emoji: "🌅",
    title: "Navigating Low Mood with Compassion",
    desc: "Learn about behavioural activation and self-compassion techniques to slowly rebuild your energy and motivation.",
    time: "15",
    readLink: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/depression/about-depression/",
    listenLink: "https://www.youtube.com/watch?v=KFmn2G1asbg"
  },
  angry: {
    emoji: "🍃",
    title: "De-escalating Anger and Frustration",
    desc: "Understand the root causes of anger and practice techniques to pause, breathe, and respond rather than react.",
    time: "10",
    readLink: "https://www.apa.org/topics/anger/control",
    listenLink: "https://www.youtube.com/watch?v=5zuv4DD0BO4"
  },
  calm: {
    emoji: "🌱",
    title: "Cultivating Deep Rest and Presence",
    desc: "Your mood is steady. It's a perfect time to deepen your mindfulness practice and build long-term resilience.",
    time: "8",
    readLink: "https://www.mindful.org/meditation/mindfulness-getting-started/",
    listenLink: "https://www.youtube.com/watch?v=9GWnQXVEiJM"
  },
  happy: {
    emoji: "☀️",
    title: "Sustaining Joy and Gratitude",
    desc: "Explore gratitude practices that help you savor positive moments and build a reservoir of positive energy.",
    time: "5",
    readLink: "https://positivepsychology.com/gratitude-exercises/",
    listenLink: "https://www.youtube.com/watch?v=TWI639oEzmE"
  },
  joy: {
    emoji: "☀️",
    title: "Sustaining Joy and Gratitude",
    desc: "Explore gratitude practices that help you savor positive moments and build a reservoir of positive energy.",
    time: "5",
    readLink: "https://positivepsychology.com/gratitude-exercises/",
    listenLink: "https://www.youtube.com/watch?v=T_QBRfxi_t4"
  },
  neutral: {
    emoji: "🧭",
    title: "Checking In With Yourself",
    desc: "A balanced state is a great opportunity to explore thought records and understand your baseline emotional patterns.",
    time: "10",
    readLink: "https://www.psychologytools.com/resource/cbt-thought-record/",
    listenLink: "https://www.youtube.com/watch?v=3VIL1L_ypMg"
  }
};

export default function Resources() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [avgScore, setAvgScore] = useState(null);
  const [dominantMood, setDominantMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get(`/mood/stats?range=week`);
        console.log(s);
        setAvgScore(s?.avgScore ?? 0.5);
        setDominantMood(s?.dominantMood ?? "neutral");
        setMoodHistory(s?.moodHistory ?? []);
      } catch (err) {
        console.log("Error fetching stats:", err);
        setAvgScore(0.5);
        setDominantMood("neutral");
      }
    })();
  }, []);

  const filtered = activeFilter === "all"
    ? RESOURCES.all
    : RESOURCES.all.filter(r => r.cat === activeFilter);

  // ── Average mood of the day = dominant mood from the stats API
  // All banner content is now mood-label driven, not score-threshold driven
  const MOOD_BANNERS = {
    happy: {
      emoji: "🌟",
      title: "You're Radiating Positivity Today!",
      text: "Your average mood today is happy and uplifted. Channel this energy into creative pursuits, gratitude journaling, or deepening your mindfulness practice to sustain this beautiful state.",
      border: "rgba(124,158,138,.28)",
      bg: "linear-gradient(135deg, rgba(124,158,138,.09), rgba(168,196,176,.06))",
    },
    joy: {
      emoji: "☀️",
      title: "What a Joyful Day You're Having!",
      text: "Joy is your dominant mood today. Savour it fully — research shows that consciously appreciating positive emotions builds lasting emotional resilience. Explore our gratitude practices below.",
      border: "rgba(124,158,138,.28)",
      bg: "linear-gradient(135deg, rgba(124,158,138,.09), rgba(232,200,112,.06))",
    },
    calm: {
      emoji: "🌊",
      title: "A Day of Calm and Clarity",
      text: "Your average mood today is calm and grounded. This peaceful state is ideal for reflection, deep breathing, and building long-term resilience. Explore mindfulness resources below.",
      border: "rgba(138,180,200,.28)",
      bg: "linear-gradient(135deg, rgba(138,180,200,.09), rgba(155,142,196,.06))",
    },
    neutral: {
      emoji: "🧭",
      title: "Balanced and Steady Today",
      text: "Your mood today is balanced and neutral. Use this stable foundation to check in with yourself, try a thought record, or explore what subtle shifts might help you thrive even more.",
      border: "rgba(143,166,154,.22)",
      bg: "linear-gradient(135deg, rgba(143,166,154,.07), rgba(220,238,228,.06))",
    },
    anxious: {
      emoji: "🫁",
      title: "Your Mood Today Shows Anxiety — Let's Ease It",
      text: "Your average mood today reflects anxiety and tension. You're not alone in this. Try the 4-7-8 breathing technique, a grounding exercise, or the guided visualizations below — even 5 minutes can shift your nervous system.",
      border: "rgba(196,160,96,.28)",
      bg: "linear-gradient(135deg, rgba(196,160,96,.08), rgba(240,208,144,.06))",
    },
    anxiety: {
      emoji: "🫁",
      title: "Anxiety Is Your Dominant Mood Today",
      text: "Your average mood today reflects heightened anxiety. Remember: anxiety is your body protecting you, but it can be gently regulated. Explore our breathing and CBT resources below.",
      border: "rgba(196,160,96,.28)",
      bg: "linear-gradient(135deg, rgba(196,160,96,.08), rgba(240,208,144,.06))",
    },
    sad: {
      emoji: "🌧️",
      title: "It's Okay to Have a Heavy Day",
      text: "Your average mood today reflects sadness or low energy. Be deeply kind to yourself. Small steps matter — try behavioural activation, a self-compassion exercise, or simply rest. You don't have to push through alone.",
      border: "rgba(155,142,196,.28)",
      bg: "linear-gradient(135deg, rgba(155,142,196,.09), rgba(196,185,232,.06))",
    },
    sadness: {
      emoji: "🌧️",
      title: "A Heavy Mood Today — Kindness First",
      text: "Sadness is your average mood today. This is valid and human. Gentle activities like walking, journaling, or connecting with someone you trust can help. Explore our low-mood resources below.",
      border: "rgba(155,142,196,.28)",
      bg: "linear-gradient(135deg, rgba(155,142,196,.09), rgba(196,185,232,.06))",
    },
    angry: {
      emoji: "🍃",
      title: "Frustration and Tension Detected Today",
      text: "Anger is your dominant mood today. It signals an unmet need or boundary. Try pausing with a brisk walk or the grounding exercises below before revisiting what's triggering this feeling.",
      border: "rgba(196,120,128,.28)",
      bg: "linear-gradient(135deg, rgba(196,120,128,.08), rgba(245,213,215,.06))",
    },
    depression: {
      emoji: "💙",
      title: "We See You — You Are Not Alone",
      text: "Your average mood today reflects depression. Please know that help is always available, and what you're feeling is real and valid. Explore our compassion resources, talk to someone you trust, or reach out to a professional.",
      border: "rgba(122,95,160,.32)",
      bg: "linear-gradient(135deg, rgba(122,95,160,.10), rgba(196,185,232,.07))",
    },
    suicidal: {
      emoji: "💙",
      title: "You Matter — Please Reach Out",
      text: "Your mood today is in a very difficult place. You are not alone and your life has immeasurable value. Please use the crisis contacts below or speak to a therapist immediately. You deserve care and support right now.",
      border: "rgba(192,64,112,.35)",
      bg: "linear-gradient(135deg, rgba(192,64,112,.10), rgba(245,213,224,.08))",
    },
  };

  const MOOD_TIPS = {
    happy:   [
      { emoji: "🌟", text: "Savour positive moments — consciously appreciating joy expands emotional resilience." },
      { emoji: "📔", text: "Write down 3 things you're grateful for to lock in this positive state." },
      { emoji: "🤝", text: "Spread the positivity — social connection amplifies good moods for everyone involved." },
      { emoji: "🌱", text: "A happy mind is a learning mind. Try something new or creative today." },
    ],
    joy:     [
      { emoji: "☀️", text: "Joy is worth savouring. Pause and fully notice what's making you feel this way." },
      { emoji: "📔", text: "Gratitude journaling during joyful periods builds lasting emotional uplift." },
      { emoji: "🤝", text: "Share your good mood — it's contagious and strengthens social bonds." },
      { emoji: "🎵", text: "Music and movement amplify joy — put on your favourite song right now." },
    ],
    calm:    [
      { emoji: "🌿", text: "Your calm state is precious. Use it for reflection or deep work." },
      { emoji: "🧘", text: "Deepen your mindfulness practice — calm is the perfect foundation." },
      { emoji: "📔", text: "Journal about what's contributing to this balanced state today." },
      { emoji: "💤", text: "Protect your sleep tonight to maintain this emotional stability." },
    ],
    neutral: [
      { emoji: "💭", text: "Name your emotions. Labelling feelings activates the prefrontal cortex." },
      { emoji: "🧭", text: "A neutral day is an opportunity — what small thing would lift your spirits?" },
      { emoji: "🤝", text: "Even a short conversation can shift a neutral mood positively." },
      { emoji: "🌿", text: "20 minutes in nature can significantly lower cortisol and brighten your mood." },
    ],
    anxious: [
      { emoji: "🫁", text: "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 3 times." },
      { emoji: "🌿", text: "Name 5 things you can see right now. Grounding pulls you back to the present." },
      { emoji: "💤", text: "Anxiety disrupts sleep. A dark, screen-free bedroom helps your body reset." },
      { emoji: "🤝", text: "Sharing anxiety with a trusted person reduces its intensity significantly." },
    ],
    anxiety: [
      { emoji: "🫁", text: "Box breathing (4-4-4-4) activates your parasympathetic nervous system instantly." },
      { emoji: "🌿", text: "Ground yourself: feel your feet on the floor, take 3 slow breaths." },
      { emoji: "💭", text: "Challenge anxious thoughts: What's the evidence? What would a friend say?" },
      { emoji: "🤝", text: "You don't have to face anxiety alone. Reach out to someone today." },
    ],
    sad:     [
      { emoji: "💙", text: "Sadness is valid information — not weakness. Be as kind to yourself as you would to a friend." },
      { emoji: "🌿", text: "A short walk outside can ease low mood, even for just 10 minutes." },
      { emoji: "🫂", text: "Connection helps. Text or call someone you feel safe with today." },
      { emoji: "💤", text: "Rest is productive. Sleep is your brain's emotional reset button — honour it." },
    ],
    sadness: [
      { emoji: "💙", text: "Feelings of sadness always pass — you are not your lowest moments." },
      { emoji: "🌿", text: "Nature has a measurable effect on low mood. Even opening a window helps." },
      { emoji: "📔", text: "Write without judgment — putting words to sadness lightens the emotional load." },
      { emoji: "🤝", text: "Reaching out is an act of courage. Someone who cares about you wants to hear from you." },
    ],
    angry:   [
      { emoji: "🍃", text: "Pause before reacting. Even 90 seconds allows the anger wave to begin subsiding." },
      { emoji: "🏃", text: "Physical movement safely discharges angry energy — try a brisk 5-minute walk." },
      { emoji: "💭", text: "Anger often hides hurt or fear. Ask yourself: what unmet need is underneath this?" },
      { emoji: "🫁", text: "Slow, extended exhales calm the nervous system faster than any other technique." },
    ],
    depression: [
      { emoji: "💙", text: "Depression is an illness, not a character flaw. You deserve care and treatment." },
      { emoji: "🫂", text: "One small step is enough for today. Getting out of bed IS progress." },
      { emoji: "🌿", text: "Natural light — even briefly — can lift depressive symptoms meaningfully." },
      { emoji: "🤝", text: "Please talk to a professional. Therapy and support make a real difference." },
    ],
    suicidal: [
      { emoji: "💙", text: "You are not alone. Trained support is available right now — please reach out." },
      { emoji: "🆘", text: "Call Vandrevala Foundation: 1860-2662-345 (free, 24/7, confidential)." },
      { emoji: "🫂", text: "Your pain is real and temporary. Please give yourself the chance for things to change." },
      { emoji: "🌿", text: "iCall helpline: 9152987821 — trained counsellors are waiting to listen." },
    ],
  };

  const mood = dominantMood?.toLowerCase() || "neutral";
  const banner = MOOD_BANNERS[mood] || MOOD_BANNERS.neutral;
  const tips = MOOD_TIPS[mood] || MOOD_TIPS.neutral;

  const moodContent = avgScore !== null ? banner : null;

  return (
    <div className="resources-page">
      {/* Header */}
      <div className="pt-row fade-up">
        <h2 className="section-title">Wellness <span>Library</span></h2>
        <div className="filter-group">
          {[
            { key: "all", label: "All" },
            { key: "mindfulness", label: "🧘 Mindfulness" },
            { key: "anxiety", label: "💆 Anxiety" },
            { key: "cbt", label: "🧠 CBT" },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {moodContent && (
        <div className="mood-based-banner fade-up" style={{
          background: moodContent.bg,
          border: `1.5px solid ${moodContent.border}`,
          padding: "1.5rem",
          borderRadius: "18px",
          marginBottom: "2rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "2.8rem", flexShrink: 0, lineHeight: 1 }}>{moodContent.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: "0.45rem" }}>
              <h3 style={{ margin: 0, color: "var(--dk)", fontSize: "1.12rem", fontFamily: "'Playfair Display', serif" }}>{moodContent.title}</h3>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase",
                padding: "3px 10px", borderRadius: 20,
                background: moodContent.border.replace(/,[^,]+\)$/, ", 0.18)"),
                color: "var(--dk)"
              }}>
                Avg. Mood · {(dominantMood || "neutral").toUpperCase()}
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--mid)", lineHeight: "1.6", fontSize: "13px" }}>{moodContent.text}</p>
          </div>
        </div>
      )}

      {/* Featured banner */}
      {(() => {
        const featured = FEATURED_BY_MOOD[dominantMood?.toLowerCase()] || FEATURED_BY_MOOD.neutral;
        return (
          <div className="featured-banner fd1">
            <div className="feat-emoji">{featured.emoji}</div>
            <div className="feat-content">
              <div className="feat-tag">Featured · Recommended for You</div>
              <div className="feat-title">{featured.title}</div>
              <div className="feat-desc">
                {featured.desc}
              </div>
              <div className="feat-actions">
                <button className="btn-pr" onClick={() => window.open(featured.readLink, "_blank")}>📖 Start Reading</button>
                <button className="btn-out" onClick={() => window.open(featured.listenLink, "_blank")}>🎵 Listen instead</button>
              </div>
            </div>
            <div className="feat-badge">
              <div className="feat-badge-num">{featured.time}</div>
              <div className="feat-badge-lbl">min</div>
            </div>
          </div>
        );
      })()}

      {/* Quick tips strip — dynamically based on dominant mood */}
      <div className="tips-strip fd1">
        {tips.map((tip, i) => (
          <div key={i} className="tip-card">
            <span className="tip-emoji">{tip.emoji}</span>
            <p className="tip-text">{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Resource grid */}
      <div className="resource-grid fd2">
        {filtered.map((res, i) => (
          <div
            key={i}
            className={`card resource-card ${expanded === i ? "expanded" : ""}`}
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="res-icon">{res.emoji}</div>
            <div className="res-tag">{res.tag}</div>
            <h3 className="res-title">{res.title}</h3>
            <p className="res-desc">{res.desc}</p>
            <div className="res-read">→ {res.read}</div>

            {expanded === i && (
              <div className="res-expanded">
                <p className="res-expanded-text">
                  {EXPANDED_CONTENT[res.title] || "This evidence-based practice has been shown to be effective across many clinical settings. Start slowly and be gentle with yourself. Consistency matters more than perfection — even 5 minutes daily creates meaningful change over time."}
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "0.85rem" }}>
                  <button
                    className="btn-pr"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (res.ytLink) {
                        window.open(res.ytLink, "_blank");
                      }
                    }}
                  >
                    ▶️ Start Practice
                  </button>
                  <button
                    className="btn-out"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (res.link) {
                        window.open(res.link, "_blank");
                      }
                    }}
                  >
                    📖 See Article
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Crisis card */}
      <div className="crisis-card fd3">
        <div className="crisis-icon">🆘</div>
        <div style={{ flex: 1 }}>
          <div className="crisis-title">If you're in crisis or feel unsafe</div>
          <div className="crisis-text">
            Please reach out immediately. You are not alone, and support is available right now.
          </div>
          <div className="crisis-links">
            <a className="crisis-link" href="tel:9152987821">iCall: 9152987821</a>
            <a className="crisis-link" href="tel:18602662345">Vandrevala: 1860-2662-345</a>
            <a className="crisis-link" href="https://www.nimhans.ac.in" target="_blank" rel="noreferrer">NIMHANS Helpline</a>
          </div>
        </div>
      </div>
    </div>
  );
}
