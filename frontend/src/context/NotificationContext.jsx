import { createContext, useContext, useState, useEffect } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    // Attempt to load from localStorage for persistent user experience
    const saved = localStorage.getItem("mindease_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below if parsing fails
      }
    }
    // Default initial notification
    return [
      {
        id: "welcome-1",
        title: "Welcome to MindEase 🌿",
        message: "We're glad to have you. Track your mood daily, write journals, and chat with your empathetic AI companion.",
        type: "welcome",
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("mindease_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title, message, type = "welcome") => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        dismissNotification,
        markAllRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
