import React, { useState, useEffect } from "react";
import Loading from "../Utility/Loading";

const Warnings = () => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [warnUserId, setWarnUserId] = useState("");
  const [warnTitle, setWarnTitle] = useState("");
  const [warnContent, setWarnContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/admin/warnings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWarnings(data.warnings);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取警告列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSend = async () => {
    if (!warnUserId.trim()) {
      alert("请输入用户ID");
      return;
    }
    if (!warnTitle.trim() || !warnContent.trim()) {
      alert("请填写标题和内容");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/warnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: warnUserId.trim(),
          title: warnTitle.trim(),
          content: warnContent.trim(),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setWarnUserId("");
        setWarnTitle("");
        setWarnContent("");
        fetchWarnings();
      } else {
        const data = await res.json();
        alert(data.message || "发送失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">警告管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 text-sm font-medium"
        >
          发送警告
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4">
        {[
          { value: "all", label: "全部" },
          { value: "unread", label: "未读" },
          { value: "read", label: "已读" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => { setStatusFilter(item.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === item.value
                ? "bg-yellow-500 text-gray-900"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">目标用户</th>
                <th className="text-left px-4 py-3">标题</th>
                <th className="text-left px-4 py-3">内容</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-left px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {warnings.map((w) => (
                <tr key={w._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {w.userId && typeof w.userId === "object" ? (
                      <div>
                        <span className="font-medium">{w.userId.fullName}</span>
                        <span className="text-gray-400 text-xs block">{w.userId.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">{w.userId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{w.title}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{w.content}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(w.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.isRead
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {w.isRead ? "已读" : "未读"}
                    </span>
                  </td>
                </tr>
              ))}
              {warnings.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    暂无警告记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
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

      {/* 发送警告模态框 */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 p-6 w-[420px] max-w-[90vw]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">发送警告</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">用户ID</label>
                <input
                  type="text"
                  value={warnUserId}
                  onChange={(e) => setWarnUserId(e.target.value)}
                  placeholder="输入目标用户的ID"
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">标题</label>
                <input
                  type="text"
                  value={warnTitle}
                  onChange={(e) => setWarnTitle(e.target.value)}
                  placeholder="警告标题"
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">内容</label>
                <textarea
                  value={warnContent}
                  onChange={(e) => setWarnContent(e.target.value)}
                  placeholder="警告内容..."
                  rows={4}
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSend}
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "发送中..." : "发送"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Warnings;
