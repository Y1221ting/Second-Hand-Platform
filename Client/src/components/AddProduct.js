// AddProduct.js
import React, { useState } from "react";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { FaMagic } from "react-icons/fa";

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [aiLoading, setAiLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (specificationField) {
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

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert("请先输入商品名称");
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch(
        `/api/ai/generate-description`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productName: formData.name,
            category: formData.category,
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          description: data.description,
        });
      } else {
        const error = await response.json();
        alert(error.message || "生成失败，请稍后重试");
      }
    } catch (error) {
      console.error("AI生成描述失败:", error);
      alert("生成失败，请检查网络连接");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRecommendCategory = async () => {
    if (!formData.name) {
      alert("请先输入商品名称");
      return;
    }
    setCategoryLoading(true);
    try {
      const response = await fetch(
        `/api/ai/recommend-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productName: formData.name,
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          category: data.category,
        });
      } else {
        const error = await response.json();
        alert(error.message || "推荐失败，请稍后重试");
      }
    } catch (error) {
      console.error("AI推荐分类失败:", error);
      alert("推荐失败，请检查网络连接");
    } finally {
      setCategoryLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const imagePromises = formData.images.map((image) =>
      getBase64(image).catch((error) =>
        console.error("Error converting image:", error)
      )
    );

    try {
      const base64Images = await Promise.all(imagePromises);
      const response = await fetch(`/api/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          images: base64Images,
          uploadedBy: {
            _id: user.id,
            name: user.fullName,
            college: user.college,
          },
        }),
      });

      if (response.ok) {
        alert("商品发布成功！");
        navigate("/home");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "发布失败，请稍后重试");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`发布失败：${error.message || "请检查网络连接"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to convert an image file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-4/5 mx-auto py-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          发布新商品
        </h1>
        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-600">
              商品名称
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg py-2 px-3"
              required
            />
          </div>

          {/* Product Category Dropdown */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="category" className="block text-gray-600">
                分类
              </label>
              <button
                type="button"
                onClick={handleRecommendCategory}
                disabled={categoryLoading}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition duration-300 ${
                  categoryLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
              >
                <FaMagic />
                {categoryLoading ? "推荐中..." : "AI推荐分类"}
              </button>
            </div>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg py-2 px-3"
              required
            >
              <option value="other">其他</option>
              <option value="electronics">电子产品</option>
              <option value="furniture">家具</option>
              <option value="clothing">服装鞋帽</option>
              <option value="books">书籍教材</option>
              <option value="sports">运动户外</option>
              <option value="food">食品生鲜</option>
              <option value="transportation">交通工具</option>
              <option value="beauty">美妆个护</option>
              <option value="home">家居日用</option>
            </select>
          </div>

          {/* Product Description */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="description" className="block text-gray-600">
                描述
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={aiLoading}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition duration-300 ${
                  aiLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
              >
                <FaMagic />
                {aiLoading ? "生成中..." : "AI生成描述"}
              </button>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-lg py-2 px-3"
              required
            />
          </div>

          {/* Product Price */}
          <div className="mb-4">
            <label htmlFor="price" className="block text-gray-600">
              价格（元）
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg py-2 px-3"
              required
              min="0"
            />
          </div>

          {/* Product Images */}
          <div className="mb-4">
            <label htmlFor="images" className="block text-gray-600">
              图片
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: Array.from(e.target.files),
                })
              }
              className="w-full border rounded-lg py-2 px-3"
              required
            />
          </div>

          {/* Product Specifications (if applicable) */}
          {/* Product Specifications */}
          <div className="mb-4">
            <label htmlFor="specifications" className="block text-gray-600">
              规格参数
            </label>
            {formData.specifications.map((spec, index) => (
              <div key={index} className="flex mb-2 justify-between">
                <input
                  type="text"
                  name={`specification-${index}-key`}
                  value={spec.key}
                  readOnly
                  className="w-[45%] border rounded-lg py-2 px-3 bg-gray-200 mr-2"
                  disabled
                />
                <input
                  type="text"
                  name={`specification-${index}-value`}
                  value={spec.value}
                  readOnly
                  className="w-[45%] border rounded-lg py-2 px-3 bg-gray-200 mr-2"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecification(index)}
                  className="w-32 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                >
                  删除
                </button>
              </div>
            ))}
            <div className="flex flex-col md:flex-row justify-between">
              <input
                type="text"
                id="specificationKeyField"
                name="specificationKeyField"
                value={specificationField.key}
                onChange={(e) =>
                  setSpecificationField({
                    ...specificationField,
                    key: e.target.value,
                  })
                }
                className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0"
                placeholder="键"
              />
              <input
                type="text"
                id="specificationValueField"
                name="specificationValueField"
                value={specificationField.value}
                onChange={(e) =>
                  setSpecificationField({
                    ...specificationField,
                    value: e.target.value,
                  })
                }
                className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0"
                placeholder="值"
              />
              <button
                type="button"
                onClick={handleAddSpecification}
                className="w-full md:w-32 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition duration-300"
              >
                添加
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 rounded-lg transition duration-300 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            >
              {submitting ? "发布中..." : "发布商品"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default AddProduct;
