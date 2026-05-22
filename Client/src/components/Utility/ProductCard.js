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
    <div className="flex flex-col justify-between w-full bg-gray-900 text-white px-3 py-3 rounded-md hover:scale-105 transition-transform duration-200 overflow-hidden">
      <a href={`/product/${product._id}`} className="text-blue-500 block ">
        <div className="relative">
          <div
            ref={imageRef}
            className="w-full h-40 mb-1.5 rounded-md bg-gray-700"
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
      <h3 className="text-base font-semibold mb-0.5 truncate" title={product.name}>
        {product.name}
      </h3>
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs text-gray-300 truncate max-w-[60%]">
          {product.uploadedBy?.name || '未知'}
        </p>
        <p className="text-xs text-gray-400 shrink-0">
          库存 {product.quantity || 0}
        </p>
      </div>
      <p className="text-xs text-gray-400 truncate">{product.uploadedBy?.college}</p>

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
    </div>
  );
});

export default ProductCard;
