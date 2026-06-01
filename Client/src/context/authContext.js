import React, { createContext, useContext, useState, useEffect } from "react";

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

  const login = async (newUser, newToken) => {
    // 登录新账号前，先把旧账号的服务端 session 登出
    const oldToken = localStorage.getItem("token");
    if (oldToken && oldToken !== newToken) {
      try {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${oldToken}` },
        });
      } catch (_) {
        // 容错：网络异常不阻塞新登录
      }
    }

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    // 调后端清除 session（容错：接口挂了也不影响前端登出）
    if (token) {
      try {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {
        // 网络异常也继续清除前端状态
      }
    }
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // 监听全局 session-expired 事件（多设备互踢）
  useEffect(() => {
    const handler = () => {
      setUser(null);
      window.location.href = "/login?session_expired=1";
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, []);

  // 监听 localStorage 跨标签页变化（同浏览器只允许一个账号登录）
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "user" && e.newValue) {
        // 另一个标签页登录了新账号 → 清除当前页登录态
        setUser(null);
        window.location.href = "/login?session_expired=1";
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
