import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { FaArrowLeft } from "react-icons/fa";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

// ── 相对时间工具（不引入第三方库） ──
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
};

const HOT_TAGS = ["高数课本", "二手手机", "台灯", "电动车", "四六级资料", "电风扇", "收纳箱", "考研资料"];
const QUICK_DESCS = ["九成新就行", "急用", "想收个二手", "价格可议"];

const WantedPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // ── 全部求购 ──
  const [wanteds, setWanteds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── 搜索 ──
  const [searchTerm, setSearchTerm] = useState("");
  const SEARCH_DEBOUNCE_MS = 500;

  // ── 我的求购 ──
  const [myWanteds, setMyWanteds] = useState([]);

  // ── 发布表单 ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", budget: "", contact: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedName, setPublishedName] = useState("");

  // ── 联系弹窗 ──
  const [contactTarget, setContactTarget] = useState(null);

  // ── 列表筛选 ──
  const [listFilter, setListFilter] = useState("all"); // "all" | "mine"

  // ── 获取数据 ──
  const fetchWanteds = useCallback(async (p, search = "", append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("page", p);
      params.set("limit", "20");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/wanted?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWanteds((prev) => (append ? [...prev, ...data.wanteds] : data.wanteds));
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchMyWanteds = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/wanted/mine", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setMyWanteds(await res.json());
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  // 搜索防抖：停止输入 500ms 后重新拉取
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWanteds(1, searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // 首次加载
  useEffect(() => {
    fetchWanteds(1, searchTerm);
    fetchMyWanteds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 加载更多 ──
  const handleLoadMore = () => {
    if (page < totalPages) fetchWanteds(page + 1, searchTerm, true);
  };

  // ── 发布求购 ──
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "budget" && Number(value) > 9999.9) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.budget) {
      alert("商品名称和预算为必填");
      return;
    }
    if (Number(form.budget) <= 0) {
      alert("预算需大于 0");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setPublishedName(form.name);
        setForm({ name: "", budget: "", contact: "", description: "" });
        setShowForm(false);
        setPublishSuccess(true);
        fetchWanteds(1, searchTerm);
        fetchMyWanteds();
        setTimeout(() => setPublishSuccess(false), 4000);
      } else {
        const data = await res.json();
        alert(data.message || "发布失败");
      }
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 删除我的求购 ──
  const handleDelete = async (id) => {
    if (!window.confirm("确认已买到？这条求购将从列表中移除。")) return;
    try {
      const res = await fetch(`/api/wanted/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setMyWanteds((prev) => prev.filter((w) => w._id !== id));
        setWanteds((prev) => prev.filter((w) => w._id !== id));
      } else {
        alert("删除失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  // ── 复制工具（降级兼容） ──
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── 发布成功提示条 ── */}
        {publishSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">✅ 求购「{publishedName}」已发布！</p>
              <p className="text-green-600 text-sm mt-0.5">去首页看看有没有人正在出售吧</p>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="text-sm px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
            >
              去逛逛
            </button>
          </div>
        )}

        {/* ── 标题行 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">同学求购</h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showForm
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {showForm ? "收起" : "发布求购"}
          </button>
        </div>

        {/* ── 发布表单（折叠） ── */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-green-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">发布求购</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 商品名称 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    商品名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="你想买什么？"
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                    required
                  />
                </div>
                {/* 预算 */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    预算（元） <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={form.budget}
                    onChange={handleFormChange}
                    placeholder="你能接受的最高价格"
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                    required
                    min="0"
                    max="9999.9"
                    step="0.1"
                  />
                </div>
                {/* 联系方式 */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    联系方式 <span className="text-gray-400 font-normal">（选填）— 填了别人才好联系你</span>
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={form.contact}
                    onChange={handleFormChange}
                    placeholder="微信号 / QQ号 / 手机号"
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                  />
                </div>
                {/* 描述 */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">描述（选填）</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {QUICK_DESCS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, description: d }))}
                        className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="对商品有什么要求？新旧程度、品牌偏好等..."
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                    rows="3"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  submitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {submitting ? "发布中..." : "发布求购"}
              </button>
            </form>
          </div>
        )}

        {/* ── 热门求购 ── */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
            🔥 热门求购
          </h2>
          <div className="flex flex-wrap gap-2">
            {HOT_TAGS.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── 全部求购（带筛选） ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-700">
              {listFilter === "all" ? "全部求购" : "我的求购"}
            </h2>
            {/* 筛选 pill */}
            {isAuthenticated && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setListFilter("all")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    listFilter === "all"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => {
                    setListFilter("mine");
                    setSearchTerm("");
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    listFilter === "mine"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  我发布的
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 搜索框 */}
        {listFilter === "all" && (
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍  搜索求购商品..."
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm px-2"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (listFilter === "mine" ? myWanteds : wanteds).length === 0 ? (
          /* 空状态 */
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{listFilter === "mine" ? "📭" : "📭"}</p>
            <p className="text-gray-400 text-lg mb-2">
              {listFilter === "mine" ? "你还没有发布求购" : "还没有同学发布求购"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {listFilter === "mine" ? "发布后可以在这里管理" : "快来发布第一条吧！"}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              发布求购
            </button>
          </div>
        ) : (
          <>
            {/* 求购卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(listFilter === "mine" ? myWanteds : wanteds).map((w) => {
                const isMine = user?.id && w.postedBy?.id === user.id;
                return (
                <div
                  key={w._id}
                  className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow ${
                    isMine ? "border-green-200" : "border-gray-100"
                  }`}
                >
                  {/* 标题行：标签 + 名称 + 时间 */}
                  <div className="flex items-start justify-between mb-2 gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {isMine && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium shrink-0 leading-tight">
                          👤 我
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(w.createdAt)}</span>
                  </div>

                  {/* 预算 */}
                  <p className="text-green-600 font-bold text-lg mb-1">¥{Number(w.budget || 0).toFixed(1)}</p>

                  {/* 描述 */}
                  {w.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{w.description}</p>
                  )}

                  {/* 底部：发布人 + 联系方式 + 操作按钮 */}
                  <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-gray-50 gap-1">
                    <span className="text-xs text-gray-400 truncate max-w-[50%]">
                      {w.postedBy?.department || ""} · {w.postedBy?.name || "同学"}
                    </span>
                    {isMine ? (
                      <button
                        onClick={() => handleDelete(w._id)}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-green-100 hover:text-green-600 transition-colors shrink-0"
                      >
                        下架 ✓
                      </button>
                    ) : w.contact ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">
                          📱 {w.contact}
                        </span>
                        <button
                          onClick={() => setContactTarget(w)}
                          className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
                        >
                          联系TA
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 shrink-0">暂无联系方式</span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* 加载更多（仅「全部」列表显示） */}
            {listFilter === "all" && page < totalPages && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors ${
                    loadingMore
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {loadingMore ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 联系弹窗 ── */}
      {contactTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setContactTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-5 w-80 max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-1">联系发布者</h3>
            <p className="text-sm text-gray-500 mb-4">
              求购「{contactTarget.name}」
            </p>

            {/* 对方联系方式 */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">📞 对方留下的联系方式：</p>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 break-all">
                {contactTarget.contact}
              </div>
            </div>

            {/* 预设话术 */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">💬 复制以下话术加好友：</p>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-600 leading-relaxed">
                同学你好，我在校园二手市场看到你求购「{contactTarget.name}」，
                我正好有，方便通过一下吗？
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  copyToClipboard(contactTarget.contact);
                  alert("✅ 联系方式已复制，去微信/QQ粘贴添加好友吧！");
                }}
                className="flex-1 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                📋 复制联系方式
              </button>
              <button
                onClick={() => {
                  const msg = `同学你好，我在校园二手市场看到你求购「${contactTarget.name}」，我正好有，方便通过一下吗？`;
                  copyToClipboard(msg);
                  alert("✅ 话术已复制，快去粘贴联系TA吧！");
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                💬 复制话术
              </button>
            </div>

            <button
              onClick={() => setContactTarget(null)}
              className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default WantedPage;
