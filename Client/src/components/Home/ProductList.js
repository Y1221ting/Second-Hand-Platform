import React from "react";
import ProductCard from "../Utility/ProductCard";

const ProductList = ({ currentProducts, searchTerm }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5">
        {currentProducts.map((product) => (
          <ProductCard key={product._id} product={product} searchTerm={searchTerm} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
