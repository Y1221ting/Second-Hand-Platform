import React, { useState, useEffect } from "react";
import Loading from "../Utility/Loading";

const Appeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState("approve");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/admin/appeals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取申诉列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleAction = async (appealId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/appeals/${appealId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: actionType, note: actionNote }),
      });
      if (res.ok) {
        setActionId(null);
        setActionNote("");
        fetchAppeals();
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

  const statusLabel = (s) => {
    if (s === "pending") return { text: "待处理", cls: "bg-yellow-100 text-yellow-800" };
    if (s === "approved") return { text: "已通过", cls: "bg-green-100 text-green-800" };
    if (s === "rejected") return { text: "已驳回", cls: "bg-red-100 text-red-800" };
    return { text: s, cls: "" };
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">申诉管理</h1>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4">
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-yellow-500 text-gray-900"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {s === "" ? "全部" : statusLabel(s).text}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">商品</th>
                <th className="text-left px-4 py-3">申诉理由</th>
                <th className="text-left px-4 py-3">下架原因</th>
                <th className="text-left px-4 py-3">提交时间</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appeals.map((appeal) => (
                <tr key={appeal._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {appeal.productId ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded bg-gray-200 bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: appeal.productId.images?.[0]
                              ? `url(${appeal.productId.images[0]})`
                              : undefined,
                          }}
                        />
                        <div>
                          <span className="truncate max-w-[120px] block">{appeal.productId.name}</span>
                          <span className="text-xs text-gray-400">¥{Number(appeal.productId.price) || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">商品已删除</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{appeal.reason}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate text-xs">
                    {appeal.productId?.delistReason || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(appeal.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel(appeal.status).cls}`}>
                      {statusLabel(appeal.status).text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {appeal.status === "pending" ? (
                      actionId === appeal._id ? (
                        <div className="bg-gray-50 rounded p-2 space-y-2 text-xs">
                          <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded py-1 px-2"
                          >
                            <option value="approve">通过（恢复商品）</option>
                            <option value="reject">驳回</option>
                          </select>
                          <input
                            type="text"
                            placeholder="备注（可选）"
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded py-1 px-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(appeal._id)}
                              disabled={submitting}
                              className="px-2 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600 disabled:opacity-50"
                            >
                              {submitting ? "处理中..." : "确认"}
                            </button>
                            <button
                              onClick={() => { setActionId(null); setActionNote(""); }}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActionId(appeal._id)}
                          className="px-3 py-1 bg-yellow-500 text-gray-900 rounded text-xs hover:bg-yellow-600 transition-colors"
                        >
                          处理
                        </button>
                      )
                    ) : (
                      <div className="text-xs text-gray-500">
                        {appeal.handleNote && (
                          <span className="block max-w-[120px] truncate" title={appeal.handleNote}>
                            备注: {appeal.handleNote}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {appeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    暂无申诉记录
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
    </div>
  );
};

export default Appeals;
