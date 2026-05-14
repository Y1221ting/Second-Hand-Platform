import React from "react";
import { Link } from "react-router-dom";

const ProductList = ({ userProducts, onDeleteProduct, showDelete = true }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">我的商品</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {userProducts.map((product) => (
          <div
            key={product._id}
            to={`/product/${product._id}`}
            className="bg-white p-4 rounded-lg shadow-2xl border-t-4 border-l-4 border-yellow-500 relative flex flex-col justify-between"
          >
            {showDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDeleteProduct(product._id);
                }}
                className="absolute top-2 right-2 z-10 text-red-500 cursor-pointer rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <div className="relative">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-64 object-cover mb-4 rounded-lg"
              />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h2>
              <p className="text-gray-600 mb-2">
                {product.description.length > 100
                  ? `${product.description.slice(0, 100)}...`
                  : product.description}
              </p>
              <p className="text-yellow-500 text-lg font-semibold mb-2">
                ¥{parseFloat(product.price.$numberDecimal).toFixed(2)}
              </p>
            </div>
            <span className="bg-white text-gray-900 py-1 rounded">
              发布于 - {new Date(product.createdAt).toLocaleDateString()}
            </span>
            <div className="flex gap-2 mt-2">
              <Link
                to={`/product/${product._id}/edit`}
                className="flex-1 bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                编辑商品
              </Link>
              <Link
                to={`/product/${product._id}`}
                className="flex-1 bg-yellow-500 text-white text-center py-2 rounded hover:bg-gray-900 transition duration-300"
              >
                查看商品
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
