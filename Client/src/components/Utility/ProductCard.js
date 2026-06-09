import React, { useState, memo } from "react";
import { FaShoppingCart } from "react-icons/fa";
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
  const isOwner = user && user.id === product.uploadedBy?.id;


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

      </div>
    </div>
  );
});

export default ProductCard;
