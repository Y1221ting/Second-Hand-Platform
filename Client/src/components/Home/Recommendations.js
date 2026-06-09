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

  // 拖拽状态 refs（不触发渲染）
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const baseTranslateRef = useRef(0);

  // ─────────── 1. 获取推荐数据 ───────────
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

  // ─────────── 2. 测量卡片宽度（响应断点） ───────────
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

  // ─────────── 3. 自动轮播 ───────────
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

  // ─────────── 4. 暂停/恢复 ───────────
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

  // ─────────── 5. 无缝循环回跳 ───────────
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    if (current >= total) {
      setAnimating(false);
      setCurrent(current - total);
    }
  };

  // 双 RAF：回跳后重新启用过渡
  useEffect(() => {
    if (animating) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  // ─────────── 6. 拖拽滑动 ───────────
  const handlePointerDown = (e) => {
    // 只响应主鼠标键（左键）
    if (e.button !== 0) return;

    const track = trackRef.current;
    if (!track) return;

    isDraggingRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    baseTranslateRef.current = -(current * cardStep);

    // 暂停自动轮播
    pause();

    // 关闭过渡，拖拽过程中丝滑跟随指针
    track.style.transition = "none";
    track.style.cursor = "grabbing";
    track.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    // 没按左键 → 纯 hover，不处理拖拽（对齐行业标准）
    if (e.buttons !== 1) return;
    if (!trackRef.current) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = Math.abs(e.clientY - dragStartYRef.current);

    // 垂直滑动（超过 45°）→ 不拦截，留给页面滚动
    if (deltaY > Math.abs(deltaX) * 0.75 && isDraggingRef.current) {
      // 正在拖拽但变成垂直 → 终止拖拽
      handlePointerCancel(e);
      return;
    }

    // 超过 5px 才激活拖拽，避免误触
    if (Math.abs(deltaX) > 5) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      const newTranslate = baseTranslateRef.current + deltaX;
      trackRef.current.style.transform = `translateX(${newTranslate}px)`;
    }
  };

  const handlePointerUp = (e) => {
    const track = trackRef.current;
    if (!track) return;

    track.style.cursor = "";
    track.releasePointerCapture(e.pointerId);

    // 纯点击（无拖拽）→ 不做任何事，让卡片自身的 Link 处理点击
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    const deltaX = e.clientX - dragStartXRef.current;
    const elapsed = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(deltaX) / (elapsed || 1);

    // 计算目标位置
    const indexDelta = -Math.round(deltaX / cardStep);

    // 快速滑动（flick）检测：速度快 + 距离够 → 多滑一张
    let flickExtra = 0;
    if (velocity > 0.3 && Math.abs(deltaX) > cardStep * 0.3) {
      flickExtra = deltaX < 0 ? 1 : -1;
    }

    const items = [...products, ...products];
    const targetIndex = Math.max(0, Math.min(items.length - 1, current + indexDelta + flickExtra));

    // React 状态更新 → 带动画 snap 到目标
    setAnimating(true);
    setCurrent(targetIndex);

    // 防止拖拽松手后触发卡片内部的 Link 导航
    track.style.pointerEvents = "none";
    requestAnimationFrame(() => {
      if (trackRef.current) trackRef.current.style.pointerEvents = "";
    });

    // 恢复自动轮播（延迟）
    resume();
  };

  const handlePointerCancel = (e) => {
    isDraggingRef.current = false;
    const track = trackRef.current;
    if (!track) return;
    track.style.cursor = "";
    // 回弹到当前 React 状态位置
    setAnimating(true);
    setCurrent(current); // 触发重新渲染，回弹到原位
    resume();
  };

  // ─────────── 7. 组件卸载清理 ───────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // ─────────── 8. 空/加载态 ───────────
  if (loading || total === 0) return null;

  // 克隆全部商品，实现无限循环
  const items = [...products, ...products];
  const safeCurrent = Math.min(current, items.length - 1);

  return (
    <div className="mb-6 mt-4 select-none">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-100">
          <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            推荐
          </span>
          为你精选
        </h2>

        {/* 进度指示器 */}
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

      {/* 轮播容器 */}
      <div
        className="overflow-hidden rounded-lg"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <div
          ref={trackRef}
          className="flex gap-3"
          style={{
            transform: `translateX(-${safeCurrent * cardStep}px)`,
            transition: animating ? "transform 0.5s ease" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
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
