import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import logo from "../logo.png";

const NAV_ITEMS = [
  { id: "dashboard", emoji: "🏡", label: "Home" },
  { id: "analytics", emoji: "📊", label: "Dashboard" },
  { id: "journal",   emoji: "📓", label: "Journal" },
  { id: "chatbot",   emoji: "💬", label: "AI Chatbot", badge: "AI" },
];
const SUPPORT_ITEMS = [
  { id: "resources", emoji: "🌱", label: "Resources" },
  { id: "therapist", emoji: "🩺", label: "Therapist Connect" },
];

export default function Navbar({ activePage, setActivePage, mobileNavOpen, setMobileNavOpen }) {
  const { user, logout } = useAuth();

  return (
    <>
      <nav className={`navbar ${mobileNavOpen ? "mobile-open" : ""}`}>
        {/* Logo */}
        <div className="nav-logo">
          <div className="logo-orb" style={{ overflow: "hidden", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={logo} alt="MindEase AI Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
          </div>
          <div>
            <div className="logo-name">MindEase AI</div>
            <div className="logo-sub">Wellness Companion</div>
          </div>
        </div>

        {/* Nav items */}
        <div className="nav-items">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.id);
                setMobileNavOpen(false);
              }}
            >
              <span className="nav-active-bar" />
              <span className="nav-icon">
                <span className="nav-icon-emoji">{item.emoji}</span>
              </span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section">Support</div>

          {SUPPORT_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.id);
                setMobileNavOpen(false);
              }}
            >
              <span className="nav-active-bar" />
              <span className="nav-icon">
                <span className="nav-icon-emoji">{item.emoji}</span>
              </span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="nav-footer">
          <div className="user-card">
            <div className="user-avatar-orb">
              {user?.name?.charAt(0).toUpperCase() || "😊"}
            </div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-status">● Feeling calm today</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out">⏻</button>
          </div>
        </div>
      </nav>
      
      {/* Drawer Overlay for tablet/mobile screen sizes */}
      <div 
        className={`navbar-overlay ${mobileNavOpen ? "active" : ""}`} 
        onClick={() => setMobileNavOpen(false)} 
      />
    </>
  );
}
