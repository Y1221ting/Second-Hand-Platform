import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserDetails from "./Profile/UserDetails";
import { useAuth } from "../context/authContext";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import ConfirmDialog from "./Profile/ConfirmDialog";
import ProductList from "./Profile/ProductList";
import Loading from "./Utility/Loading";

const UserProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("selling");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    fetch(`/api/users/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        setFormData(data);
      })
      .catch((error) => {
        console.error("Error fetching user data: ", error);
      });

    fetch(`/api/products/user/${id}`)
      .then((response) => response.json())
      .then((products) => {
        setUserProducts(products);
      })
      .catch((error) => {
        console.error("Error fetching user products: ", error);
      });

    fetch(`/api/products/purchased/${id}`)
      .then((response) => response.json())
      .then((products) => {
        setPurchasedProducts(products);
      })
      .catch((error) => {
        console.error("Error fetching purchased products: ", error);
      });
  }, [id, user, navigate]);

  // 挂载时获取购物车数据，无需等待切换到 cart 标签
  useEffect(() => {
    setCartLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setCartLoading(false);
      return;
    }

    fetch("/api/cart/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.cart || []);
      })
      .catch(() => setCartItems([]))
      .finally(() => setCartLoading(false));
  }, []);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = () => {
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      alert("手机号格式不正确，请输入11位中国手机号码");
      return;
    }

    // 地址长度校验（仅当填写了地址时）
    if (formData.address && formData.address.trim().length < 2) {
      alert("地址至少需要2个字符");
      return;
    }

    fetch(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        setEditMode(false);
      })
      .catch((error) => {
        console.error("Error updating user data: ", error);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDeleteProduct = (productId) => {
    setProductIdToDelete(productId);
    setShowConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setProductIdToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!productIdToDelete) {
        console.error("Invalid product ID.");
        setShowConfirmation(false);
        return;
      }

      const response = await fetch(
        `/api/products/${productIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setUserProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== productIdToDelete)
        );
      } else {
        console.error("Failed to delete the product.");
      }
    } catch (error) {
      console.error("Error deleting product: ", error);
    } finally {
      setShowConfirmation(false);
      setProductIdToDelete(null);
    }
  };

  if (!userData) {
    return <Loading />;
  }

  // 按状态分类商品
  const unsoldProducts = userProducts.filter((p) => p.status === "unsold");
  const soldOutProducts = userProducts.filter((p) => p.status === "sold_out");
  const inactiveProducts = userProducts.filter((p) => p.status === "inactive");
  const soldProducts = userProducts.filter((p) => p.status === "sold");

  // 格式化日期
  const joinDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "未知";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ===== 用户信息区域 ===== */}
        {editMode ? (
          /* 编辑模式：显示原有的 UserDetails 表单 */
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">编辑个人资料</h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消编辑
              </button>
            </div>
            <UserDetails
              userData={userData}
              displayEdit={user && user.id === id}
              editMode={editMode}
              formData={formData}
              handleChange={handleChange}
              handleEditClick={handleEditClick}
              handleSaveClick={handleSaveClick}
            />
          </div>
        ) : (
          /* 展示模式：用户信息卡片 */
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-5">
              {/* 头像 */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold text-2xl md:text-3xl shrink-0">
                {userData.fullName ? userData.fullName[0] : "?"}
              </div>
              {/* 用户信息 */}
              <div className="flex-grow min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {userData.fullName || "未设置昵称"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  📅 加入时间：{joinDate}
                </p>
                {userData.college && (
                  <p className="text-sm text-gray-500">
                    🏫 {userData.college}
                  </p>
                )}
                {userData.department && (
                  <p className="text-sm text-gray-500">
                    📚 {userData.department} · {userData.major}
                  </p>
                )}
                {userData.dormitory && (
                  <p className="text-sm text-gray-500">
                    🏠 {userData.dormitory}
                  </p>
                )}
              </div>
              {/* 操作按钮 */}
              {user && user.id === id && (
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                  >
                    编辑个人资料
                  </button>
                  <button
                    onClick={() => alert("地址管理功能将在后续版本开放")}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                  >
                    管理收货地址
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab 导航 ===== */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("selling")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "selling"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            在售 ({unsoldProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("soldOut")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "soldOut"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            已售罄 ({soldOutProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("inactive")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "inactive"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            已下架 ({inactiveProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "cart"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            购物车 ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "sold"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            出售记录 ({soldProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("purchased")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 ${
              activeTab === "purchased"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            购买记录 ({purchasedProducts.length})
          </button>
        </div>

        {/* ===== Tab 内容区 ===== */}
        {activeTab === "selling" && unsoldProducts.length > 0 && (
          <ProductList
            userProducts={unsoldProducts}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === "selling" && unsoldProducts.length === 0 && (
          <p className="text-gray-500 text-center py-12">暂无正在出售的商品</p>
        )}

        {activeTab === "soldOut" && soldOutProducts.length > 0 && (
          <ProductList
            userProducts={soldOutProducts}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === "soldOut" && soldOutProducts.length === 0 && (
          <p className="text-gray-500 text-center py-12">暂无已售罄的商品</p>
        )}

        {activeTab === "inactive" && inactiveProducts.length > 0 && (
          <ProductList
            userProducts={inactiveProducts}
            onDeleteProduct={handleDeleteProduct}
            showEdit={false}
            showView={true}
            showDelistReason
          />
        )}
        {activeTab === "inactive" && inactiveProducts.length === 0 && (
          <p className="text-gray-500 text-center py-12">没有被下架的商品</p>
        )}

        {activeTab === "sold" && soldProducts.length > 0 && (
          <ProductList
            userProducts={soldProducts}
            onDeleteProduct={() => {}}
            showDelete={false}
          />
        )}
        {activeTab === "sold" && soldProducts.length === 0 && (
          <p className="text-gray-500 text-center py-12">暂无出售记录</p>
        )}

        {activeTab === "purchased" && purchasedProducts.length > 0 && (
          <ProductList
            userProducts={purchasedProducts}
            onDeleteProduct={() => {}}
            showDelete={false}
          />
        )}
        {activeTab === "purchased" && purchasedProducts.length === 0 && (
          <p className="text-gray-500 text-center py-12">暂无购买记录</p>
        )}

        {activeTab === "cart" && cartLoading && (
          <p className="text-gray-500 text-center py-12">加载中...</p>
        )}
        {activeTab === "cart" && !cartLoading && cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              我的购物车 ({cartItems.length})
            </h3>
            {/* 可用商品 */}
            {cartItems.filter((item) => item.available !== false).map((item) => {
              if (!item.productId) return null;
              const p = item.productId;
              const price = Number(p.price ?? 0);
              return (
                <div
                  key={p._id}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div
                    className="w-14 h-14 rounded-lg bg-gray-200 bg-cover bg-center flex-shrink-0"
                    style={{
                      backgroundImage: p.images?.[0]
                        ? `url(${p.images[0]})`
                        : "none",
                    }}
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      ¥{price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">
                    ¥{(price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            {/* 失效商品 */}
            {cartItems.filter((item) => item.available === false).map((item) => {
              if (!item.productId) return null;
              const p = item.productId;
              const price = Number(p.price ?? 0);
              return (
                <div
                  key={p._id}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 bg-gray-50 opacity-70"
                >
                  <div
                    className="w-14 h-14 rounded-lg bg-gray-300 bg-cover bg-center flex-shrink-0 grayscale"
                    style={{
                      backgroundImage: p.images?.[0]
                        ? `url(${p.images[0]})`
                        : "none",
                    }}
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-400 truncate line-through">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      ¥{price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded whitespace-nowrap font-medium">
                    已失效
                  </span>
                </div>
              );
            })}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                共 {cartItems.length} 件商品
              </span>
              <Link
                to="/cart"
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                查看完整购物车 →
              </Link>
            </div>
          </div>
        )}
        {activeTab === "cart" && !cartLoading && cartItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">你的购物车还是空的。去看看同学院同学在卖什么 →</p>
            <Link
              to="/home"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              去逛逛
            </Link>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirmation && (
          <ConfirmDialog
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
