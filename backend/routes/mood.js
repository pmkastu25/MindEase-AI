const router  = require("express").Router();
const auth    = require("../middleware/auth");
const Journal = require("../models/Journal");
const Chat    = require("../models/Chat");

router.get("/stats", auth, async (req,res) => {
  try {
    let rangeDays = 7;
    if (req.query.range === "month" || req.query.range === "30") {
      rangeDays = 30;
    } else if (req.query.range === "year" || req.query.range === "365") {
      rangeDays = 365;
    }

    const since = new Date(Date.now() - rangeDays * 24 * 3600000);

    // Fetch Journals and Chats (role: bot has sentiment/mood score)
    const [journals, chats] = await Promise.all([
      Journal.find({ user: req.user._id, createdAt: { $gte: since } }).sort({ createdAt: 1 }),
      Chat.find({ user: req.user._id, role: "bot", mood: { $exists: true }, createdAt: { $gte: since } }).sort({ createdAt: 1 })
    ]);

    // Combine them into a single sorted timeline
    const allItems = [];
    journals.forEach(j => {
      allItems.push({
        type: "journal",
        score: j.score,
        mood: j.mood?.toLowerCase() || "neutral",
        createdAt: j.createdAt
      });
    });
    chats.forEach(c => {
      allItems.push({
        type: "chat",
        score: c.score || 0.5,
        mood: c.mood?.toLowerCase() || "neutral",
        createdAt: c.createdAt
      });
    });

    allItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Handle no entries gracefully
    if (!allItems.length) {
      const heatmapData = await getHeatmapData(req.user._id);
      return res.json({
        avgScore: 0,
        totalEntries: 0,
        streak: 0,
        dominantMood: null,
        moodHistory: [],
        moodBreakdown: [],
        heatmapData
      });
    }

    // 1. Unified Average Score
    const totalScoreSum = allItems.reduce((sum, item) => sum + item.score, 0);
    const avgScore = totalScoreSum / allItems.length;

    // 2. Helper to map score to mood based on proximity to standard mood scores
    const mapScoreToMood = (score) => {
      const moods = [
        { name: "happy", val: 0.82 },
        { name: "calm", val: 0.72 },
        { name: "neutral", val: 0.52 },
        { name: "anxious", val: 0.3 },
        { name: "sad", val: 0.27 },
        { name: "angry", val: 0.24 }
      ];
      let closest = moods[0];
      let minDiff = Math.abs(score - closest.val);
      for (let i = 1; i < moods.length; i++) {
        const diff = Math.abs(score - moods[i].val);
        if (diff < minDiff) {
          minDiff = diff;
          closest = moods[i];
        }
      }
      return closest.name;
    };

    // 3. Mood Breakdown (Percentages)
    const moodCounts = {};
    allItems.forEach(item => {
      moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
    });
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const totalItemsCount = allItems.length;
    const moodBreakdown = sortedMoods.map(([mood, count]) => ({
      mood,
      pct: Math.round((count / totalItemsCount) * 100)
    }));

    // 4. Mood History (Daily Scores and mapped moods)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = {};

    allItems.forEach(item => {
      const d = new Date(item.createdAt);
      let key;
      if (rangeDays <= 7) {
        key = days[d.getDay()];
      } else if (rangeDays <= 30) {
        key = `${d.getMonth() + 1}/${d.getDate()}`;
      } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        key = months[d.getMonth()];
      }

      if (!dayMap[key]) {
        dayMap[key] = { scores: [], date: key };
      }
      dayMap[key].scores.push(item.score);
    });

    const moodHistory = Object.values(dayMap).map(d => {
      const avgScore = d.scores.reduce((s, x) => s + x, 0) / d.scores.length;
      const domMood = mapScoreToMood(avgScore);
      return {
        date: d.date,
        score: avgScore,
        mood: domMood
      };
    });

    // 5. Calculate Dominant Mood (based on the average of the day's score)
    const todayStr = new Date().toDateString();
    const todayItems = allItems.filter(item => new Date(item.createdAt).toDateString() === todayStr);
    let dominantMood = null;
    if (todayItems.length > 0) {
      const todayAvg = todayItems.reduce((sum, item) => sum + item.score, 0) / todayItems.length;
      dominantMood = mapScoreToMood(todayAvg);
    } else {
      // Fallback: take the latest active day in the history
      const latestDay = moodHistory[moodHistory.length - 1];
      dominantMood = latestDay ? latestDay.mood : null;
    }

    // 5. Total Entries logged in database (journals only, as requested)
    const totalEntries = await Journal.countDocuments({ user: req.user._id });

    // 6. Streak calculation (Journals or Chats)
    const [allJ, allC] = await Promise.all([
      Journal.find({ user: req.user._id }, "createdAt"),
      Chat.find({ user: req.user._id, role: "bot", mood: { $exists: true } }, "createdAt")
    ]);
    
    const activityDays = new Set();
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    allJ.forEach(j => activityDays.add(normalizeDate(j.createdAt)));
    allC.forEach(c => activityDays.add(normalizeDate(c.createdAt)));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    if (!activityDays.has(checkDate.getTime())) {
      checkDate.setDate(today.getDate() - 1);
    }

    while (activityDays.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 7. Heatmap Data for current month
    const heatmapData = await getHeatmapData(req.user._id);

    // 8. Mood Booster Keyword Correlation Engine
    const correlations = await calculateMoodCorrelations(req.user._id, avgScore);

    res.json({
      avgScore,
      totalEntries,
      streak,
      dominantMood,
      moodHistory,
      moodBreakdown,
      heatmapData,
      correlations
    });

  } catch(e) { 
    res.status(500).json({ message: e.message }); 
  }
});

async function getHeatmapData(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const [mJournals, mChats] = await Promise.all([
    Journal.find({ user: userId, createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
    Chat.find({ user: userId, role: "bot", mood: { $exists: true }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
  ]);

  const dailyScores = {};
  const addDaily = (date, score) => {
    const d = new Date(date);
    const day = d.getDate();
    if (!dailyScores[day]) dailyScores[day] = [];
    dailyScores[day].push(score);
  };

  mJournals.forEach(j => addDaily(j.createdAt, j.score));
  mChats.forEach(c => addDaily(c.createdAt, c.score || 0.5));

  const startDayOfWeek = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const heatmap = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    heatmap.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const scores = dailyScores[day];
    if (scores && scores.length > 0) {
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
      heatmap.push(Number(avg.toFixed(2)));
    } else {
      heatmap.push(-1);
    }
  }

  const totalCells = heatmap.length;
  const remaining = totalCells % 7;
  if (remaining !== 0) {
    for (let i = 0; i < (7 - remaining); i++) {
      heatmap.push(null);
    }
  }

  return heatmap;
}

async function calculateMoodCorrelations(userId, overallAvgScore) {
  try {
    const journals = await Journal.find({ user: userId });
    
    const categories = {
      "Family & Friends": ["family", "friends", "mom", "dad", "sister", "brother", "friend", "date", "talked", "called", "dinner", "girlfriend", "boyfriend", "husband", "wife", "son", "daughter"],
      "Exercise & Activity": ["exercise", "workout", "gym", "run", "running", "jog", "yoga", "walk", "walking", "swim", "swimming", "cardio", "stretch", "training", "sport", "football", "basketball", "soccer"],
      "Work & Studies": ["work", "office", "study", "exam", "coding", "code", "deadline", "project", "assignment", "meeting", "class", "school", "college", "university", "career", "boss", "colleague"],
      "Rest & Sleep": ["sleep", "nap", "rest", "slept", "tired", "relax", "meditate", "meditation", "dream", "bed", "peaceful", "unwind", "recovery"],
      "Nature & Outdoors": ["nature", "park", "garden", "outside", "hiking", "hike", "sunshine", "beach", "forest", "mountain", "trees", "outdoors", "green", "fresh air"]
    };

    const mockCorrelations = {
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

    if (!journals || journals.length === 0) {
      return mockCorrelations;
    }

    const calculated = [];
    for (const [category, keywords] of Object.entries(categories)) {
      const matches = journals.filter(j => {
        const text = (j.text || "").toLowerCase();
        return keywords.some(kw => {
          if (kw.includes(" ")) {
            return text.includes(kw);
          }
          const regex = new RegExp(`\\b${kw}\\b`, "i");
          return regex.test(text);
        });
      });
      
      if (matches.length > 0) {
        const avg = matches.reduce((sum, j) => sum + j.score, 0) / matches.length;
        const variance = avg - overallAvgScore;
        calculated.push({
          category,
          variance: Number(variance.toFixed(3)),
          count: matches.length
        });
      }
    }

    if (calculated.length < 2) {
      return mockCorrelations;
    }

    const boosters = calculated.filter(c => c.variance >= 0).sort((a, b) => b.variance - a.variance);
    const stressors = calculated.filter(c => c.variance < 0).sort((a, b) => a.variance - b.variance);

    return {
      isMock: false,
      boosters,
      stressors
    };
  } catch (error) {
    console.error("Error in calculateMoodCorrelations:", error);
    return {
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
  }
}

module.exports = router;
