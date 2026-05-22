import React from "react";
import { Link } from "react-router-dom";

const ProductList = ({ userProducts, onDeleteProduct, showDelete = true }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">我的商品</h2>
      <div className="space-y-4">
        {userProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow p-4 flex gap-4 items-center relative"
          >
            {showDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDeleteProduct(product._id);
                }}
                className="absolute top-2 right-2 z-10 text-red-500 cursor-pointer rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition duration-300 w-7 h-7 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {/* 商品图片 — 点击进详情页 */}
            <Link to={`/product/${product._id}`} className="flex-shrink-0">
              <div
                className="w-20 h-20 rounded-lg bg-gray-200 bg-cover bg-center"
                style={{
                  backgroundImage: product.images?.[0]
                    ? `url(${product.images[0]})`
                    : "none",
                }}
              />
            </Link>
            {/* 商品信息（无描述） */}
            <div className="flex-grow min-w-0">
              <Link
                to={`/product/${product._id}`}
                className="text-lg font-semibold text-gray-900 hover:text-yellow-600 transition-colors truncate block"
              >
                {product.name}
              </Link>
              <p className="text-yellow-500 mt-1">
                ¥{Number(product.price ?? 0).toFixed(2)}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
            {/* 操作按钮 */}
            <div className="flex gap-2 shrink-0">
              <Link
                to={`/product/${product._id}/edit`}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                编辑
              </Link>
              <Link
                to={`/product/${product._id}`}
                className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-gray-900 transition-colors"
              >
                查看
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
