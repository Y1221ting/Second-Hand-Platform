import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./authContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [criticalNotifications, setCriticalNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem("token");
      const [criticalRes, countRes] = await Promise.all([
        fetch("/api/warnings/critical", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/warnings/?isRead=false", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (criticalRes.ok) {
        const data = await criticalRes.json();
        setCriticalNotifications(data.notifications || []);
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent fail on polling
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const acknowledgeNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/warnings/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCriticalNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silent fail
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        criticalNotifications,
        criticalNotification: criticalNotifications[0] || null,
        unreadCount,
        acknowledgeNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
