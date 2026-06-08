import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ProductDetails from "./Product_Details/ProductDetails";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <Navbar hideMobileTabBar />
      <main className="mx-auto w-full md:w-4/5 p-4 ">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate("/home"); } }}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">
            商品详情
          </h1>
        </div>
        {id && <ProductDetails productId={id} />}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
