import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "../Utility/ProductCard";

const Recommendations = ({ userId, excludeId, category, department, major, sellerId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [cardStep, setCardStep] = useState(188);

  const trackRef = useRef(null);
  const intervalRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // 1. 获取推荐数据（不变）
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

        const res = await fetch(`/api/products/recommendations?${params.toString()}`);
        if (res.ok && mounted) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.debug("推荐加载跳过:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => { mounted = false; };
  }, [userId, excludeId, category, department, major, sellerId]);

  // 2. 测量卡片实际宽度（含 gap-3 = 12px），响应断点变化
  useEffect(() => {
    if (!trackRef.current || products.length === 0) return;
    const firstCard = trackRef.current.children[0];
    if (!firstCard) return;

    const measure = () => setCardStep(firstCard.offsetWidth + 12);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(firstCard);
    return () => ro.disconnect();
  }, [products]);

  const total = products.length;

  // 3. 自动轮播 — 3.5 秒滑一张
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => prev + 1);
    }, 3500);
  }, []);

  useEffect(() => {
    if (total === 0) return;
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, [total, startAutoPlay]);

  // 4. 暂停/恢复（桌面 hover / 移动 touch）
  const pause = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      if (!intervalRef.current) startAutoPlay();
    }, 2000);
  }, [startAutoPlay]);

  // 5. 无缝循环：滑到克隆区后瞬移回原位
  const handleTransitionEnd = (e) => {
    // 只追踪轨道自身的 transform 变化，忽略子卡片 hover 过渡
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    if (current >= total) {
      setAnimating(false);
      setCurrent(current - total);
    }
  };

  // 双 RAF：回跳后重新启用 CSS 过渡
  useEffect(() => {
    if (animating) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  // 6. 组件卸载清理
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // 7. 空/加载态 → 不渲染
  if (loading || total === 0) return null;

  // 克隆全部商品，实现无限循环
  const items = [...products, ...products];

  // 安全限幅（仅兜底，正常不会超）
  const safeCurrent = Math.min(current, items.length - 1);

  return (
    <div
      className="mb-6 mt-4 select-none"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-100">
          <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            推荐
          </span>
          为你精选
        </h2>

        {/* 进度指示器：6 个圆点 */}
        <div className="flex items-center gap-1.5">
          {products.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === safeCurrent % total
                  ? "bg-yellow-400 w-2.5 h-2.5"
                  : "bg-gray-600 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 轮播轨道容器 */}
      <div className="overflow-hidden rounded-lg">
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{
            transform: `translateX(-${safeCurrent * cardStep}px)`,
            transition: animating ? "transform 0.5s ease" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((product, idx) => (
            <div
              key={`${product._id}-${idx}`}
              className="flex-none w-36 md:w-40 lg:w-44"
            >
              <ProductCard product={product} isRecommended={true} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
