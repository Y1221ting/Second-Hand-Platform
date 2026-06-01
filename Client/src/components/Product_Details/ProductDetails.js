import React, { useState, useEffect } from "react";
import { FaEdit, FaShoppingCart, FaStar, FaComment, FaChevronLeft, FaChevronRight, FaTimes, FaExpand } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import Dialog from "./Dialog";
import Loading from "../Utility/Loading";
import Recommendations from "../Home/Recommendations";

const ProductDetails = ({ productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user ? user.id : null;
  const [clickedButtonId, setClickedButtonId] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [cartAdded, setCartAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);

  const [isDialogOpen, setDialogOpen] = useState(false);

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
    // Fetch the product details from the API using the productID from the URL params
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(
          `/api/products/${productId}`
        ); // Replace with your API endpoint
        if (response.ok) {
          const data = await response.json();
          setProductDetails(data);
        } else {
          console.error("Failed to fetch product details");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // 获取卖家评分
  useEffect(() => {
    if (!productDetails?.uploadedBy?.id) return;
    fetch(`/api/reviews/user/${productDetails.uploadedBy.id}/stats`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setSellerRating(data); })
      .catch(() => {});
  }, [productDetails?.uploadedBy?.id]);

  // 联系卖家 → 创建/查找会话 → 跳转聊天
  const handleContactSeller = async () => {
    if (!user) {
      alert("请先登录");
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId: productDetails.uploadedBy.id,
          productId: productDetails._id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/messages/${data.conversation._id}`);
      }
    } catch {
      alert("网络错误");
    }
  };

  if (!productDetails) {
    return <Loading />;
  }

  return (
    <div className="rounded-lg shadow-md m-4 transition duration-300 hover:shadow-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
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
              className="w-full h-auto"
              style={{ display: 'block' }}
            />
          )}
        </div>

        {/* 灯箱全屏预览 */}
        {lightboxOpen && productDetails.images && productDetails.images.length > 1 && (
          <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
            >
              <FaTimes className="text-lg" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => prev === 0 ? productDetails.images.length - 1 : prev - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <img
              src={productDetails.images[activeImage]}
              alt={productDetails.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((prev) => prev === productDetails.images.length - 1 ? 0 : prev + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
            >
              <FaChevronRight className="text-lg" />
            </button>
            {/* 灯箱缩略图 */}
            <div className="absolute bottom-4 flex gap-1">
              {productDetails.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === activeImage ? "bg-yellow-500" : "bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
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
              宿舍楼：{productDetails.uploadedBy.dormitory}
            </p>
          )}
          {productDetails.uploadedBy?.phone && (
            <p className="text-gray-500 mt-1">
              联系电话：{" "}
              {!user
                ? "登录后查看联系方式"
                : productDetails.purchasedBy?.id === userId
                  ? productDetails.uploadedBy.phone
                  : productDetails.uploadedBy.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") + " [购买后查看完整号码]"
              }
            </p>
          )}

          {/* 卖家信用卡片 */}
          {sellerRating && sellerRating.totalReviews > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <FaStar className="text-yellow-500" />
              <span className="font-semibold text-gray-900">{sellerRating.avgRating}</span>
              <span className="text-gray-500">· 好评率 {sellerRating.positiveRate}%</span>
              <span className="text-gray-400">· {sellerRating.totalReviews} 条评价</span>
            </div>
          )}

          <p className="text-2xl font-semibold mt-4">
            ¥{Math.min(Number(productDetails.price ?? 0), 9999.9).toFixed(1)}
          </p>
          <p className="text-gray-600 mt-2">
            库存: {productDetails.quantity || 0}
          </p>
          <div className="buy-now-button-container">
            {userId === productDetails.uploadedBy?.id ? (
              <p className="mt-8 text-lg text-gray-500 italic">这是您的商品</p>
            ) : (
              <div className="mt-8 flex gap-4 flex-wrap">
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
                <button
                  onClick={handleContactSeller}
                  className="flex items-center px-5 py-3 rounded text-lg bg-blue-500 hover:bg-blue-600 text-white transition duration-300"
                >
                  <FaComment className="mr-2" />
                  联系卖家
                </button>
              </div>
            )}
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setDialogOpen(false)}
              onSave={handleConfirmPurchase}
              id={userId}
            />
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
            <p className="text-gray-500 py-4">暂无规格参数</p>
          )}
        </div>
      </div>

      {/* 商品详情页推荐 */}
      <Recommendations
        userId={user?.id}
        excludeId={productId}
        category={productDetails.category}
        department={productDetails.uploadedBy?.department}
        major={productDetails.uploadedBy?.major}
        sellerId={productDetails.uploadedBy?.id}
      />
    </div>
  );
};

export default ProductDetails;
