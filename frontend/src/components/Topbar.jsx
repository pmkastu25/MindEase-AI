import { useState, useEffect, useRef } from "react";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import "./Topbar.css";

const PAGE_META = {
  dashboard: { title: "Good {greet}, {name} 🌿", sub: "You've checked in today. Keep it going!" },
  analytics:  { title: "Your <em>Analytics</em> 📊", sub: "Insights powered by ML sentiment analysis" },
  journal:    { title: "Your <em>Journal</em> ✍️",  sub: "Write freely — your words reveal your world" },
  chatbot:    { title: "Talk to <em>MindEase</em> 💬", sub: "AI-powered empathetic conversations" },
  resources:  { title: "Wellness <em>Library</em> 🌱", sub: "Curated content for your emotional well-being" },
  therapist:  { title: "Find a <em>Therapist</em> 🩺", sub: "Verified professionals near you" },
};

const RELATION_OPTIONS = [
  "Father", "Mother", "Guardian",
  "Brother", "Sister",
  "Best Friend", "Close Friend",
  "Grandfather", "Grandmother",
  "Uncle", "Aunt",
  "Other Relative",
  "Other",
];

export default function Topbar({ activePage, userName, mobileNavOpen, setMobileNavOpen }) {
  const meta = PAGE_META[activePage] || PAGE_META.dashboard;
  const h = new Date().getHours();
  const greet = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  const name  = userName?.split(" ")[0] || "there";

  const title = meta.title
    .replace("{greet}", greet)
    .replace("{name}", name);

  const {
    notifications,
    dismissNotification,
    clearAll,
    unreadCount,
    markAllRead,
  } = useNotification();

  const { user, updatePreferences } = useAuth();

  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs for click outside
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  // Settings local state
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [emailNotifToggle, setEmailNotifToggle] = useState(user?.emailNotifications !== false);
  const [reminderTimeInput, setReminderTimeInput] = useState(user?.reminderTime || "09:00");
  const [genderInput, setGenderInput] = useState(user?.gender || "Prefer not to say");
  const [parentalContacts, setParentalContacts] = useState(user?.parentalContacts || [{ email: "" }]);
  const [otherContacts, setOtherContacts]       = useState(user?.otherContacts || []);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("mindease_theme") === "dark";
  });

  // Sync settings when user context changes
  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      setEmailNotifToggle(user.emailNotifications !== false);
      setReminderTimeInput(user.reminderTime || "09:00");
      setGenderInput(user.gender || "Prefer not to say");
      setParentalContacts(user.parentalContacts?.length ? user.parentalContacts : [{ email: "" }]);
      setOtherContacts(user.otherContacts || []);
    }
  }, [user]);

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

  // Apply Dark Mode theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("mindease_theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("mindease_theme", "light");
    }
  }, [darkMode]);

  const toggleDropdown = () => {
    setShowDropdown((prev) => {
      const next = !prev;
      if (next) {
        markAllRead();
        setShowSettings(false); // Close other dropdown
      }
      return next;
    });
  };

  const toggleSettings = () => {
    setShowSettings((prev) => {
      const next = !prev;
      if (next) {
        setShowDropdown(false); // Close other dropdown
      }
      return next;
    });
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    if (showDropdown || showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, showSettings]);

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;
    const filteredParents = parentalContacts.filter(c => c.email.trim());
    if (filteredParents.length === 0) {
      setSaveMessage("✕ Parent email required");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    setSaving(true);
    setSaveMessage("");
    try {
      const filteredOthers  = otherContacts.filter(c => c.email.trim());
      await updatePreferences(nameInput, emailNotifToggle, reminderTimeInput, genderInput, filteredParents, filteredOthers);
      setSaveMessage("✓ Saved!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch {
      setSaveMessage("✕ Error");
      setTimeout(() => setSaveMessage(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmail = async (checked) => {
    setEmailNotifToggle(checked);
    try {
      await updatePreferences(nameInput.trim() || user?.name || "User", checked, reminderTimeInput);
    } catch (err) {
      console.error("Failed to sync email preference", err);
    }
  };

  const handleTimeChange = async (time) => {
    setReminderTimeInput(time);
    try {
      await updatePreferences(nameInput.trim() || user?.name || "User", emailNotifToggle, time);
    } catch (err) {
      console.error("Failed to sync reminder time", err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get("/journal");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.entries || [], null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `mindease_journal_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Failed to export data: " + e.message);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "journal":
        return "✍️";
      case "chatbot":
        return "💬";
      default:
        return "🌿";
    }
  };

  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileNavOpen(true)} 
          title="Open Menu"
        >
          ☰
        </button>
        <div className="topbar-greeting">
          <h1
            className="topbar-title"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="topbar-sub">{meta.sub}</p>
        </div>
      </div>
      <div className="topbar-actions">
        {/* Notifications */}
        <div className="notif-container" ref={dropdownRef}>
          <div
            className={`tbar-btn notif-btn-wrapper ${unreadCount > 0 ? "has-unread" : ""}`}
            onClick={toggleDropdown}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </div>

          {showDropdown && (
            <div className="notif-dropdown fade-in">
              <div className="notif-dropdown-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button className="clear-all-btn" onClick={clearAll}>
                    Clear All
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <span>🌱</span>
                    <p>All caught up! No new updates.</p>
                  </div>
                ) : (
                  <div className="notif-list">
                    {notifications.map((notif) => (
                      <div className="notif-item" key={notif.id}>
                        <div className="notif-item-icon">{getNotifIcon(notif.type)}</div>
                        <div className="notif-item-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <span className="notif-item-time">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <button
                          className="notif-item-dismiss"
                          onClick={() => dismissNotification(notif.id)}
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notif-dropdown-footer">
                <button
                  className="notif-close-action-btn"
                  onClick={() => setShowDropdown(false)}
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="settings-container" ref={settingsRef}>
          <div
            className={`tbar-btn settings-btn-wrapper ${showSettings ? "active" : ""}`}
            onClick={toggleSettings}
            title="Settings"
          >
            ⚙️
          </div>

          {showSettings && (
            <div className="settings-dropdown fade-in">
              <div className="settings-dropdown-header">
                <h3>⚙️ Settings</h3>
              </div>

              <div className="settings-dropdown-body">
                {/* Profile settings */}
                <div className="settings-section">
                  <span className="settings-section-title">Profile Settings</span>
                  <div className="settings-input-group">
                    <label>Display Name</label>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <input
                        type="text"
                        className="input-field settings-input"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    <label>Gender</label>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <select
                        className="input-field settings-input relation-select"
                        value={genderInput}
                        onChange={(e) => setGenderInput(e.target.value)}
                        style={{ height: "36px" }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--soft)", textTransform: "uppercase", marginBottom: "6px" }}>
                      👪 Parents / Guardians <span style={{ color: "#c47880" }}>*</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                      {parentalContacts.map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="email"
                            className="input-field"
                            style={{ padding: "6px 10px", fontSize: "12.5px" }}
                            value={c.email}
                            onChange={(e) => updateParentEmail(i, e.target.value)}
                            placeholder="parent@example.com"
                            required={i === 0}
                          />
                          {parentalContacts.length > 1 && (
                            <button
                              type="button"
                              className="contact-remove-btn"
                              onClick={() => removeParent(i)}
                              style={{ padding: "4px 8px", cursor: "pointer" }}
                            >✕</button>
                          )}
                        </div>
                      ))}
                      {parentalContacts.length < 3 && (
                        <button
                          type="button"
                          className="contact-add-btn"
                          onClick={addParent}
                          style={{ alignSelf: "flex-start", padding: "4px 8px", fontSize: "11.5px" }}
                        >
                          + Add Email
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--soft)", textTransform: "uppercase", marginBottom: "6px" }}>
                      🤝 Others (optional)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                      {otherContacts.length === 0 && (
                        <div style={{ fontSize: "11.5px", color: "var(--soft)", fontStyle: "italic" }}>
                          No other support contacts added.
                        </div>
                      )}
                      {otherContacts.map((c, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: "600" }}>Contact {i+1}</span>
                            <button
                              type="button"
                              className="contact-remove-btn"
                              onClick={() => removeOther(i)}
                            >✕</button>
                          </div>
                          <input
                            type="text"
                            className="input-field"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            value={c.name}
                            onChange={(e) => updateOther(i, "name", e.target.value)}
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            className="input-field"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            value={c.email}
                            onChange={(e) => updateOther(i, "email", e.target.value)}
                            placeholder="Email"
                          />
                          <select
                            className="input-field relation-select"
                            style={{ padding: "4px 8px", fontSize: "12px", height: "28px" }}
                            value={c.relation}
                            onChange={(e) => updateOther(i, "relation", e.target.value)}
                          >
                            {RELATION_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="contact-add-btn"
                        onClick={addOther}
                        style={{ alignSelf: "flex-start", padding: "4px 8px", fontSize: "11.5px" }}
                      >
                        + Add Contact
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px" }}>
                      <button
                        className="btn-pr settings-save-btn"
                        onClick={handleSaveProfile}
                        disabled={saving || !nameInput.trim()}
                      >
                        {saving ? "..." : "Save Profile & Contacts"}
                      </button>
                    </div>
                    {saveMessage && (
                      <span className={`save-status-msg ${saveMessage.includes("Error") || saveMessage.startsWith("✕") ? "err" : "success"}`} style={{ marginTop: "6px", display: "inline-block" }}>
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preferences */}
                <div className="settings-section">
                  <span className="settings-section-title">App Preferences</span>
                  
                  {/* Dark Mode Row */}
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <h4>Dark Theme 🌙</h4>
                      <p>Soothing dark theme for your eyes</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                      />
                      <span className="slider-toggle"></span>
                    </label>
                  </div>

                  {/* Email Notifications Row */}
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <h4>Daily Reminders ✉️</h4>
                      <p>Mindful check-ins at your chosen time</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={emailNotifToggle}
                        onChange={(e) => handleToggleEmail(e.target.checked)}
                      />
                      <span className="slider-toggle"></span>
                    </label>
                  </div>

                  {/* Time picker sub-row for email notifications */}
                  {emailNotifToggle && (
                    <div className="settings-row time-picker-row fade-in" style={{ paddingLeft: "10px", marginTop: "-6px" }}>
                      <div className="settings-row-label">
                        <h4 style={{ fontSize: "11.5px", fontWeight: "500" }}>Reminder Time ⏰</h4>
                        <p>Receive your email alert at this exact time</p>
                      </div>
                      <input
                        type="time"
                        className="input-field settings-time-input"
                        value={reminderTimeInput}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        style={{ width: "95px", padding: "4px 8px", height: "30px", fontSize: "12px", border: "1px solid var(--border)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Data Privacy settings */}
                <div className="settings-section">
                  <span className="settings-section-title">Data & Privacy</span>
                  <div className="settings-row">
                    <div className="settings-row-label">
                      <h4>Export Journals</h4>
                      <p>Download all your writings as a JSON file</p>
                    </div>
                    <button className="btn-out settings-action-btn" onClick={handleExportData}>
                      📥 Export
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-dropdown-footer">
                <button
                  className="notif-close-action-btn"
                  onClick={() => setShowSettings(false)}
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
