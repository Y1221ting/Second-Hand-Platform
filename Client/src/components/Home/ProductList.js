import React from "react";
import ProductCard from "../Utility/ProductCard";

const ProductList = ({ currentProducts }) => {
  if (!currentProducts || currentProducts.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">🛒</span>
        <p className="text-lg">暂无此商品</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
