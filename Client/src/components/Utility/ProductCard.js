import React, { useState, memo, useEffect, useRef } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clickedButtonId, setClickedButtonId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);
  const isOwner = user && user.id === product.uploadedBy._id;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    setClickedButtonId(product._id);
    setTimeout(() => {
      setClickedButtonId(null);
    }, 1000);
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="m-2 flex flex-col justify-between flex-shrink-0 w-64 bg-gray-900 text-white px-4 py-5 rounded-md hover:scale-105 transition-transform duration-200">
      <a href={`/product/${product._id}`} className="text-blue-500 block ">
        <div
          ref={imageRef}
          className="w-full h-52 mb-2 rounded-md bg-gray-700"
          style={
            imageLoaded
              ? {
                  backgroundImage: `url(${product.images[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : {}
          }
        ></div>
      </a>
      <h3 className="text-lg font-semibold mb-1">
        {product.name.length > 40
          ? `${product.name.slice(0, 40)}...`
          : product.name}
      </h3>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-300">
          发布者：{product.uploadedBy.name}
        </p>
        <p className="text-sm text-gray-400">
          库存: {product.quantity || 0}
        </p>
      </div>
      <p className="text-sm text-gray-300">{product.uploadedBy.college}</p>

      <div className="flex justify-between items-center mt-2">
        {isOwner ? (
          <button
            className="flex items-center px-4 py-2 rounded bg-gray-600 text-gray-300 cursor-not-allowed"
            disabled
          >
            <span className="mr-2"><FaShoppingCart /></span>
            我的商品
          </button>
        ) : (
          <button
            className={`flex items-center px-4 py-2 rounded ${
              product.status === "sold_out" || product.quantity <= 0
                ? "bg-gray-400 cursor-not-allowed"
                : clickedButtonId === product._id
                ? "bg-green-500"
                : "bg-yellow-500 hover:bg-yellow-600"
            } text-gray-800 transition-colors duration-200`}
            onClick={() => {
              if (product.status !== "sold_out" && product.quantity > 0) {
                handleAddToCart();
              } else {
                alert("该商品已售罄");
              }
            }}
            disabled={product.status === "sold_out" || product.quantity <= 0}
          >
            <span
              className={`mr-2 ${
                clickedButtonId === product._id ? "animate-ping" : ""
              }`}
            >
              <FaShoppingCart />
            </span>
            {product.status === "sold_out" || product.quantity <= 0
              ? "已售罄"
              : "立即购买"}
          </button>
        )}
        <p className="text-xl font-semibold">
          ¥{parseFloat(product.price.$numberDecimal).toFixed(2)}
        </p>
      </div>
    </div>
  );
});

export default ProductCard;
