import React from "react";
import { FaInfoCircle, FaPlus } from "react-icons/fa";

// 按分类的常用规格建议
const SPEC_SUGGESTIONS = {
  electronics: ["品牌", "型号", "颜色", "存储容量", "成色", "购买时间"],
  furniture: ["品牌", "材质", "尺寸", "颜色", "购买时间"],
  clothing: ["品牌", "尺码", "颜色", "材质", "新旧程度"],
  books: ["作者", "出版社", "出版年份", "版次", "新旧程度"],
  sports: ["品牌", "型号", "尺寸", "成色", "购买时间"],
  food: ["品牌", "规格", "保质期", "生产日期"],
  transportation: ["品牌", "型号", "颜色", "购买时间", "里程数"],
  beauty: ["品牌", "规格", "保质期", "颜色"],
  home: ["品牌", "材质", "尺寸", "颜色"],
  other: ["品牌", "型号", "尺寸", "颜色", "成色"],
};

const ProductForm = ({
  formData,
  handleChange,
  handleImageChange,
  handleAddImage,
  imageFieldError,
  handleRemoveImage,
  specificationField,
  setSpecificationField,
  handleAddSpecification,
  handleRemoveSpecification,
  handleSubmit,
}) => {
  return (
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
        <label htmlFor="category" className="block text-gray-600">
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
        <label htmlFor="description" className="block text-gray-600">
          描述
        </label>
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
          onChange={handleImageChange}
          className="w-full border rounded-lg py-2 px-3"
        />
        <button
          type="button"
          onClick={handleAddImage}
          className="mt-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
        >
          添加图片
        </button>
        {imageFieldError && <p className="text-red-500">{imageFieldError}</p>}
        {formData.images.length > 0 && (
          <div className="mt-4">
            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center mb-2">
                {/* eslint-disable-next-line */}
                <img
                  src={image}
                  alt={`Product Image ${index + 1}`}
                  className="w-32 h-32 object-cover rounded-lg mr-3"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition duration-300"
                >
                  删除
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
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between"
          >
            <input
              type="text"
              name={`specification-${index}-key`}
              value={spec.key}
              readOnly
              className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0 bg-gray-50 text-gray-500"
              disabled
            />
            <input
              type="text"
              name={`specification-${index}-value`}
              value={spec.value}
              readOnly
              className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0 bg-gray-50 text-gray-500"
              disabled
            />
            <button
              type="button"
              onClick={() => handleRemoveSpecification(index)}
              className="w-full md:w-32 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-300"
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
          className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
        >
          保存修改
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
