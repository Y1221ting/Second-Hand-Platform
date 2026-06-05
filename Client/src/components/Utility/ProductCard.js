import React, { useState, memo } from "react";
import { FaShoppingCart, FaBolt, FaFlag } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import Highlight from "./Highlight";

const ProductCard = memo(({ product, isRecommended, searchTerm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clickedButtonId, setClickedButtonId] = useState(null);
  const [addMsg, setAddMsg] = useState({});
  const [reportMsg, setReportMsg] = useState("");
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [reportReason, setReportReason] = useState("信息不实");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const isOwner = user && user.id === product.uploadedBy?.id;

  const handleReport = async () => {
    if (!user) return;
    setReportSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, reason: reportReason, detail: reportDetail }),
      });
      if (res.ok) {
        setReportMsg("已举报");
        setShowReportPanel(false);
        setTimeout(() => setReportMsg(""), 2000);
      } else {
        const data = await res.json();
        alert(data.message || "举报失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("请先登录");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/cart/${product._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await response.json();
      if (response.ok) {
        setClickedButtonId(product._id);
        setAddMsg((prev) => ({ ...prev, [product._id]: { ok: true, msg: "已加入购物车" } }));
        setTimeout(() => {
          setClickedButtonId(null);
          setAddMsg((prev) => {
            const next = { ...prev };
            delete next[product._id];
            return next;
          });
        }, 1500);
      } else {
        alert(data.message || "加入购物车失败");
      }
    } catch (err) {
      alert("网络错误，请稍后重试");
    }
  };

  return (
    <div className="flex flex-col justify-between w-full bg-gray-900 text-white px-3 py-3 rounded-md hover:scale-105 transition-transform duration-200 overflow-hidden">
      <Link to={`/product/${product._id}`} className="text-blue-500 block ">
        <div className="relative">
          {/* [修正] 去掉 IntersectionObserver，直接用浏览器原生 loading="lazy"。首屏图片不再被 JS 推迟下载，修复 LCP 从 1.9s→3.0s 的退化 */}
          <div className="w-full h-40 mb-1.5 rounded-md bg-gray-700 overflow-hidden">
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                width={400}
                height={160}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {isRecommended && (
            <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              推荐
            </span>
          )}
        </div>
      </Link>
      <h3 className="text-base font-semibold mb-0.5 truncate" title={product.name}>
        <Highlight text={product.name} keyword={searchTerm} />
      </h3>
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs text-gray-300 truncate max-w-[60%]">
          {product.uploadedBy?.name || '未知'}
        </p>
        <p className="text-xs text-gray-400 shrink-0">
          库存 {product.quantity || 0}
        </p>
      </div>
      <p className="text-xs text-gray-400 truncate">{product.uploadedBy?.department} · {product.uploadedBy?.major}</p>

      <div className="mt-1.5">
        <p className="text-center text-lg font-semibold text-yellow-400 mb-1.5">
          ¥{Math.min(Number(product.price ?? 0), 9999.9).toFixed(1)}
        </p>

        {isOwner ? (
          <button
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-gray-600 text-gray-300 cursor-not-allowed text-xs"
            disabled
          >
            <FaShoppingCart />
            我的商品
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded text-xs border transition-colors duration-200 ${
                product.status === "sold_out" || product.quantity <= 0
                  ? "border-gray-500 text-gray-500 cursor-not-allowed"
                  : clickedButtonId === product._id
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-400 text-gray-300 hover:border-yellow-500 hover:text-yellow-500"
              }`}
              onClick={() => {
                if (product.status !== "sold_out" && product.quantity > 0) {
                  handleAddToCart();
                } else {
                  alert("该商品已售罄");
                }
              }}
              disabled={product.status === "sold_out" || product.quantity <= 0}
            >
              <FaShoppingCart className="shrink-0" />
              <span className="truncate">
                {product.status === "sold_out" || product.quantity <= 0
                  ? "已售罄"
                  : addMsg[product._id]?.ok
                  ? addMsg[product._id].msg
                  : "加购"}
              </span>
            </button>

            <button
              className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                product.status === "sold_out" || product.quantity <= 0
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
              }`}
              onClick={() => {
                if (product.status !== "sold_out" && product.quantity > 0) {
                  navigate(`/product/${product._id}`);
                } else {
                  alert("该商品已售罄");
                }
              }}
              disabled={product.status === "sold_out" || product.quantity <= 0}
            >
              <FaBolt className="shrink-0" />
              <span className="truncate">购买</span>
            </button>
          </div>
        )}
      </div>

      {/* 举报 — 非本人商品、已登录时显示 */}
      {user && !isOwner && (
        <div className="mt-1">
          {!showReportPanel ? (
            <button
              onClick={() => setShowReportPanel(true)}
              className="w-full text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
            >
              <FaFlag className="text-[8px]" />
              {reportMsg || "举报"}
            </button>
          ) : (
            <div className="bg-gray-800 rounded p-2 text-xs space-y-2">
              <p className="text-gray-300 text-[11px]">举报原因</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-gray-700 text-white rounded py-1 px-2 text-[11px] border border-gray-600"
              >
                <option value="信息不实">信息不实</option>
                <option value="违禁品">违禁品</option>
                <option value="重复发布">重复发布</option>
                <option value="人身攻击/骚扰">人身攻击/骚扰</option>
                <option value="其他">其他</option>
              </select>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="补充说明（选填）"
                className="w-full bg-gray-700 text-white rounded py-1 px-2 text-[11px] border border-gray-600 resize-none"
                rows="2"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleReport}
                  disabled={reportSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-1 text-[11px] disabled:opacity-50"
                >
                  {reportSubmitting ? "提交中..." : "确认举报"}
                </button>
                <button
                  onClick={() => setShowReportPanel(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded py-1 text-[11px]"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ProductCard;
