import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem("mindease_token");
    const stored = localStorage.getItem("mindease_user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("mindease_token", res.token);
    localStorage.setItem("mindease_user", JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password, gender, parentalContacts = [], otherContacts = []) => {
    const res = await api.post("/auth/register", { name, email, password, gender, parentalContacts, otherContacts });
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
    const payload = { name, emailNotifications, reminderTime };
    if (gender !== undefined) payload.gender = gender;
    if (parentalContacts !== undefined) payload.parentalContacts = parentalContacts;
    if (otherContacts !== undefined) payload.otherContacts = otherContacts;
    const res = await api.put("/auth/preferences", payload);
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
