import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";
import logo from "../logo.png";

const RELATION_OPTIONS = [
  "Father", "Mother", "Guardian",
  "Brother", "Sister",
  "Best Friend", "Close Friend",
  "Grandfather", "Grandmother",
  "Uncle", "Aunt",
  "Other Relative",
  "Other",
];

export default function AuthPage() {
  const [mode, setMode] = useState("login");

  // Basic credentials
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "Prefer not to say" });

  // Family contacts state
  const [familyTab, setFamilyTab]         = useState("parents"); // "parents" | "others"
  const [parentalContacts, setParentalContacts] = useState([{ email: "" }]);
  const [otherContacts, setOtherContacts]       = useState([]);

  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();

  /* ── Parental contact helpers ── */
  const addParent = () => {
    if (parentalContacts.length < 3) setParentalContacts(prev => [...prev, { email: "" }]);
  };
  const removeParent = (i) =>
    setParentalContacts(prev => prev.filter((_, idx) => idx !== i));
  const updateParentEmail = (i, val) =>
    setParentalContacts(prev => prev.map((c, idx) => idx === i ? { email: val } : c));

  /* ── Other contacts helpers ── */
  const addOther = () =>
    setOtherContacts(prev => [...prev, { name: "", email: "", relation: "Other" }]);
  const removeOther = (i) =>
    setOtherContacts(prev => prev.filter((_, idx) => idx !== i));
  const updateOther = (i, field, val) =>
    setOtherContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        // Filter out blank parent emails
        const filteredParents = parentalContacts.filter(c => c.email.trim());
        const filteredOthers  = otherContacts.filter(c => c.email.trim());
        await register(form.name, form.email, form.password, form.gender, filteredParents, filteredOthers);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Floating mesh orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className={`auth-container fade-up ${mode === "register" ? "auth-container-wide" : ""}`}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo-orb" style={{ overflow: "hidden", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={logo} alt="MindEase AI Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
          </div>
          <h1 className="auth-title">MindEase <em>AI</em></h1>
          <p className="auth-tagline">Your emotion-aware well-being companion</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >Create Account</button>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div className="form-group fade-up">
                  <label className="form-label">Full Name</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group fade-up">
                  <label className="form-label">Gender</label>
                  <select
                    className="input-field relation-select"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* ── Family Contacts section (register only) ── */}
            {mode === "register" && (
              <div className="family-section fade-up">
                <div className="family-section-header">
                  <span className="family-section-icon">👨‍👩‍👧</span>
                  <div>
                    <div className="family-section-title">Family &amp; Support Contacts</div>
                    <div className="family-section-desc">
                      We'll notify them if our AI detects a mental health crisis
                    </div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="family-tabs">
                  <button
                    type="button"
                    className={`family-tab ${familyTab === "parents" ? "active" : ""}`}
                    onClick={() => setFamilyTab("parents")}
                  >
                    👪 Parents / Guardians
                  </button>
                  <button
                    type="button"
                    className={`family-tab ${familyTab === "others" ? "active" : ""}`}
                    onClick={() => setFamilyTab("others")}
                  >
                    🤝 Others
                    <span className="optional-badge">optional</span>
                  </button>
                </div>

                {/* Parents tab */}
                {familyTab === "parents" && (
                  <div className="family-tab-content">
                    <p className="family-hint">
                      📧 Add your parent's or guardian's email. MindEase will contact them if you're ever in distress.
                    </p>
                    {parentalContacts.map((c, i) => (
                      <div className="contact-row" key={i}>
                        <div className="contact-row-label">Parent / Guardian {i + 1}</div>
                        <div className="contact-row-inputs">
                          <input
                            className="input-field contact-email-input"
                            type="email"
                            placeholder="parent@example.com"
                            value={c.email}
                            onChange={e => updateParentEmail(i, e.target.value)}
                          />
                          {parentalContacts.length > 1 && (
                            <button
                              type="button"
                              className="contact-remove-btn"
                              onClick={() => removeParent(i)}
                              title="Remove"
                            >✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {parentalContacts.length < 3 && (
                      <button type="button" className="contact-add-btn" onClick={addParent}>
                        + Add Another Parent / Guardian
                      </button>
                    )}
                  </div>
                )}

                {/* Others tab */}
                {familyTab === "others" && (
                  <div className="family-tab-content">
                    <p className="family-hint">
                      🤝 Add brothers, sisters, best friends, or other relatives. <strong>Completely optional.</strong>
                    </p>
                    {otherContacts.length === 0 && (
                      <div className="no-others-placeholder">
                        No contacts added yet — click below to add one.
                      </div>
                    )}
                    {otherContacts.map((c, i) => (
                      <div className="contact-row other-contact-row" key={i}>
                        <div className="contact-row-label">
                          Contact {i + 1}
                          <button
                            type="button"
                            className="contact-remove-btn"
                            onClick={() => removeOther(i)}
                            title="Remove"
                          >✕</button>
                        </div>
                        <div className="other-contact-inputs">
                          <input
                            className="input-field"
                            type="text"
                            placeholder="Name"
                            value={c.name}
                            onChange={e => updateOther(i, "name", e.target.value)}
                          />
                          <input
                            className="input-field"
                            type="email"
                            placeholder="email@example.com"
                            value={c.email}
                            onChange={e => updateOther(i, "email", e.target.value)}
                          />
                          <select
                            className="input-field relation-select"
                            value={c.relation}
                            onChange={e => updateOther(i, "relation", e.target.value)}
                          >
                            {RELATION_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="contact-add-btn" onClick={addOther}>
                      + Add Contact
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-pr auth-submit" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Feature chips */}
          <div className="auth-features">
            {["AI Mood Analysis", "Emotion Dashboard", "CBT Chatbot", "Therapist Connect"].map((f) => (
              <span key={f} className="auth-feat-chip">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
