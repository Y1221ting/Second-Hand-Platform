import React, { useState, useEffect } from "react";
import Loading from "../Utility/Loading";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState(null);
  const [actionStatus, setActionStatus] = useState("inactive");
  const [actionReason, setActionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("获取商品列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const handleAction = async (productId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const body = { status: actionStatus };
      if (actionStatus === "inactive" && actionReason) {
        body.reason = actionReason;
      }
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setActionId(null);
        setActionReason("");
        fetchProducts();
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
    const map = {
      unsold: { text: "在售", cls: "bg-green-100 text-green-800" },
      sold: { text: "已售", cls: "bg-blue-100 text-blue-800" },
      sold_out: { text: "售罄", cls: "bg-gray-100 text-gray-800" },
      inactive: { text: "已下架", cls: "bg-red-100 text-red-800" },
    };
    return map[s] || { text: s, cls: "" };
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">商品管理</h1>

      {/* 搜索 + 筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索商品名称/卖家..."
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
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="py-2 px-3 rounded-lg bg-white border border-gray-300 text-sm"
        >
          <option value="">全部状态</option>
          <option value="unsold">在售</option>
          <option value="sold">已售</option>
          <option value="sold_out">售罄</option>
          <option value="inactive">已下架</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">商品</th>
                <th className="text-left px-4 py-3">卖家</th>
                <th className="text-left px-4 py-3">价格</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-left px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded bg-gray-200 bg-cover bg-center flex-shrink-0"
                        style={{
                          backgroundImage: product.images?.[0]
                            ? `url(${product.images[0]})`
                            : undefined,
                        }}
                      />
                      <span className="truncate max-w-[150px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.uploadedBy?.name || "-"}</td>
                  <td className="px-4 py-3 font-medium">¥{Number(product.price) || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel(product.status).cls}`}>
                      {statusLabel(product.status).text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    {actionId === product._id ? (
                      <div className="bg-gray-50 rounded p-2 space-y-2 text-xs">
                        <select
                          value={actionStatus}
                          onChange={(e) => setActionStatus(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded py-1 px-2"
                        >
                          {product.status === "inactive" ? (
                            <option value="unsold">恢复上架</option>
                          ) : (
                            <option value="inactive">下架商品</option>
                          )}
                        </select>
                        {actionStatus === "inactive" && (
                          <input
                            type="text"
                            placeholder="下架原因"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded py-1 px-2"
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(product._id)}
                            disabled={submitting}
                            className="px-2 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600 disabled:opacity-50"
                          >
                            {submitting ? "处理中..." : "确认"}
                          </button>
                          <button
                            onClick={() => { setActionId(null); setActionReason(""); }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActionId(product._id);
                          setActionStatus(product.status === "inactive" ? "unsold" : "inactive");
                        }}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          product.status === "inactive"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {product.status === "inactive" ? "恢复" : "下架"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    暂无商品
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

export default Products;
