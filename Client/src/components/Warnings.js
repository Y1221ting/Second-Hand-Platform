import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { FaBell, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

const Notifications = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filter, page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (filter === "unread") params.append("isRead", "false");
      else if (filter === "read") params.append("isRead", "true");
      const res = await fetch(`/api/messages/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取消息失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/messages/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (filter === "unread") {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId ? { ...m, isRead: true } : m
            )
          );
        }
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate("/home"); } }}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">系统通知</h1>
          </div>
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
              onClick={() => { setFilter(item.value); setPage(1); }}
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
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m._id}
                onClick={() => !m.isRead && markAsRead(m._id)}
                className={`bg-white rounded-xl shadow-sm p-5 flex gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !m.isRead ? "border-l-4 border-yellow-500" : ""
                }`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 bg-gray-50">
                  <FaBell className="text-lg" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!m.isRead && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded">
                        新
                      </span>
                    )}
                    {m.isRead && (
                      <span className="text-gray-400 text-[10px] flex items-center gap-1">
                        <FaCheckCircle /> 已读
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{m.title}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{m.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(m.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">暂无系统消息</p>
            <p className="text-gray-400 text-sm">一切正常，继续保持</p>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm ${
                  p === page
                    ? "bg-yellow-500 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Notifications;
