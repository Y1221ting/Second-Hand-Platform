import React, { useState, useEffect } from "react";
import ProductCard from "../Utility/ProductCard";

const Recommendations = ({ userId, excludeId, category, college, sellerId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRecommendations = async () => {
      try {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (excludeId) params.append("excludeId", excludeId);
        if (category) params.append("category", category);
        if (college) params.append("college", college);
        if (sellerId) params.append("sellerId", sellerId);
        params.append("limit", 6);

        const res = await fetch(`/api/products/recommendations?${params.toString()}`);
        if (res.ok && mounted) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        // 静默失败 — 推荐不影响主流程
        console.debug("推荐加载跳过:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => { mounted = false; };
  }, [userId, excludeId, category, college, sellerId]);

  // 无数据时完全不渲染（加载中 or 空）
  if (loading || products.length === 0) return null;

  return (
    <div className="mb-8 mt-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800">
        <span className="text-yellow-500 text-lg">✦</span> 猜你喜欢
      </h2>
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {products.map(product => (
          <div key={product._id} className="flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
