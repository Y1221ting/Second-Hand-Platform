import React, { useState, useEffect } from "react";
import Loading from "../Utility/Loading";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAction, setConfirmAction] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningUserId, setWarningUserId] = useState("");
  const [warningTitle, setWarningTitle] = useState("");
  const [warningContent, setWarningContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取用户列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleBan = async (userId, newStatus) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setConfirmId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || "操作失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWarning = async () => {
    if (!warningTitle.trim() || !warningContent.trim()) {
      alert("请填写警告标题和内容");
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
          userId: warningUserId,
          title: warningTitle,
          content: warningContent,
        }),
      });
      if (res.ok) {
        setShowWarningModal(false);
        setWarningTitle("");
        setWarningContent("");
        setWarningUserId("");
        alert("警告已发送");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h1>

      {/* 搜索 + 筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索姓名/邮箱/学院..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 py-2 px-4 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
          />
          <button
            onClick={handleSearch}
            className="ml-2 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 text-sm font-medium"
          >
            搜索
          </button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="py-2 px-3 rounded-lg bg-white border border-gray-300 text-sm"
        >
          <option value="">全部角色</option>
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="py-2 px-3 rounded-lg bg-white border border-gray-300 text-sm"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已封禁</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">用户</th>
                <th className="text-left px-4 py-3">邮箱</th>
                <th className="text-left px-4 py-3">学院/专业</th>
                <th className="text-left px-4 py-3">角色</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">注册时间</th>
                <th className="text-left px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.department || "-"} / {u.major || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {u.role === "admin" ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === "banned" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}>
                      {u.status === "banned" ? "已封禁" : "正常"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {confirmId === u._id ? (
                        <div className="flex gap-1 items-center text-xs">
                          <span className="text-gray-600">确认?</span>
                          <button
                            onClick={() => handleBan(u._id, confirmAction)}
                            disabled={submitting}
                            className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            是
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            否
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setConfirmId(u._id);
                              setConfirmAction(u.status === "banned" ? "active" : "banned");
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              u.status === "banned"
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {u.status === "banned" ? "解封" : "封禁"}
                          </button>
                          <button
                            onClick={() => {
                              setWarningUserId(u._id);
                              setShowWarningModal(true);
                            }}
                            className="px-2 py-1 bg-yellow-500 text-gray-900 rounded text-xs hover:bg-yellow-600 transition-colors"
                          >
                            警告
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    暂无用户
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
      {showWarningModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowWarningModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">发送警告</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">标题</label>
                <input
                  type="text"
                  value={warningTitle}
                  onChange={(e) => setWarningTitle(e.target.value)}
                  placeholder="警告标题"
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">内容</label>
                <textarea
                  value={warningContent}
                  onChange={(e) => setWarningContent(e.target.value)}
                  placeholder="警告内容..."
                  rows={4}
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSendWarning}
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "发送中..." : "发送警告"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
