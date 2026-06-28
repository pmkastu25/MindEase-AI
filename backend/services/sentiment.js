const axios = require("axios");

const SUGGESTIONS = {
  greet: "I'm here to support you. Feel free to check in by selecting an emotion or writing a journal entry.",
  happy: "Your positivity is wonderful! Savour this feeling and consider gratitude journaling.",
  calm: "This grounded state is precious. Use this clarity to reflect or plan something meaningful.",
  sad: "It's okay to feel sad. Offer yourself the kindness you would give a dear friend.",
  anxious: "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Then name 5 things you can see.",
  angry: "Anger signals an unmet need. Brisk movement helps process this energy safely.",
  neutral: "A balanced state is a good foundation. Check in — is there anything needing attention?",
};

const isKeywordNegated = (text, keyword) => {
  const l = text.toLowerCase();
  const kwIdx = l.indexOf(keyword.toLowerCase());
  if (kwIdx === -1) return false;

  // Search context of preceding 35 characters
  const startIdx = Math.max(0, kwIdx - 35);
  const precedingText = l.slice(startIdx, kwIdx);

  const negationWords = [
    "not", "no", "never", "don't", "doesn't", "didn't", "wasn't", "weren't",
    "isn't", "aren't", "haven't", "hadn't", "won't", "can't", "cannot",
    "without", "free of", "free from", "hardly", "scarcely", "barely", "lack"
  ];

  const negWordMatch = negationWords.find(word => {
    const reg = new RegExp(`\\b${word}\\b`, 'i');
    return reg.test(precedingText);
  });

  if (!negWordMatch) return false;

  const negIdx = precedingText.lastIndexOf(negWordMatch);
  const textBetween = precedingText.slice(negIdx + negWordMatch.length);

  // If a clause boundary is present, the negation word's scope doesn't cross it
  const hasBoundary = /[,.;!?]|\b(but|yet|however|nevertheless|although|though)\b/i.test(textBetween);
  return !hasBoundary;
};

const ruleBased = (text) => {
  const l = text.toLowerCase();

  if (l.match(/\b(suicid|kill myself|end my life|don't want to live|not worth living|self.harm|hurt myself|cutting|self.destruct)\b/))
    return { mood: "suicidal", score: -1, emotions: ["crisis"], is_crisis: true };

  if (l.match(/^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|wassup|yo|hii|heyy)(?:\s|[.!?]|$)/i))
    return { mood: "greet", score: 0, emotions: ["neutral"] };

  const categories = [
    {
      mood: "happy",
      score: 1,
      keywords: ["happy", "joy", "wonderful", "excited", "love", "great", "fantastic", "smile", "smiling", "good", "best", "perfect", "grateful", "hopeful", "optimistic", "confident", "motivated", "enjoy", "enjoyed", "laugh", "laughing", "forward", "progress"]
    },
    {
      mood: "calm",
      score: 1,
      keywords: ["calm", "peace", "peaceful", "relax", "relaxed", "content", "serene", "satisfied", "relieved", "quiet"]
    },
    {
      mood: "sad",
      score: -1,
      keywords: ["sad", "depress", "depressed", "cry", "crying", "lonely", "hurt", "hopeless", "heartbroke", "breakup", "grief", "mourn", "miserable", "unhappy", "terrible", "disaster"]
    },
    {
      mood: "anxious",
      score: -1,
      keywords: ["anxi", "anxious", "stress", "worry", "worried", "nervous", "panic", "overwhelm", "scared", "afraid", "tension", "fear", "overthinking"]
    },
    {
      mood: "angry",
      score: -1,
      keywords: ["angry", "furious", "frustrated", "mad", "rage", "fight", "argument", "quarrel", "conflict", "clash", "disagree", "dispute", "annoy"]
    }
  ];

  let latestMatch = null;

  categories.forEach(cat => {
    cat.keywords.forEach(kw => {
      let idx = l.lastIndexOf(kw);
      while (idx !== -1) {
        // Enforce custom word boundary checks
        const startBoundary = idx === 0 || /[^a-z0-9]/i.test(l[idx - 1]);
        const endBoundary = (idx + kw.length) === l.length || /[^a-z0-9]/i.test(l[idx + kw.length]);
        
        if (startBoundary && endBoundary && !isKeywordNegated(l, kw)) {
          if (!latestMatch || idx > latestMatch.idx) {
            latestMatch = { mood: cat.mood, score: cat.score, idx };
          }
          break;
        }
        idx = l.lastIndexOf(kw, idx - 1);
      }
    });
  });

  if (latestMatch) {
    return { mood: latestMatch.mood, score: latestMatch.score, emotions: [latestMatch.mood] };
  }

  return { mood: "neutral", score: 0, emotions: ["neutral"] };
};

const analyze = async (text) => {
  const ruleRes = ruleBased(text);

  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5000";
    const res = await axios.post(
      `${mlServiceUrl}/analyze`,
      { text },
      { timeout: 5000 }
    );

    const d = res.data.analysis || res.data;
    console.log("Hello, analyzing....");

    let finalMood = d.mood;
    let finalScore = d.score;
    let finalState = d.mental_state;
    let isCrisis = res.data.is_crisis || d.is_crisis || false;
    let crisisLabel = res.data.crisis_label || d.crisis_label || null;

    // Severe crisis (Suicidal) takes absolute precedence
    const isSevereCrisis = isCrisis && (crisisLabel === "Suicidal" || ruleRes.mood === "suicidal");

    // HYBRID OVERRIDE:
    // Case 1: ML predicts Happy/Neutral, but Rules detect clear explicit Negative mood (override to Negative)
    // Case 2: ML predicts Negative/Neutral/Depression, but Rules detect clear non-negated Positive/Calm mood (override to Positive/Calm)
    if (!isSevereCrisis) {
      if ((finalMood === "happy" || finalMood === "neutral") && (ruleRes.mood === "sad" || ruleRes.mood === "anxious" || ruleRes.mood === "angry")) {
        console.log(`⚠️ Hybrid Override (Case 1): Overriding ML mood '${finalMood}' with explicit negative mood '${ruleRes.mood}'`);
        finalMood = ruleRes.mood;
        finalScore = ruleRes.score;
        finalState = ruleRes.mood.charAt(0).toUpperCase() + ruleRes.mood.slice(1);
        isCrisis = false;
        crisisLabel = null;
      } else if ((finalMood === "sad" || finalMood === "anxious" || finalMood === "angry" || finalMood === "neutral" || finalState === "Depression") && (ruleRes.mood === "happy" || ruleRes.mood === "calm")) {
        console.log(`⚠️ Hybrid Override (Case 2): Overriding ML mood '${finalMood}' / state '${finalState}' with explicit positive/calm mood '${ruleRes.mood}'`);
        finalMood = ruleRes.mood;
        finalScore = ruleRes.score;
        finalState = ruleRes.mood.charAt(0).toUpperCase() + ruleRes.mood.slice(1);
        isCrisis = false;
        crisisLabel = null;
      } else {
        const getScoreFromMood = (mood) => {
          const m = (mood || "").toLowerCase();
          if (m === "happy" || m === "calm" || m === "joy") return 1;
          if (m === "neutral" || m === "greet" || m === "normal") return 0;
          return -1;
        };
        finalScore = getScoreFromMood(finalMood);
      }
    }

    if (isCrisis) {
      console.log(`🚨 CRISIS MIDDLEWARE TRIGGERED: ML predicted '${crisisLabel}' — crisis flag active.`);
    }

    return {
      mood: finalMood,
      score: finalScore,
      mental_state: finalState,
      is_crisis: isCrisis,
      crisis_label: crisisLabel,
      suggestion: SUGGESTIONS[finalMood] || SUGGESTIONS.neutral
    };

  } catch (err) {
    console.log("ML service failed, using fallback");
    console.log(err.message);

    return {
      ...ruleRes,
      is_crisis: ruleRes.is_crisis || false,
      suggestion: SUGGESTIONS[ruleRes.mood] || SUGGESTIONS.neutral
    };
  }
};

module.exports = {
  analyze,
  getSuggestion: (m) => SUGGESTIONS[m] || SUGGESTIONS.neutral
};