import React from "react";
import ProductCard from "../Utility/ProductCard";

const ProductList = ({ currentProducts, searchTerm }) => {
  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {currentProducts.map((product) => (
          <ProductCard key={product._id} product={product} searchTerm={searchTerm} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
