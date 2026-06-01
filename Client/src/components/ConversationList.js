import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

const ConversationList = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conv) => {
    const stored = localStorage.getItem("user");
    if (!stored) return conv.participants?.[0] || {};
    const me = JSON.parse(stored);
    return (conv.participants || []).find((p) => p._id !== me.id) || conv.participants?.[0] || {};
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) {
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "昨天";
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">消息</h1>

        {conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <Link
                  key={conv._id}
                  to={`/messages/${conv._id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold text-lg">
                      {other.fullName?.[0] || "?"}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {other.fullName || "未知用户"}
                      </h3>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {conv.productId && (
                        <span className="text-xs text-gray-400 truncate bg-gray-100 px-1.5 py-0.5 rounded max-w-[40%]">
                          {conv.productId.name}
                        </span>
                      )}
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {conv.lastMessage?.content || "暂无消息"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">暂无消息</p>
            <p className="text-gray-400 text-sm">去逛逛商品，联系感兴趣的卖家吧</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ConversationList;
