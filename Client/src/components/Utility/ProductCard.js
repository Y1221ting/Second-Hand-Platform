import React, { useState, memo, useEffect, useRef } from "react";
import { FaShoppingCart, FaBolt } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const ProductCard = memo(({ product, isRecommended }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clickedButtonId, setClickedButtonId] = useState(null);
  const [addMsg, setAddMsg] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);
  const isOwner = user && user.id === product.uploadedBy?.id;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
    <div className="m-2 flex flex-col justify-between flex-shrink-0 w-64 bg-gray-900 text-white px-4 py-5 rounded-md hover:scale-105 transition-transform duration-200">
      <a href={`/product/${product._id}`} className="text-blue-500 block ">
        <div className="relative">
          <div
            ref={imageRef}
            className="w-full h-52 mb-2 rounded-md bg-gray-700"
            style={
              imageLoaded
                ? {
                    backgroundImage: `url(${product.images[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : {}
            }
          ></div>
          {isRecommended && (
            <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              AI 推荐
            </span>
          )}
        </div>
      </a>
      <h3 className="text-lg font-semibold mb-1">
        {product.name.length > 40
          ? `${product.name.slice(0, 40)}...`
          : product.name}
      </h3>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-300">
          发布者：{product.uploadedBy?.name || '未知'}
        </p>
        <p className="text-sm text-gray-400">
          库存: {product.quantity || 0}
        </p>
      </div>
      <p className="text-sm text-gray-300">{product.uploadedBy?.college}</p>

      {/* 方案A：价格居中在上，双按钮并行 */}
      <div className="mt-2">
        <p className="text-center text-xl font-semibold text-yellow-400 mb-2">
          ¥{Math.min(Number(product.price ?? 0), 9999.9).toFixed(1)}
        </p>

        {isOwner ? (
          <button
            className="w-full flex items-center justify-center px-4 py-2 rounded bg-gray-600 text-gray-300 cursor-not-allowed"
            disabled
          >
            <span className="mr-2"><FaShoppingCart /></span>
            我的商品
          </button>
        ) : (
          <div className="flex gap-2">
            {/* 加入购物车 — 次要操作，边框样式 */}
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded text-sm border transition-colors duration-200 ${
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
              <FaShoppingCart className="mr-1 shrink-0" />
              <span className="truncate">
                {product.status === "sold_out" || product.quantity <= 0
                  ? "已售罄"
                  : addMsg[product._id]?.ok
                  ? addMsg[product._id].msg
                  : "加入购物车"}
              </span>
            </button>

            {/* 立即购买 — 主要操作，黄色填充 */}
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded text-sm font-medium transition-colors duration-200 ${
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
              <FaBolt className="mr-1 shrink-0" />
              <span className="truncate">立即购买</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
