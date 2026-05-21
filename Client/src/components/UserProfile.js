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

  // 购物车标签：激活时才获取数据
  useEffect(() => {
    if (activeTab !== "cart") return;
    setCartLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/cart/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCartItems(data.cart || []);
      })
      .catch(() => setCartItems([]))
      .finally(() => setCartLoading(false));
  }, [activeTab]);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = () => {
    // 学校字段校验：手动输入的必须以"大学"或"学院"结尾
    const college = formData.college || "";
    if (college && !(/(大学|学院)$/.test(college))) {
      alert('学校名称必须以"大学"或"学院"结尾');
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-4/5 mx-auto py-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          用户资料
        </h1>
        {userData && (
          <UserDetails
            userData={userData}
            displayEdit={user && user.id === id}
            editMode={editMode}
            formData={formData}
            handleChange={handleChange}
            handleEditClick={handleEditClick}
            handleSaveClick={handleSaveClick}
          />
        )}
        <div className="mt-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("selling")}
              className={`px-6 py-2 rounded-lg font-semibold transition duration-300 ${
                activeTab === "selling"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              我发布的 ({userProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-6 py-2 rounded-lg font-semibold transition duration-300 ${
                activeTab === "purchased"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              我购买的 ({purchasedProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("cart")}
              className={`px-6 py-2 rounded-lg font-semibold transition duration-300 ${
                activeTab === "cart"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              购物车 ({cartItems.length})
            </button>
          </div>
          {activeTab === "selling" && userProducts.length > 0 && (
            <ProductList
              userProducts={userProducts}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
          {activeTab === "purchased" && purchasedProducts.length > 0 && (
            <ProductList
              userProducts={purchasedProducts}
              onDeleteProduct={() => {}}
              showDelete={false}
            />
          )}
          {activeTab === "selling" && userProducts.length === 0 && (
            <p className="text-gray-500 text-center py-8">暂无发布的商品</p>
          )}
          {activeTab === "purchased" && purchasedProducts.length === 0 && (
            <p className="text-gray-500 text-center py-8">暂无购买的记录</p>
          )}
          {activeTab === "cart" && cartLoading && (
            <p className="text-gray-500 text-center py-8">加载中...</p>
          )}
          {activeTab === "cart" && !cartLoading && cartItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              {cartItems.map((item) => {
                if (!item.productId) return null;
                const p = item.productId;
                const price = parseFloat(p.price) || 0;
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
                      <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-sm text-gray-500">
                        ¥{price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ¥{(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="mt-4 text-center">
                <Link
                  to="/cart"
                  className="text-yellow-600 hover:text-yellow-700 font-semibold"
                >
                  查看完整购物车 →
                </Link>
              </div>
            </div>
          )}
          {activeTab === "cart" && !cartLoading && cartItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">购物车是空的</p>
              <Link
                to="/home"
                className="inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                去逛逛
              </Link>
            </div>
          )}
        </div>
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
