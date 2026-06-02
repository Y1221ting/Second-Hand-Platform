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
    images: [],       // 已有图片 URL (字符串)
    specifications: [],
  });
  const [newImages, setNewImages] = useState([]);  // 新增图片 File 对象
  const [specificationField, setSpecificationField] = useState({
    key: "",
    value: "",
  });
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
    if (file) {
      setNewImages(prev => [...prev, file]);
      setImageFieldError("");
    }
    e.target.value = ""; // reset input
  };

  // Remove an existing image
  const handleRemoveImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({ ...formData, images: updatedImages });
  };

  // Remove a new (not yet uploaded) image
  const handleRemoveNewImage = (index) => {
    const updated = [...newImages];
    updated.splice(index, 1);
    setNewImages(updated);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price" && Number(value) > 9999.9) {
      alert("价格不能超过 ¥9999.9（以角为最小单位）");
      return;
    }
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
      setSpecificationField({ key: "", value: "" });
    }
  };

  // Remove a specification from the specifications array
  const handleRemoveSpecification = (index) => {
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications.splice(index, 1);
    setFormData({ ...formData, specifications: updatedSpecifications });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price) {
      alert("请填写所有必填字段");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        navigate("/login");
        return;
      }

      // Step 1: 上传新增图片（File → URL）
      let uploadedUrls = [];
      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach((file) => fd.append("images", file));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          alert(errData.message || "图片上传失败");
          return;
        }

        const uploadData = await uploadRes.json();
        uploadedUrls = uploadData.urls;
      }

      // Step 2: 合并已有图片 URL + 新上传的 URL
      const allImages = [...formData.images, ...uploadedUrls];

      // Step 3: 更新商品（不含 images，图片通过 addImage/removeImage 接口管理）
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          images: allImages,
        }),
      });

      if (response.ok) {
        navigate(`/product/${id}`);
      } else {
        const errorData = await response.json();
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
            images: data.images || [],
            specifications: data.specifications || [],
          });
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
          imageFieldError={imageFieldError}
          handleRemoveImage={handleRemoveImage}
          handleRemoveNewImage={handleRemoveNewImage}
          newImages={newImages}
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
