import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

const Warnings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchWarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filter]);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filter === "unread") params.append("isRead", "false");
      else if (filter === "read") params.append("isRead", "true");
      const res = await fetch(`/api/warnings/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWarnings(data.warnings);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("获取警告失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (warningId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/warnings/${warningId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setWarnings((prev) =>
          prev.map((w) =>
            w._id === warningId ? { ...w, isRead: true, readAt: new Date() } : w
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("标记已读失败:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">系统通知</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} 条未读
            </span>
          )}
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 mb-4">
          {[
            { value: "all", label: "全部" },
            { value: "unread", label: "未读" },
            { value: "read", label: "已读" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === item.value
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading />
        ) : warnings.length > 0 ? (
          <div className="space-y-3">
            {warnings.map((w) => (
              <div
                key={w._id}
                onClick={() => !w.isRead && markAsRead(w._id)}
                className={`bg-white rounded-xl shadow-sm p-5 flex gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !w.isRead ? "border-l-4 border-yellow-500" : ""
                }`}
              >
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{w.title}</h3>
                    {!w.isRead && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded">
                        新
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{w.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(w.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {w.readAt && " · 已读"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">暂无警告消息</p>
            <p className="text-gray-400 text-sm">你是个遵守规则的优秀用户</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Warnings;
