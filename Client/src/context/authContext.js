import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const userIdRef = useRef(user?.id);

  const login = async (newUser, newToken) => {
    const oldUser = JSON.parse(localStorage.getItem("user") || "null");
    const oldToken = localStorage.getItem("token");

    // 只在"同一账号"重新登录时，才登出旧 session
    if (oldUser && oldUser.id === newUser.id && oldToken && oldToken !== newToken) {
      try {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${oldToken}` },
        });
      } catch (_) {
        // 容错
      }
    }

    setUser(newUser);
    userIdRef.current = newUser.id;
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {
        // 容错
      }
    }
    setUser(null);
    userIdRef.current = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // 监听全局 session-expired 事件（服务端返回 SESSION_EXPIRED 时触发）
  useEffect(() => {
    const handler = () => {
      setUser(null);
      userIdRef.current = null;
      window.location.href = "/login?session_expired=1";
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);

  // 监听 localStorage 跨标签页变化（同浏览器只允许一个账号登录）
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "user" && e.newValue) {
        try {
          const newUser = JSON.parse(e.newValue);
          if (!userIdRef.current) return;
          if (newUser.id === userIdRef.current) {
            // 同一账号被其他标签页重新登录 → 踢出当前页
            setUser(null);
            userIdRef.current = null;
            window.location.href = "/login?session_expired=1";
          } else {
            // 不同账号 → 同步到新账号（同浏览器只能有一个账号）
            setUser(newUser);
            userIdRef.current = newUser.id;
          }
        } catch (_) {
          // JSON 解析失败忽略
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
