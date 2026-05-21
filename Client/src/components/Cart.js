import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart, FaArrowLeft, FaMinus, FaPlus } from "react-icons/fa";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import Loading from "./Utility/Loading";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch("/api/cart/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart || []);
      } else {
        const errData = await response.json();
        setError(errData.message || "获取购物车失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/cart/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart || []);
      } else {
        const errData = await response.json();
        alert(errData.message || "修改数量失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm("确定要从购物车移除该商品吗？")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart || []);
      } else {
        const errData = await response.json();
        alert(errData.message || "移除失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const handleCheckout = async () => {
    if (!window.confirm(`共 ${cartItems.length} 件商品，确认结算？`)) return;
    setCheckingOut(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cart/checkout/all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "结算成功！");
        setCartItems([]);
      } else {
        alert(data.message || "结算失败");
      }
    } catch (err) {
      alert("网络错误，结算失败");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("确定要清空购物车吗？")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cart/", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setCartItems([]);
      } else {
        const errData = await response.json();
        alert(errData.message || "清空失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  // 计算总价
  const totalPrice = cartItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    const price = parseFloat(item.productId.price) || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <FaShoppingCart className="text-yellow-500" />
              购物车
            </h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <FaTrash size={14} />
              清空购物车
            </button>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchCart}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">购物车是空的</p>
            <p className="text-gray-400 mb-6">快去挑选心仪的商品吧</p>
            <Link
              to="/home"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <>
            {/* 购物车列表 */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                if (!item.productId) return null;
                const product = item.productId;
                const price = parseFloat(product.price) || 0;
                const outOfStock = product.quantity <= 0 || product.status === "sold_out" || product.status === "inactive";

                return (
                  <div
                    key={product._id}
                    className={`bg-white rounded-lg shadow p-4 flex gap-4 items-center ${
                      outOfStock ? "opacity-60" : ""
                    }`}
                  >
                    {/* 商品图片 */}
                    <Link to={`/product/${product._id}`} className="flex-shrink-0">
                      <div
                        className="w-20 h-20 rounded-lg bg-gray-200 bg-cover bg-center"
                        style={{
                          backgroundImage: product.images?.[0]
                            ? `url(${product.images[0]})`
                            : "none",
                        }}
                      />
                    </Link>

                    {/* 商品信息 */}
                    <div className="flex-grow min-w-0">
                      <Link
                        to={`/product/${product._id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-yellow-600 transition-colors truncate block"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        单价：¥{price.toFixed(2)}
                      </p>
                      {outOfStock && (
                        <p className="text-sm text-red-500 mt-1 font-medium">该商品已售罄或已下架</p>
                      )}
                    </div>

                    {/* 数量操作 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || outOfStock}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(product._id, item.quantity + 1)}
                        disabled={item.quantity >= product.quantity || outOfStock}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>

                    {/* 小计 */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-lg font-semibold text-gray-900">
                        ¥{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* 删除 */}
                    <button
                      onClick={() => handleRemoveItem(product._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      title="移除"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 底部汇总 */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg text-gray-600">共 {cartItems.length} 件商品</span>
                <span className="text-2xl font-bold text-gray-900">
                  合计：¥{totalPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                  checkingOut
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                }`}
              >
                {checkingOut ? "结算中..." : "去结算"}
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
