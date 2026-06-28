const axios = require("axios");

const SUGGESTIONS = {
  greet:   "I'm here to support you. Feel free to check in by selecting an emotion or writing a journal entry.",
  happy:   "Your positivity is wonderful! Savour this feeling and consider gratitude journaling.",
  calm:    "This grounded state is precious. Use this clarity to reflect or plan something meaningful.",
  sad:     "It's okay to feel sad. Offer yourself the kindness you would give a dear friend.",
  anxious: "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Then name 5 things you can see.",
  angry:   "Anger signals an unmet need. Brisk movement helps process this energy safely.",
  neutral: "A balanced state is a good foundation. Check in — is there anything needing attention?",
};

const ruleBased = (text) => {

  const l = text.toLowerCase();

  if (l.match(/suicid|kill myself|end my life|don't want to live|not worth living|self.harm|hurt myself|cutting|self.destruct/))
    return { mood:"suicidal", score:.08, emotions:["crisis"], is_crisis: true };

  if (l.match(/^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|wassup|yo|hii|heyy)(?:\s|[.!?]|$)/i))
    return { mood:"greet", score:.5, emotions:["neutral"] };

  if (l.match(/happy|joy|wonderful|excited|love|great|fantastic/))
    return { mood:"happy", score:.82, emotions:["joy","happiness"] };

  if (l.match(/sad|depress|cry|lonely|hurt|hopeless|heartbroke|breakup|grief|mourn/))
    return { mood:"sad", score:.27, emotions:["sadness"] };

  if (l.match(/anxi|stress|worry|nervous|panic|overwhelm|scared|afraid|tension|fear/))
    return { mood:"anxious", score:.3, emotions:["anxiety","worry"] };

  if (l.match(/angry|furious|frustrated|mad|rage|fight|argument|quarrel|qwarrel|conflict|clash|disagree|dispute|annoy/))
    return { mood:"angry", score:.24, emotions:["anger"] };

  if (l.match(/calm|peace|relax|content|serene/))
    return { mood:"calm", score:.72, emotions:["calm"] };

  return { mood:"neutral", score:.52, emotions:["neutral"] };
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

    // HYBRID OVERRIDE:
    // If the ML service classifies the text as "happy" (Normal) or "neutral"
    // but the rule-based scanner detects explicit negative keywords (sad, anxious, angry),
    // override the ML prediction with the clear explicit keyword sentiment.
    // IMPORTANT: Never override a crisis prediction — crisis takes absolute priority.
    if (!isCrisis && (finalMood === "happy" || finalMood === "neutral") && ruleRes.mood !== "neutral") {
      console.log(`⚠️ Hybrid Override Activated: Overriding ML mood '${finalMood}' with explicit keyword mood '${ruleRes.mood}'`);
      finalMood = ruleRes.mood;
      finalScore = ruleRes.score;
      finalState = ruleRes.mood.charAt(0).toUpperCase() + ruleRes.mood.slice(1);
    } else {
      // Convert/scale ML confidence score to appropriate wellness scores (lower is worse)
      if (isCrisis) {
        if (crisisLabel === "Suicidal" || finalMood === "suicidal") {
          finalScore = 0.08;
        } else if (crisisLabel === "Depression" || finalMood === "depression" || finalMood === "sad") {
          finalScore = 0.18;
        }
      } else {
        if (finalMood === "happy" || finalMood === "joy") {
          finalScore = Math.max(0.75, finalScore);
        } else if (finalMood === "calm") {
          finalScore = Math.max(0.65, finalScore);
        } else if (finalMood === "neutral") {
          finalScore = 0.52;
        } else if (finalMood === "anxious") {
          finalScore = Math.max(0.1, 0.45 - (finalScore * 0.15));
        } else if (finalMood === "angry") {
          finalScore = Math.max(0.1, 0.35 - (finalScore * 0.15));
        } else if (finalMood === "sad") {
          finalScore = Math.max(0.1, 0.35 - (finalScore * 0.15));
        }
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