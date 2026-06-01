import React, { useState, useEffect } from "react";
import Loading from "../Utility/Loading";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState("handle");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取举报列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleAction = async (reportId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports/${reportId}`, {
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
        fetchReports();
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
    if (s === "handled") return { text: "已处理", cls: "bg-green-100 text-green-800" };
    if (s === "dismissed") return { text: "已驳回", cls: "bg-gray-100 text-gray-800" };
    return { text: s, cls: "" };
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">举报管理</h1>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4">
        {["", "pending", "handled", "dismissed"].map((s) => (
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
                <th className="text-left px-4 py-3">举报商品</th>
                <th className="text-left px-4 py-3">举报原因</th>
                <th className="text-left px-4 py-3">详情</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {report.productId ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded bg-gray-200 bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: report.productId.images?.[0]
                              ? `url(${report.productId.images[0]})`
                              : undefined,
                          }}
                        />
                        <span className="truncate max-w-[120px]">{report.productId.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">商品已删除</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{report.reason}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                    {report.detail || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel(report.status).cls}`}>
                      {statusLabel(report.status).text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {report.status === "pending" ? (
                      actionId === report._id ? (
                        <div className="bg-gray-50 rounded p-2 space-y-2 text-xs">
                          <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded py-1 px-2"
                          >
                            <option value="handle">通过（下架商品）</option>
                            <option value="dismiss">驳回（忽略）</option>
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
                              onClick={() => handleAction(report._id)}
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
                          onClick={() => setActionId(report._id)}
                          className="px-3 py-1 bg-yellow-500 text-gray-900 rounded text-xs hover:bg-yellow-600 transition-colors"
                        >
                          处理
                        </button>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    暂无举报记录
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

export default Reports;
