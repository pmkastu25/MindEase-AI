import { createContext, useContext, useState, useCallback } from "react";

const CrisisContext = createContext(null);

// The 7 extreme/crisis mood labels from the ML model
export const CRISIS_MOODS = [
  "suicidal",
  "suicide",
  "depression",
  "depressed",
  "self-harm",
  "hopeless",
  "crisis",
];

// Check if a mood label is a crisis mood
export const isCrisisMood = (mood) => {
  if (!mood) return false;
  const lower = mood.toLowerCase().trim();
  return CRISIS_MOODS.some((cm) => lower.includes(cm));
};

// Dynamic motivational quotes pool
const CRISIS_QUOTES = [
  {
    quote: "You are not alone in this. Every storm runs out of rain, and brighter days are ahead of you.",
    author: "MindEase",
  },
  {
    quote: "Your life has immeasurable value. The pain you feel right now is temporary — please reach out.",
    author: "Crisis Support",
  },
  {
    quote: "Courage doesn't always roar. Sometimes it's the quiet voice that says 'I will try again tomorrow.'",
    author: "Mary Anne Radmacher",
  },
  {
    quote: "Even the darkest night will end, and the sun will rise. You matter more than you know.",
    author: "Victor Hugo",
  },
  {
    quote: "You are stronger than you think, braver than you believe, and more loved than you'll ever know.",
    author: "A.A. Milne",
  },
  {
    quote: "There is hope, even when your brain tells you there isn't. Please keep going — one breath at a time.",
    author: "John Green",
  },
  {
    quote: "In the middle of difficulty lies opportunity. In the middle of your pain lies incredible strength.",
    author: "MindEase AI",
  },
  {
    quote: "You are enough. You have always been enough. The world needs your presence, your story, your light.",
    author: "Crisis Companion",
  },
  {
    quote: "Healing is not linear, but it is real. Every moment you survive is a testament to your resilience.",
    author: "Mental Health Foundation",
  },
  {
    quote: "Your feelings are valid, and help is available. You deserve care, support, and a tomorrow full of possibility.",
    author: "Vandrevala Foundation",
  },
];

let lastQuoteIndex = -1;
export const getRandomCrisisQuote = () => {
  let idx;
  do {
    idx = Math.floor(Math.random() * CRISIS_QUOTES.length);
  } while (idx === lastQuoteIndex && CRISIS_QUOTES.length > 1);
  lastQuoteIndex = idx;
  return CRISIS_QUOTES[idx];
};

export function CrisisProvider({ children, setActivePage }) {
  const [crisisVisible, setCrisisVisible]   = useState(false);
  const [crisisQuote, setCrisisQuote]       = useState(CRISIS_QUOTES[0]);
  const [crisisCountdown, setCrisisCountdown] = useState(10);
  const [redirectTimer, setRedirectTimer]   = useState(null);
  const [emailSent, setEmailSent]           = useState(false);

  const triggerCrisis = useCallback((crisisEmailSent = false) => {
    const quote = getRandomCrisisQuote();
    setCrisisQuote(quote);
    setCrisisVisible(true);
    setCrisisCountdown(10);
    setEmailSent(crisisEmailSent);

    // Countdown timer
    let count = 10;
    const interval = setInterval(() => {
      count -= 1;
      setCrisisCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setCrisisVisible(false);
        if (setActivePage) setActivePage("therapist");
      }
    }, 1000);

    setRedirectTimer(interval);
  }, [setActivePage]);

  const dismissCrisis = useCallback(() => {
    if (redirectTimer) clearInterval(redirectTimer);
    setCrisisVisible(false);
    if (setActivePage) setActivePage("therapist");
  }, [redirectTimer, setActivePage]);

  const closeCrisis = useCallback(() => {
    if (redirectTimer) clearInterval(redirectTimer);
    setCrisisVisible(false);
  }, [redirectTimer]);

  return (
    <CrisisContext.Provider value={{ triggerCrisis, isCrisisMood, crisisVisible, setEmailSent }}>
      {children}
      {crisisVisible && (
        <CrisisModal
          quote={crisisQuote}
          countdown={crisisCountdown}
          onRedirect={dismissCrisis}
          onClose={closeCrisis}
          emailSent={emailSent}
        />
      )}
    </CrisisContext.Provider>
  );
}

// ── Family & Friends suggestions ────────────────────────────────
const FAMILY_SUGGESTIONS = [
  { icon: "📞", title: "Call your parents right now", desc: "A parent's voice can be deeply grounding. Just hearing 'I'm here' can help." },
  { icon: "👥", title: "Reach out to a close friend", desc: "Text someone you trust — you don't have to explain everything, just say 'I need you.'" },
  { icon: "🏠", title: "Be with a trusted family member", desc: "You don't have to be alone. Ask someone to sit with you, even in silence." },
  { icon: "💌", title: "Let a loved one know you're struggling", desc: "Sharing your pain with someone who loves you lightens the load immediately." },
];

function CrisisModal({ quote, countdown, onRedirect, onClose, emailSent }) {
  return (
    <div className="crisis-overlay" onClick={onClose}>
      <div className="crisis-modal" onClick={(e) => e.stopPropagation()}>
        {/* Animated pulse ring */}
        <div className="crisis-pulse-ring" />
        <div className="crisis-pulse-ring delay1" />

        {/* Header */}
        <div className="crisis-header">
          <div className="crisis-icon-wrap">
            <span className="crisis-heart">💙</span>
          </div>
          <div className="crisis-badge">Crisis Support Activated</div>
        </div>

        {/* Email notification banner */}
        {emailSent && (
          <div className="crisis-email-banner">
            <span className="crisis-email-icon">📧</span>
            <div>
              <div className="crisis-email-title">Your family has been notified</div>
              <div className="crisis-email-sub">We've sent a care alert to your emergency contacts</div>
            </div>
          </div>
        )}

        {/* Motivational Quote */}
        <div className="crisis-quote-block">
          <span className="crisis-quote-mark">"</span>
          <p className="crisis-quote-text">{quote.quote}</p>
          <span className="crisis-quote-mark right">"</span>
          <div className="crisis-quote-author">— {quote.author}</div>
        </div>

        {/* Divider */}
        <div className="crisis-divider" />

        {/* ── Connect with Family & Friends ── */}
        <div className="crisis-family-section">
          <div className="crisis-family-title">❤️ Connect with Family &amp; Friends</div>
          <p className="crisis-family-subtitle">
            Your loved ones want to be there for you. Reach out — you don't have to face this alone.
          </p>
          <div className="crisis-family-grid">
            {FAMILY_SUGGESTIONS.map((s, i) => (
              <div key={i} className="crisis-family-card">
                <div className="crisis-family-card-icon">{s.icon}</div>
                <div className="crisis-family-card-title">{s.title}</div>
                <div className="crisis-family-card-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="crisis-divider" />

        {/* Emergency contact block */}
        <div className="crisis-contacts">
          <div className="crisis-contacts-title">🆘 Immediate Help Available</div>
          <div className="crisis-contact-row">
            <a href="tel:9152987821" className="crisis-phone-btn">
              📞 iCall: 9152987821
            </a>
            <a
              href="tel:18602662345"
              className="crisis-phone-btn vandrevala"
            >
              💚 Vandrevala Foundation: 1860-2662-345
            </a>
          </div>
          <div className="crisis-vandrevala-row">
            <a
              href="https://www.vandrevalafoundation.com/"
              target="_blank"
              rel="noreferrer"
              className="crisis-website-btn"
            >
              🌐 Visit Vandrevala Foundation →
            </a>
          </div>
        </div>

        {/* Redirect notice */}
        <div className="crisis-redirect-bar">
          <div className="crisis-redirect-fill" style={{ width: `${(countdown / 10) * 100}%` }} />
        </div>
        <p className="crisis-redirect-text">
          Connecting you to Therapist Support in{" "}
          <strong>{countdown}s</strong>…
        </p>

        {/* Actions */}
        <div className="crisis-actions">
          <button className="crisis-btn-primary" onClick={onRedirect}>
            💙 Connect to Therapist Now
          </button>
          <button className="crisis-btn-secondary" onClick={onClose}>
            I'm okay for now
          </button>
        </div>
      </div>
    </div>
  );
}

export const useCrisis = () => {
  const ctx = useContext(CrisisContext);
  if (!ctx) throw new Error("useCrisis must be used within a CrisisProvider");
  return ctx;
};
