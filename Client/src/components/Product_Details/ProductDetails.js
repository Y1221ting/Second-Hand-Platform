import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaShoppingCart, FaChevronLeft, FaChevronRight, FaExpand, FaComment } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import Dialog from "./Dialog";
import Loading from "../Utility/Loading";
import ErrorBanner from "../Utility/ErrorBanner";
import Lightbox from "../Utility/Lightbox";
import Recommendations from "../Home/Recommendations";
import ContactSeller from "./ContactSeller";

// 价格格式化：整数去 .0，非整数保留一位小数
const formatPrice = (price) => {
  const num = Math.min(Number(price ?? 0), 9999.9);
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
};

const ProductDetails = ({ productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user ? user.id : null;
  const [clickedButtonId, setClickedButtonId] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [sellerContact, setSellerContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  // 获取卖家联系方式
  const handleContactSeller = async () => {
    if (!userId) {
      alert("请先登录");
      navigate("/login");
      return;
    }
    if (sellerContact) {
      setShowContact(true);
      return;
    }
    setContactLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/products/${productId}/seller-contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSellerContact(data);
        setShowContact(true);
      } else {
        const err = await response.json();
        alert(err.message || `获取联系方式失败（${response.status}）`);
      }
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setContactLoading(false);
    }
  };

  // 提取商品详情加载逻辑，useEffect 和重试按钮都能调用
  const fetchProductDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setNotFound(false);
    setProductDetails(null);
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProductDetails(data);
      } else if (response.status === 404) {
        setNotFound(true);
      } else {
        setFetchError("服务器响应异常，请稍后重试");
      }
    } catch {
      setFetchError("网络连接失败，请检查后重试");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  const handleConfirmPurchase = async (userData) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(userData), // 把 Dialog 填写的收货信息传到后端
        }
      );
      
      if (response.ok) {
        alert("购买成功！");
        // Refresh product details by fetching from API again
        const refreshResponse = await fetch(
          `/api/products/${productId}`
        );
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setProductDetails(refreshedData);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Purchase failed");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Network error, please try again");
    }
    setDialogOpen(false);
  };

  const handleAddToCart = (productId) => {
    if (!userId) {
      alert("请先登录后再购买");
      navigate("/login");
      return;
    }
    setClickedButtonId(productId);
    setDialogOpen(true);
    setTimeout(() => {
      setClickedButtonId(null);
    }, 1000); // Change the delay time as needed
    // Your actual add to cart logic can be added here
  };

  const handleAddToCartOnly = async (productId) => {
    if (!userId) {
      alert("请先登录");
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/cart/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await response.json();
      if (response.ok) {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      } else {
        alert(data.message || "加入购物车失败");
      }
    } catch (err) {
      alert("网络错误，请稍后重试");
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  if (isLoading) {
    return <Loading />;
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-xl text-gray-500 mb-2">商品不存在或已被删除</p>
        <Link to="/home" className="text-yellow-500 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  if (fetchError) {
    return <ErrorBanner message={fetchError} onRetry={fetchProductDetails} fullPage />;
  }

  return (
    <>
      <div className="rounded-lg shadow-md m-4 transition duration-300 hover:shadow-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 pb-20 md:pb-0">
      {userId === productDetails.uploadedBy?.id && (
        <Link
          to={`/product/${productId}/edit`}
          className="bg-gray-900 p-2 hover:text-yellow-500 text-white border-b-2 border-transparent font-semibold mb-4 inline-flex items-center gap-2 transform hover:scale-105 hover:shadow-2xl rounded-tl-lg rounded-br-lg transition-transform duration-300"
        >
          <span className="text-xl">
            <FaEdit />
          </span>
          <div>编辑</div>
        </Link>
      )}
      <div className="flex flex-col md:flex-row p-4 gap-6">
        {/* 图片轮播 */}
        <div className="w-full md:w-1/2 rounded-lg overflow-hidden bg-gray-200">
          {productDetails.images && productDetails.images.length > 1 ? (
            <>
              {/* 主图 */}
              <div className="relative group">
                <img
                  src={productDetails.images[activeImage]}
                  alt={productDetails.name}
                  width={800}
                  height={600}
                  className="w-full h-auto cursor-pointer"
                  style={{ display: 'block' }}
                  onClick={() => setLightboxOpen(true)}
                />
                {/* 左右箭头 */}
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => prev === 0 ? productDetails.images.length - 1 : prev - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronLeft className="text-sm" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => prev === productDetails.images.length - 1 ? 0 : prev + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaChevronRight className="text-sm" />
                </button>
                {/* 放大按钮 */}
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute right-2 bottom-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaExpand className="text-xs" />
                </button>
              </div>
              {/* 缩略图导航 */}
              <div className="flex gap-1 p-2 overflow-x-auto">
                {productDetails.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-colors ${
                      idx === activeImage ? "border-yellow-500" : "border-transparent hover:border-gray-400"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <img
              src={productDetails.images?.[0] || productDetails.image}
              alt={productDetails.name}
              width={800}
              height={600}
              loading="lazy"
              className="w-full h-auto cursor-pointer"
              style={{ display: 'block' }}
              onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
            />
          )}
        </div>

        {/* 灯箱全屏预览 — 统一 Lightbox 组件，单图也支持点击放大 */}
        {lightboxOpen && productDetails.images?.length > 0 && (
          <Lightbox
            images={productDetails.images}
            activeIndex={activeImage}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setActiveImage((prev) => prev === 0 ? productDetails.images.length - 1 : prev - 1)}
            onNext={() => setActiveImage((prev) => prev === productDetails.images.length - 1 ? 0 : prev + 1)}
            onSelect={(idx) => setActiveImage(idx)}
          />
        )}
        <div className="md:mt-0 flex-1 min-w-0">
          <h1 className="text-3xl font-semibold">{productDetails.name}</h1>
          <p className="text-gray-500 mt-2">
            发布者：{productDetails.uploadedBy?.name || '未知'}
            {productDetails.uploadedBy?.department && (
              <span className="ml-2">| {productDetails.uploadedBy.department} · {productDetails.uploadedBy.major}</span>
            )}
          </p>
          {productDetails.uploadedBy?.dormitory && (
            <p className="text-gray-500 mt-1">
              宿舍楼：{" "}
              {!user
                ? "登录后查看"
                : (productDetails.purchasedBy?.id === userId || userId === productDetails.uploadedBy?.id)
                  ? productDetails.uploadedBy.dormitory
                  : "购买后查看"
              }
            </p>
          )}
          {productDetails.uploadedBy?.phone && (
            <p className="text-gray-500 mt-1">
              联系电话：{" "}
              {!user
                ? "登录后查看联系方式"
                : (productDetails.purchasedBy?.id === userId || userId === productDetails.uploadedBy?.id)
                  ? productDetails.uploadedBy.phone
                  : productDetails.uploadedBy.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") + " [购买后查看完整号码]"
              }
            </p>
          )}
          {productDetails.uploadedBy?.wechat && (productDetails.purchasedBy?.id === userId || userId === productDetails.uploadedBy?.id) && (
            <p className="text-gray-500 mt-1">
              微信：{productDetails.uploadedBy.wechat}
            </p>
          )}
          {productDetails.uploadedBy?.qq && (productDetails.purchasedBy?.id === userId || userId === productDetails.uploadedBy?.id) && (
            <p className="text-gray-500 mt-1">
              QQ：{productDetails.uploadedBy.qq}
            </p>
          )}

          <p className="text-2xl font-semibold mt-4">
            ¥{formatPrice(productDetails.price)}
          </p>
          <p className="text-gray-600 mt-2">
            库存: {productDetails.quantity || 0}
          </p>
          <div className="buy-now-button-container">
            {userId === productDetails.uploadedBy?.id ? (
              <p className="mt-8 text-lg text-gray-500 italic">这是您的商品</p>
            ) : (
              <div className="hidden md:flex mt-8 gap-4 flex-wrap">
                <button
                  onClick={handleContactSeller}
                  disabled={contactLoading}
                  className="flex items-center px-5 py-3 rounded text-lg bg-blue-500 hover:bg-blue-600 text-white transition duration-300 disabled:opacity-60"
                >
                  <FaComment className="mr-2" />
                  {contactLoading ? "加载中..." : "联系卖家"}
                </button>
                <button
                  onClick={() => {
                    if (productDetails.status !== "sold_out" && productDetails.quantity > 0) {
                      handleAddToCartOnly(productDetails._id);
                    } else {
                      alert("该商品已售罄");
                    }
                  }}
                  disabled={productDetails.status === "sold_out" || productDetails.quantity <= 0}
                  className={`flex items-center px-5 py-3 rounded text-lg ${
                    productDetails.status === "sold_out" || productDetails.quantity <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : cartAdded
                      ? "bg-green-500"
                      : "bg-gray-800 hover:bg-gray-700"
                  } text-white transition duration-300`}
                >
                  <FaShoppingCart className="mr-2" />
                  {productDetails.status === "sold_out" || productDetails.quantity <= 0
                    ? "已售罄"
                    : cartAdded
                    ? "已加入 ✓"
                    : "加入购物车"}
                </button>
                <button
                  className={`flex items-center px-5 py-3 rounded text-lg ${
                    productDetails.status === "sold_out" || productDetails.quantity <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : clickedButtonId === productDetails._id
                      ? "bg-green-500"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-gray-800 transition duration-300 transform`}
                  onClick={() => {
                    if (productDetails.status !== "sold_out" && productDetails.quantity > 0) {
                      handleAddToCart(productDetails._id);
                    } else {
                      alert("该商品已售罄");
                    }
                  }}
                  disabled={productDetails.status === "sold_out" || productDetails.quantity <= 0}
                >
                  <span
                    className={`mr-2 ${
                      clickedButtonId === productDetails._id ? "animate-ping" : ""
                    } transition-transform`}
                  >
                    <FaShoppingCart />
                  </span>
                  {productDetails.status === "sold_out" || productDetails.quantity <= 0
                    ? "已售罄"
                    : "立即购买"}
                </button>
              </div>
            )}
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setDialogOpen(false)}
              onSave={handleConfirmPurchase}
              id={userId}
            />
            {showContact && sellerContact && (
              <ContactSeller
                contact={sellerContact}
                onClose={() => setShowContact(false)}
              />
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold">描述</h2>
            <p className="text-gray-900 mt-2">{productDetails.description}</p>
          </div>
        </div>
      </div>
      <div className="mt-8 p-4">
        <h2 className="text-xl font-semibold">规格参数</h2>
        <div className="border-t border-gray-300 mt-2 pt-2">
          {productDetails.specifications && Array.isArray(productDetails.specifications) && productDetails.specifications.length > 0 ? (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {productDetails.specifications.map((spec, index) => (
                <div
                  key={index}
                  className="p-2 text-gray-900 hover:text-yellow-500 transition-transform hover:scale-105 transform-gpu duration-300 hover:bg-gray-900 hover:shadow-md rounded-md"
                >
                  <dt className="font-semibold">{spec.key}</dt>
                  <dd className="text-sm font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-gray-500 py-4">
              {userId === productDetails.uploadedBy?.id
                ? "你还没有填写规格参数，编辑商品即可添加"
                : "卖家暂未填写规格参数"}
            </p>
          )}
        </div>
      </div>

      {/* 商品详情页推荐 */}
      <Recommendations
        userId={user?.id}
        excludeId={productId}
        department={productDetails.uploadedBy?.department}
      />
    </div>

      {/* 移动端底部固定操作栏（非本人商品） */}
      {userId !== productDetails.uploadedBy?.id && (
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] md:hidden z-40 px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={handleContactSeller}
            disabled={contactLoading}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-60"
          >
            <FaComment className="text-xs" />
            {contactLoading ? "加载中..." : "联系卖家"}
          </button>
          {productDetails.status === "sold_out" || productDetails.quantity <= 0 ? (
            <button
              className="flex-[2] py-2.5 rounded-lg bg-gray-400 text-white text-sm font-medium cursor-not-allowed flex items-center justify-center gap-1.5"
              disabled
            >
              <FaShoppingCart className="text-xs" />
              已售罄
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAddToCartOnly(productDetails._id)}
                className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  cartAdded
                    ? "bg-green-500 text-white"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                <FaShoppingCart className="text-xs" />
                {cartAdded ? "已加入 ✓" : "加购"}
              </button>
              <button
                onClick={() => handleAddToCart(productDetails._id)}
                className="flex items-center justify-center gap-1.5 flex-[1.3] py-2.5 rounded-lg bg-yellow-500 text-gray-900 text-sm font-medium hover:bg-yellow-400 transition-colors"
              >
                <FaShoppingCart className="text-xs" />
                立即购买
              </button>
            </>
          )}
        </div>
      </div>
      )}
    </>
  );
};

export default ProductDetails;
