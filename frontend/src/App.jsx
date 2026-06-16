import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CrisisProvider } from "./context/CrisisContext";
import AuthPage    from "./pages/AuthPage";
import Dashboard   from "./pages/Dashboard";
import Analytics   from "./pages/Analytics";
import Journal     from "./pages/Journal";
import ChatBot     from "./pages/ChatBot";
import Resources   from "./pages/Resources";
import TherapistConnect from "./pages/TherapistConnect";
import Navbar  from "./components/Navbar";
import Topbar  from "./components/Topbar";
import "./App.css";

function AppContent() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!user) return <AuthPage />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard setActivePage={setActivePage} />;
      case "analytics":  return <Analytics />;
      case "journal":   return <Journal />;
      case "chatbot":   return <ChatBot />;
      case "resources": return <Resources />;
      case "therapist": return <TherapistConnect />;
      default:          return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <CrisisProvider setActivePage={setActivePage}>
      <div className="app-shell">
        <Navbar activePage={activePage} setActivePage={setActivePage} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
        <div className="main-content">
          <Topbar activePage={activePage} userName={user?.name} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
          <div className="main-content-body">
            {renderPage()}
          </div>
        </div>
      </div>
    </CrisisProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
