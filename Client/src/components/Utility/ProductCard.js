import React, { useState, memo } from "react";
import { FaShoppingCart, FaFlag } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { Link } from "react-router-dom";
import Highlight from "./Highlight";

// 价格格式化：整数去 .0，非整数保留一位小数
const formatPrice = (price) => {
  const num = Math.min(Number(price ?? 0), 9999.9);
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
};

const ProductCard = memo(({ product, isRecommended, searchTerm }) => {
  const { user } = useAuth();
  const [clickedButtonId, setClickedButtonId] = useState(null);
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
        setTimeout(() => {
          setClickedButtonId(null);
        }, 1500);
      } else {
        alert(data.message || "加入购物车失败");
      }
    } catch (err) {
      alert("网络错误，请稍后重试");
    }
  };

  return (
    <div className="flex flex-col w-full bg-gray-900 text-white rounded-md overflow-hidden hover:scale-105 transition-transform duration-200">
      {/* 图片区域 — 点击进详情 */}
      <Link to={`/product/${product._id}`} className="relative block">
        <div className="aspect-square bg-gray-700 overflow-hidden">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {isRecommended && (
          <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
            推荐
          </span>
        )}
        {product.status === "sold_out" || product.quantity <= 0 ? (
          <span className="absolute top-1.5 right-1.5 bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-sm z-10">
            已售罄
          </span>
        ) : null}

        {/* 加购按钮 — 覆盖在图片右下角 */}
        {!isOwner && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) { alert("请先登录"); return; }
              handleAddToCart();
            }}
            disabled={product.status === "sold_out" || product.quantity <= 0}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
              product.status === "sold_out" || product.quantity <= 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : clickedButtonId === product._id
                ? "bg-green-500 text-white scale-110"
                : "bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:scale-110"
            }`}
            title="加入购物车"
          >
            {clickedButtonId === product._id ? (
              <span className="text-xs font-bold">✓</span>
            ) : (
              <FaShoppingCart size={14} />
            )}
          </button>
        )}
      </Link>

      {/* 内容区域 */}
      <div className="p-2.5 flex flex-col gap-1.5">
        <h3 className="text-sm font-medium leading-tight line-clamp-2" title={product.name}>
          <Highlight text={product.name} keyword={searchTerm} />
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-yellow-400">
            ¥{formatPrice(product.price)}
          </p>
          {isOwner && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
              我的
            </span>
          )}
        </div>

        {/* 举报 — 极小化入口 */}
        {user && !isOwner && (
          <div className="mt-0.5">
            {!showReportPanel ? (
              <button
                onClick={() => setShowReportPanel(true)}
                className="text-[10px] text-gray-600 hover:text-red-400 transition-colors flex items-center gap-0.5"
              >
                <FaFlag className="text-[8px]" />
                {reportMsg || "举报"}
              </button>
            ) : (
              <div className="bg-gray-800 rounded p-1.5 space-y-1">
                <p className="text-gray-300 text-[10px]">举报原因</p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded py-0.5 px-1 text-[10px] border border-gray-600"
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
                  className="w-full bg-gray-700 text-white rounded py-0.5 px-1 text-[10px] border border-gray-600 resize-none"
                  rows="1"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-0.5 text-[10px] disabled:opacity-50"
                  >
                    {reportSubmitting ? "..." : "确认"}
                  </button>
                  <button
                    onClick={() => setShowReportPanel(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded py-0.5 text-[10px]"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
