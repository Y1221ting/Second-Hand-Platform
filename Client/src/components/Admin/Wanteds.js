import React, { useState, useEffect, useCallback } from "react";
import { FaSearch, FaTrash, FaExclamationTriangle } from "react-icons/fa";

const Wanteds = () => {
  const [wanteds, setWanteds] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWanteds = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/wanteds?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWanteds(data.wanteds);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取求购列表失败:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchWanteds();
  }, [fetchWanteds]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/wanteds/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setWanteds((prev) => prev.filter((w) => w._id !== deleteId));
        setTotal((prev) => prev - 1);
      } else {
        const d = await res.json();
        alert(d.message || "删除失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {/* 标题 + 搜索 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">求购管理</h1>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="搜索求购名称/发布者..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full py-2 pl-9 pr-3 rounded-lg bg-white border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        </div>
      </div>

      {/* 统计条 */}
      <p className="text-sm text-gray-500 mb-4">共 {total} 条求购</p>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : wanteds.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无求购</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">求购名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">发布者</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">学院</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">预算</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">发布时间</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {wanteds.map((w) => (
                <tr key={w._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate" title={w.name}>
                    {w.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {w.postedBy?.name || "未知"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {w.postedBy?.department || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ¥{Number(w.budget).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(w.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDeleteId(w._id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="删除"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded bg-white border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded bg-white border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                <FaExclamationTriangle />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">确认删除</h3>
                <p className="text-sm text-gray-500">删除后将无法恢复</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wanteds;
