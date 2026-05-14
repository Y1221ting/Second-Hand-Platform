import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = () => {
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
