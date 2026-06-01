import React, { useState, useEffect } from "react";
import ProductCard from "../Utility/ProductCard";

const Recommendations = ({ userId, excludeId, category, department, major, sellerId }) => {
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
        if (department) params.append("department", department);
        if (major) params.append("major", major);
        if (sellerId) params.append("sellerId", sellerId);
        params.append("limit", 6);

        const res = await fetch(`/api/products/ai-recommendations?${params.toString()}`);
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
  }, [userId, excludeId, category, department, major, sellerId]);

  // 无数据时完全不渲染（加载中 or 空）
  if (loading || products.length === 0) return null;

  return (
    <div className="mb-8 mt-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800">
        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          AI
        </span>
        🤖 智能推荐 · 根据当前商品为您匹配
      </h2>
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        {products.map(product => (
          <div key={product._id} className="flex-shrink-0 w-64">
            <ProductCard product={product} isRecommended={true} />
            {product.aiReason && (
              <p className="text-[10px] text-gray-400 mt-1 italic leading-tight px-1">
                🤖 {product.aiReason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
