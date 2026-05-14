import React from "react";

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

      {/* Product Specifications (if applicable) */}
      <div className="mb-4">
        <label htmlFor="specifications" className="block text-gray-600">
          规格参数
        </label>
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
              className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0"
              disabled
            />
            <input
              type="text"
              name={`specification-${index}-value`}
              value={spec.value}
              readOnly
              className="w-full md:w-[45%] border rounded-lg py-2 px-3 my-2 md:my-0"
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
          className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
        >
          保存修改
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
