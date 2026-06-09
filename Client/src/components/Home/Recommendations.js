import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "../Utility/ProductCard";

const CARD_CLASS = "flex-none w-36 md:w-40 lg:w-44";

const Recommendations = ({ userId, excludeId, category, department, major, sellerId }) => {
  // ─── State ───
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardStep, setCardStep] = useState(188);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dotIndex, setDotIndex] = useState(0);
  const [current, setCurrent] = useState(0); // desktop only
  const [animating, setAnimating] = useState(true); // desktop only

  // ─── Shared refs ───
  const intervalRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // ─── Desktop refs ───
  const desktopTrackRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const baseTranslateRef = useRef(0);

  // ─── 桌面触控板 refs ───
  const desktopContainerRef = useRef(null);
  const currentRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const lastWheelAdvanceRef = useRef(0);

  // ─── Mobile refs ───
  const mobileContainerRef = useRef(null);
  const isJumpingBackRef = useRef(false);
  const scrollRAFRef = useRef(null);

  // ─── 设备识别：pointer: coarse = 触屏 ───
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouchDevice(mq.matches);
    const handler = (e) => setIsTouchDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ─── 获取推荐数据 ───
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

  const total = products.length;
  const items = [...products, ...products]; // 克隆 12 件 → 无缝循环
  const safeCurrent = Math.min(current, items.length - 1);
  currentRef.current = current;

  // ─── 测量卡片实际宽度（含 gap-3 = 12px）───
  useEffect(() => {
    const container = isTouchDevice ? mobileContainerRef.current : desktopTrackRef.current;
    const firstCard = isTouchDevice
      ? container?.firstElementChild?.firstElementChild
      : container?.firstElementChild;
    if (!firstCard || total === 0) return;
    const measure = () => setCardStep(firstCard.offsetWidth + 12);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(firstCard);
    return () => ro.disconnect();
  }, [total, isTouchDevice]);

  // ─── 自动轮播（3.5s/张） ───
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (isTouchDevice) {
        mobileContainerRef.current?.scrollBy({ left: cardStep, behavior: "smooth" });
      } else {
        setCurrent((prev) => prev + 1);
      }
    }, 3500);
  }, [isTouchDevice, cardStep]);

  useEffect(() => {
    if (total === 0) return;
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, [total, startAutoPlay]);

  // ─── 暂停/恢复（桌面 hover / 移动 touch） ───
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

  // ─── 组件卸载清理 ───
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(resumeTimerRef.current);
      cancelAnimationFrame(scrollRAFRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════
  //  桌面端：translateX + 拖拽 + 左右箭头
  // ═══════════════════════════════════════════

  // 无缝循环：过渡结束 → 克隆区回跳
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    if (current >= total) {
      setAnimating(false);
      setCurrent(current - total);
    }
  };

  useEffect(() => {
    if (animating) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  // 指针拖拽
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const track = desktopTrackRef.current;
    if (!track) return;
    isDraggingRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    baseTranslateRef.current = -(safeCurrent * cardStep);
    pause();
    track.style.transition = "none";
    track.style.cursor = "grabbing";
    track.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (e.buttons !== 1) return;
    const track = desktopTrackRef.current;
    if (!track) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = Math.abs(e.clientY - dragStartYRef.current);
    if (deltaY > Math.abs(deltaX) * 0.75 && isDraggingRef.current) {
      handlePointerCancel();
      return;
    }
    if (Math.abs(deltaX) > 5) isDraggingRef.current = true;
    if (isDraggingRef.current) {
      e.preventDefault();
      track.style.transform = `translateX(${baseTranslateRef.current + deltaX}px)`;
    }
  };

  const handlePointerUp = (e) => {
    const track = desktopTrackRef.current;
    if (!track) return;
    track.style.cursor = "";
    track.releasePointerCapture(e.pointerId);
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaX = e.clientX - dragStartXRef.current;
    const velocity = Math.abs(deltaX) / (Date.now() - dragStartTimeRef.current || 1);
    const indexDelta = -Math.round(deltaX / cardStep);
    let flick = 0;
    if (velocity > 0.3 && Math.abs(deltaX) > cardStep * 0.3) {
      flick = deltaX < 0 ? 1 : -1;
    }
    const target = Math.max(0, Math.min(items.length - 1, current + indexDelta + flick));
    setAnimating(true);
    setCurrent(target);
    track.style.pointerEvents = "none";
    requestAnimationFrame(() => {
      if (desktopTrackRef.current) desktopTrackRef.current.style.pointerEvents = "";
    });
    resume();
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    const track = desktopTrackRef.current;
    if (!track) return;
    track.style.cursor = "";
    resume();
  };

  // 左右箭头
  const handlePrev = () => {
    pause();
    if (current === 0) {
      // 跳到克隆区（和当前一样）→ 双 RAF → 滑到上一张（最后一张）
      setAnimating(false);
      setCurrent(total);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
          setCurrent(total - 1);
        });
      });
    } else {
      setCurrent(current - 1);
    }
    resume();
  };

  const handleNext = () => {
    pause();
    setCurrent(current + 1);
    resume();
  };

  // ─── 桌面端：触控板双指滑动 / 鼠标横滚轮 ───
  useEffect(() => {
    const el = desktopContainerRef.current;
    if (!el || isTouchDevice) return;

    const handler = (e) => {
      // 只拦截水平方向（双指左右 / 滚轮横滚）
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelAdvanceRef.current < 300) return;

      wheelAccumRef.current += e.deltaX;
      const threshold = cardStep * 0.35;

      if (Math.abs(wheelAccumRef.current) >= threshold) {
        pause();

        if (wheelAccumRef.current > 0) {
          // 向右滑 → 上一张（边缘回绕）
          if (currentRef.current === 0) {
            setAnimating(false);
            setCurrent(total);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setAnimating(true);
                setCurrent(total - 1);
              });
            });
          } else {
            setCurrent((prev) => prev - 1);
          }
        } else {
          // 向左滑 → 下一张
          setCurrent((prev) => prev + 1);
        }

        wheelAccumRef.current = 0;
        lastWheelAdvanceRef.current = now;
        resume();
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [isTouchDevice, cardStep, total, pause, resume, setAnimating, setCurrent]);

  // ═══════════════════════════════════════════
  //  移动端：scroll-snap 原生滚动
  // ═══════════════════════════════════════════

  const handleMobileScroll = useCallback(() => {
    const container = mobileContainerRef.current;
    if (!container || total === 0) return;

    // 无缝循环：到达克隆区 → 瞬间跳回
    if (!isJumpingBackRef.current) {
      const maxScroll = total * cardStep;
      if (container.scrollLeft >= maxScroll - 1) {
        isJumpingBackRef.current = true;
        container.scrollLeft = 0;
        isJumpingBackRef.current = false;
      }
    }

    // 进度点（RAF 节流）
    if (!scrollRAFRef.current) {
      scrollRAFRef.current = requestAnimationFrame(() => {
        scrollRAFRef.current = null;
        const c = mobileContainerRef.current;
        if (!c || total === 0) return;
        const idx = Math.round(c.scrollLeft / cardStep) % total;
        setDotIndex(idx);
      });
    }
  }, [total, cardStep]);

  // 桌面端：用 React state 驱动进度点
  useEffect(() => {
    if (!isTouchDevice && total > 0) {
      setDotIndex(safeCurrent % total);
    }
  }, [safeCurrent, total, isTouchDevice]);

  // ─── 空/加载态 ───
  if (loading || total === 0) return null;

  return (
    <div className="mb-6 mt-4 select-none">
      {/* ─── 共用标题栏 ─── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-100">
          <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            推荐
          </span>
          为你精选
        </h2>
        <div className="flex items-center gap-1.5">
          {products.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === dotIndex
                  ? "bg-yellow-400 w-2.5 h-2.5"
                  : "bg-gray-600 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── 移动端：原生 scroll-snap ─── */}
      {isTouchDevice ? (
        <div
          ref={mobileContainerRef}
          className="overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide rounded-lg"
          style={{ touchAction: "pan-y pinch-zoom" }}
          onScroll={handleMobileScroll}
          onTouchStart={pause}
          onTouchEnd={resume}
        >
          <div className="flex gap-3">
            {items.map((product, idx) => (
              <div key={`${product._id}-${idx}`} className={`${CARD_CLASS} snap-start`}>
                <ProductCard product={product} isRecommended={true} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── 桌面端：translateX + 箭头按钮 ─── */
        <div
          ref={desktopContainerRef}
          className="relative group"
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          <div className="overflow-hidden rounded-lg">
            <div
              ref={desktopTrackRef}
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
                <div key={`${product._id}-${idx}`} className={CARD_CLASS}>
                  <ProductCard product={product} isRecommended={true} />
                </div>
              ))}
            </div>
          </div>

          {/* 左右箭头 — hover 到轮播区才显示 */}
          <button
            onClick={handlePrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
            aria-label="上一个"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
            aria-label="下一个"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
