import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

const ChatWindow = () => {
  const { conversationId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else if (res.status === 403 || res.status === 404) {
        navigate("/messages");
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // 获取会话信息（对方用户+关联商品）
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const conv = (data.conversations || []).find((c) => c._id === conversationId);
        if (conv) setConversation(conv);
      })
      .catch(() => {});
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, content: text }),
      });
      if (res.ok) {
        fetchMessages();
        inputRef.current?.focus();
      }
    } catch {
      alert("发送失败");
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation) return {};
    const stored = localStorage.getItem("user");
    if (!stored) return conversation.participants?.[0] || {};
    const me = JSON.parse(stored);
    return (conversation.participants || []).find((p) => p._id !== me.id) || conversation.participants?.[0] || {};
  };

  const isMyMessage = (senderId) => {
    return senderId === user?.id || senderId?._id === user?.id;
  };

  if (loading) return <Loading />;

  const other = getOtherParticipant();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl w-full mx-auto bg-white shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <button
            onClick={() => navigate("/messages")}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <FaArrowLeft />
          </button>
          <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold text-sm">
            {other.fullName?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {other.fullName || "未知用户"}
            </h3>
            {conversation?.productId && (
              <Link
                to={`/product/${conversation.productId._id}`}
                className="text-xs text-blue-500 hover:underline truncate block"
              >
                {conversation.productId.name}
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {messages.length === 0 && (
            <p className="text-center text-gray-400 py-12">暂无消息，发送第一条消息吧</p>
          )}
          {messages.map((msg) => {
            const mine = isMyMessage(msg.senderId);
            return (
              <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%]`}>
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      mine
                        ? "bg-yellow-500 text-gray-900 rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${mine ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    {mine && " · " + (msg.isRead ? "已读" : "未读")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 py-2.5 px-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default ChatWindow;
