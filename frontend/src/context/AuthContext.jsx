import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

function localTimeToUtc(localTimeStr) {
  if (!localTimeStr) return "09:00";
  const [hours, minutes] = localTimeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const utcHours = String(date.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${utcHours}:${utcMinutes}`;
}

function utcTimeToLocal(utcTimeStr) {
  if (!utcTimeStr) return "09:00";
  const [utcHours, utcMinutes] = utcTimeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(utcHours, utcMinutes, 0, 0);
  const localHours = String(date.getHours()).padStart(2, '0');
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  return `${localHours}:${localMinutes}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem("mindease_token");
    const stored = localStorage.getItem("mindease_user");
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.reminderTime) {
          parsed.reminderTime = utcTimeToLocal(parsed.reminderTime);
        }
        setUser(parsed);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.user && res.user.reminderTime) {
      res.user.reminderTime = utcTimeToLocal(res.user.reminderTime);
    }
    localStorage.setItem("mindease_token", res.token);
    localStorage.setItem("mindease_user", JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password, gender, parentalContacts = [], otherContacts = []) => {
    const defaultLocalTime = "09:00";
    const utcReminderTime = localTimeToUtc(defaultLocalTime);
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      gender,
      parentalContacts,
      otherContacts,
      reminderTime: utcReminderTime
    });
    if (res.user && res.user.reminderTime) {
      res.user.reminderTime = utcTimeToLocal(res.user.reminderTime);
    }
    localStorage.setItem("mindease_token", res.token);
    localStorage.setItem("mindease_user", JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("mindease_token");
    localStorage.removeItem("mindease_user");
    setUser(null);
  };

  const updatePreferences = async (name, emailNotifications, reminderTime, gender, parentalContacts, otherContacts) => {
    const payload = { name, emailNotifications };
    if (reminderTime !== undefined) {
      payload.reminderTime = localTimeToUtc(reminderTime);
    }
    if (gender !== undefined) payload.gender = gender;
    if (parentalContacts !== undefined) payload.parentalContacts = parentalContacts;
    if (otherContacts !== undefined) payload.otherContacts = otherContacts;
    const res = await api.put("/auth/preferences", payload);
    if (res.user && res.user.reminderTime) {
      res.user.reminderTime = utcTimeToLocal(res.user.reminderTime);
    }
    localStorage.setItem("mindease_user", JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updatePreferences, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
