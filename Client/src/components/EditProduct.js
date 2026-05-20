import React, { useState, useEffect } from "react";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import ProductForm from "./Edit_Product/ProductForm";

const EditProduct = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    description: "",
    price: "",
    images: [],
    specifications: [],
  });
  const [specificationField, setSpecificationField] = useState({
    key: "",
    value: "",
  });
  const [imageField, setImageField] = useState(null);
  const [imageFieldError, setImageFieldError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Handle image file change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageField(file);
    setImageFieldError(""); // Clear any previous error messages
  };

  // Add a new image to the images array after converting it to base64
  const handleAddImage = () => {
    if (imageField) {
      const reader = new FileReader();
      reader.readAsDataURL(imageField);
      reader.onloadend = () => {
        const base64Image = reader.result; // Get the base64 representation of the image
        setFormData({
          ...formData,
          images: [...formData.images, base64Image],
        });
        setImageField(""); // Clear the image field
        setImageFieldError(""); // Clear any previous error messages
      };
    } else {
      setImageFieldError("Please select an image file.");
    }
  };

  // Remove an image from the images array
  const handleRemoveImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages,
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Add a new specification to the specifications array
  const handleAddSpecification = () => {
    if (specificationField.key && specificationField.value) {
      setFormData({
        ...formData,
        specifications: [...formData.specifications, specificationField],
      });
      setSpecificationField({
        key: "",
        value: "",
      }); // Clear the specification field
    }
  };

  // Remove a specification from the specifications array
  const handleRemoveSpecification = (index) => {
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications.splice(index, 1);
    setFormData({
      ...formData,
      specifications: updatedSpecifications,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Perform client-side validation, for example, ensuring required fields are filled
    if (!formData.name || !formData.description || !formData.price) {
      console.error("Please fill out all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        console.log("Product updated successfully!");
        navigate(`/product/${id}`);
      } else {
        const errorData = await response.json();
        console.error("Failed to update product:", errorData);
        if (response.status === 403) {
          alert("权限不足：您只能编辑自己发布的商品");
        } else if (response.status === 401) {
          alert("登录已过期，请重新登录");
          navigate("/login");
        } else {
          alert("更新失败：" + (errorData.message || "未知错误"));
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("网络错误，请稍后重试");
    }
  };

  // Fetch product details for editing
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          // 检查是否是商品所有者
          if (user && data.uploadedBy?.id !== user.id) {
            alert("您没有权限编辑此商品");
            navigate("/home");
            return;
          }
          setIsOwner(true);
          setFormData({
            name: data.name,
            category: data.category,
            description: data.description,
            price: data.price,
            images: data.images,
            specifications: data.specifications,
          });
        } else {
          console.error("Failed to fetch product details");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProductDetails();
    }
  }, [id, user, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="w-4/5 mx-auto py-4 text-center text-gray-500">
          加载中...
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="w-4/5 mx-auto py-4 text-center">
          <div className="text-red-500 text-xl mt-10">您没有权限编辑此商品</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-4/5 mx-auto py-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          编辑商品
        </h1>
        <ProductForm
          formData={formData}
          handleChange={handleChange}
          handleImageChange={handleImageChange}
          handleAddImage={handleAddImage}
          imageFieldError={imageFieldError}
          handleRemoveImage={handleRemoveImage}
          specificationField={specificationField}
          setSpecificationField={setSpecificationField}
          handleAddSpecification={handleAddSpecification}
          handleRemoveSpecification={handleRemoveSpecification}
          handleSubmit={handleSubmit}
        />
      </div>
      <Footer />
    </div>
  );
};

export default EditProduct;
