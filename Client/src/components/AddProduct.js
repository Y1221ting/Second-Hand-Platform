// AddProduct.js
import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle, FaPlus, FaArrowLeft } from "react-icons/fa";

// 按分类的常用规格建议
const SPEC_SUGGESTIONS = {
  教材教辅: ["作者", "出版社", "出版年份", "版次", "新旧程度", "适用课程"],
  电子数码: ["品牌", "型号", "颜色", "存储容量", "成色", "购买时间", "电池情况"],
  生活用品: ["品牌", "材质", "尺寸", "颜色"],
  体育用品: ["品牌", "型号", "尺寸", "成色", "购买时间"],
  服饰美妆: ["品牌", "尺码", "颜色", "材质", "新旧程度"],
  文具办公: ["品牌", "型号", "颜色"],
  宿舍神器: ["品牌", "材质", "尺寸", "颜色"],
  乐器爱好: ["品牌", "型号", "成色", "购买时间"],
  其他: ["品牌", "型号", "尺寸", "颜色", "成色"],
};

const AddProduct = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
    // 组件卸载时释放预览 URL
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);
  const [formData, setFormData] = useState({
    name: "",
    category: "其他",
    description: "",
    price: "",
    images: [],
    specifications: [],
  });
  const [specificationField, setSpecificationField] = useState({
    key: "",
    value: "",
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const previewUrlsRef = useRef([]); // 追踪最新预览 URL，供卸载时清理
  const [submitting, setSubmitting] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [tab, setTab] = useState("sell"); // "sell" | "buy"

  // ===== 草稿自动保存 =====
  const PRODUCT_DRAFT_KEY = "product_draft";
  const [hasDraft, setHasDraft] = useState(false);
  const draftRestoredRef = useRef(false); // 防止恢复草稿后立即触发覆盖保存

  // 进入页面时检测是否有草稿
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRODUCT_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name || parsed.description || parsed.price) {
          setHasDraft(true);
        }
      }
    } catch { /* 静默 */ }
  }, []);

  // 表单内容变化时自动保存（防抖 500ms，仅出售表单，不存图片）
  useEffect(() => {
    if (draftRestoredRef.current) {
      draftRestoredRef.current = false;
      return;
    }
    const hasContent = formData.name || formData.description || formData.price || formData.specifications.length > 0;
    if (!hasContent || tab !== "sell") return;
    const timer = setTimeout(() => {
      const draft = { ...formData, images: [] };
      localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, tab]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(PRODUCT_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      setFormData({
        name: draft.name || "",
        category: draft.category || "其他",
        description: draft.description || "",
        price: draft.price || "",
        images: [],
        specifications: draft.specifications || [],
      });
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
      setHasDraft(false);
      draftRestoredRef.current = true; // 跳过本次自动保存（刚恢复又存回去会死循环）
    } catch { /* 静默 */ }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(PRODUCT_DRAFT_KEY);
    setHasDraft(false);
  };

  // 求购表单
  const [wantedForm, setWantedForm] = useState({
    name: "",
    budget: "",
    description: "",
  });

  const handleWantedChange = (e) => {
    const { name, value } = e.target;
    setWantedForm((prev) => ({ ...prev, [name]: value }));
  };

  // 审核中用户看到提示，不显示发布表单
  if (user?.status === "inactive") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
          <p className="text-5xl mb-4">⏳</p>
          <p className="text-xl text-white mb-2">账号审核中</p>
          <p className="text-sm text-gray-500 mb-6 text-center px-4">
            你的账号正在等待管理员审核，审核通过后即可发布商品
          </p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            先去逛逛
          </button>
        </div>
      </div>
    );
  }

  const handleWantedSubmit = async (e) => {
    e.preventDefault();
    if (!wantedForm.name || !wantedForm.budget) {
      alert("商品名称和预算为必填");
      return;
    }
    if (Number(wantedForm.budget) <= 0 || Number(wantedForm.budget) > 9999.9) {
      alert("预算需在 0 ~ 9999.9 之间");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wanted", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(wantedForm),
      });
      if (res.ok) {
        alert("求购发布成功！");
        navigate("/home");
      } else {
        const data = await res.json();
        alert(data.message || "发布失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    // 价格上限提示（使用内联文字替代 alert）
    if (name === "price") {
      if (Number(value) > 9999.9) {
        setPriceError("价格不能超过 ¥9999.9（以角为最小单位）");
        return;
      }
      setPriceError("");
    }
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Step 1: 先上传图片到服务器，获取 URL（不再存 base64）
      let imageUrls = [];
      if (formData.images.length > 0) {
        const formDataImages = new FormData();
        formData.images.forEach((img) => formDataImages.append("images", img));

        const uploadRes = await fetch(`/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formDataImages,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          alert(errData.message || "图片上传失败");
          setSubmitting(false);
          return;
        }

        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls;
      }

      // Step 2: 用图片 URL 创建商品
      const response = await fetch(`/api/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      });

      if (response.ok) {
        alert("商品发布成功！");
        localStorage.removeItem(PRODUCT_DRAFT_KEY);
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

  // 压缩图片：最大宽度 1920px，质量 0.8，返回 Blob
  const compressImage = (file) => {
    return new Promise((resolve) => {
      // 小于 1MB 的图片不压缩
      if (file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_W = 1920;
          let { width, height } = img;
          if (width > MAX_W) {
            height = Math.round((height * MAX_W) / width);
            width = MAX_W;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

  // 选择图片时自动压缩
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = await Promise.all(files.map(compressImage));
    // 生成预览 URL
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)); // 释放旧的
    const urls = compressed.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = urls;
    setPreviewUrls(urls);
    setFormData({ ...formData, images: compressed });
  };

  // 删除已选的某张图片
  const removeImage = (index) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: newImages };
    });
    URL.revokeObjectURL(previewUrlsRef.current[index]);
    previewUrlsRef.current = previewUrlsRef.current.filter((_, i) => i !== index);
    setPreviewUrls(previewUrlsRef.current);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="w-4/5 mx-auto py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">发布</h1>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => setTab("sell")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "sell" ? "bg-yellow-500 text-gray-900" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              我要卖
            </button>
            <button
              type="button"
              onClick={() => setTab("buy")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "buy" ? "bg-green-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              我要买
            </button>
          </div>
        </div>

        {tab === "buy" ? (
          /* 求购表单 */
          <form onSubmit={handleWantedSubmit}>
            <div className="mb-4">
              <label className="block text-gray-600">商品名称</label>
              <input
                type="text"
                name="name"
                value={wantedForm.name}
                onChange={handleWantedChange}
                placeholder="你想买什么？"
                className="w-full border rounded-lg py-2 px-3"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600">心理价位（元）</label>
              <input
                type="number"
                name="budget"
                value={wantedForm.budget}
                onChange={handleWantedChange}
                placeholder="你能接受的最高价格"
                className="w-full border rounded-lg py-2 px-3"
                required
                min="0"
                max="9999.9"
                step="0.1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600">描述（选填）</label>
              <textarea
                name="description"
                value={wantedForm.description}
                onChange={handleWantedChange}
                placeholder="对商品有什么要求？新旧程度、品牌偏好等..."
                className="w-full border rounded-lg py-2 px-3"
                rows="3"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 rounded-lg transition duration-300 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {submitting ? "发布中..." : "发布求购"}
            </button>
          </form>
        ) : (
          /* 出售表单（原有） */
        <>

        {/* 草稿提示条 */}
        {hasDraft && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center justify-between">
            <span className="text-sm text-yellow-800">📝 找到未发布的草稿</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                恢复草稿
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                放弃
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 快速模板 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">快速发布 — 点击模板自动填入分类和描述：</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "二手教材", category: "教材教辅", desc: "九成新，只用了一学期" },
                { label: "手机/平板", category: "电子数码", desc: "正常使用痕迹，功能完好" },
                { label: "耳机/音箱", category: "电子数码", desc: "正常使用痕迹，功能完好" },
                { label: "键盘/鼠标", category: "电子数码", desc: "正常使用痕迹，功能完好" },
                { label: "台灯/风扇", category: "宿舍神器", desc: "闲置很久了，便宜出" },
                { label: "衣服/鞋子", category: "服饰美妆", desc: "九成新，只穿了几次" },
                { label: "体育用品", category: "体育用品", desc: "正常使用痕迹，功能完好" },
                { label: "收纳/置物架", category: "宿舍神器", desc: "闲置很久了，便宜出" },
              ].map(({ label, category, desc }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFormData({ ...formData, category, description: desc })}
                  className="text-xs px-3 py-1.5 rounded-full border border-yellow-300 bg-white text-gray-700 hover:bg-yellow-50 hover:border-yellow-500 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
            <label htmlFor="category" className="block text-gray-600 mb-2">
              分类
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg py-2 px-3"
              required
            >
              <option value="教材教辅">教材教辅</option>
              <option value="电子数码">电子数码</option>
              <option value="生活用品">生活用品</option>
              <option value="体育用品">体育用品</option>
              <option value="服饰美妆">服饰美妆</option>
              <option value="文具办公">文具办公</option>
              <option value="宿舍神器">宿舍神器</option>
              <option value="乐器爱好">乐器爱好</option>
              <option value="其他">其他</option>
            </select>
          </div>

          {/* Product Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-600 mb-2">
              描述
            </label>
            {/* 快捷描述模板 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {["九成新，只用了一学期", "正常使用痕迹，功能完好", "全新未拆封", "闲置很久了，便宜出", "毕业清仓，给钱就卖"].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setFormData({ ...formData, description: tpl })}
                  className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                >
                  {tpl}
                </button>
              ))}
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
              max="9999.9"
              step="0.1"
            />
            {priceError && (
              <p className="text-red-500 text-sm mt-1">{priceError}</p>
            )}
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
              onChange={handleImageChange}
              className="w-full border rounded-lg py-2 px-3"
              required
            />
            {/* 图片预览缩略图 */}
            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300 group">
                    <img
                      src={url}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="删除图片"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 规格参数 — 带说明和快捷建议 */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-gray-700 font-medium mb-1">
              <FaInfoCircle className="text-blue-400 text-sm" />
              规格参数
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              添加商品的规格信息，如品牌、型号、尺寸、颜色等，让买家快速了解商品详情。
              <br />在下方输入「规格名」和「规格值」后点击添加，或点击热门规格快速填写。
            </p>
            {formData.specifications.map((spec, index) => (
              <div key={index} className="flex mb-2 justify-between">
                <input
                  type="text"
                  name={`specification-${index}-key`}
                  value={spec.key}
                  readOnly
                  className="w-[45%] border rounded-lg py-2 px-3 bg-gray-50 text-gray-500 mr-2"
                  disabled
                />
                <input
                  type="text"
                  name={`specification-${index}-value`}
                  value={spec.value}
                  readOnly
                  className="w-[45%] border rounded-lg py-2 px-3 bg-gray-50 text-gray-500 mr-2"
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
                placeholder='例如: 品牌 / 型号 / 颜色'
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
                placeholder='例如: Apple / iPhone 15 / 深空灰'
              />
              <button
                type="button"
                onClick={handleAddSpecification}
                className="w-full md:w-32 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center gap-1"
              >
                <FaPlus className="text-xs" /> 添加
              </button>
            </div>
            {/* 热门规格一键填充 */}
            <div className="mt-3">
              <span className="text-xs text-gray-400">热门规格：</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(SPEC_SUGGESTIONS[formData.category] || SPEC_SUGGESTIONS.other).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSpecificationField({ ...specificationField, key: s })
                    }
                    className={`text-xs px-2 py-1 rounded-full border transition-colors duration-150 ${
                      specificationField.key === s
                        ? "bg-blue-100 border-blue-400 text-blue-600"
                        : "border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
        </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AddProduct;
