import React, { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Lightbox = ({ images, activeIndex = 0, onClose, onPrev, onNext, onSelect }) => {
  // 禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // 键盘导航
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center"
         onClick={onClose}>
      {/* 关闭按钮 */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center z-10">
        <FaTimes className="text-lg" />
      </button>

      {/* 左箭头（多图时显示） */}
      {images.length > 1 && onPrev && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center">
          <FaChevronLeft className="text-lg" />
        </button>
      )}

      {/* 右箭头（多图时显示） */}
      {images.length > 1 && onNext && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center">
          <FaChevronRight className="text-lg" />
        </button>
      )}

      {/* 图片 */}
      <img
        src={images[activeIndex]}
        alt="预览"
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 底部圆点（多图时显示） */}
      {images.length > 1 && onSelect && (
        <div className="absolute bottom-4 flex gap-1">
          {images.map((_, idx) => (
            <button key={idx}
              onClick={(e) => { e.stopPropagation(); onSelect(idx); }}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === activeIndex ? "bg-yellow-500" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Lightbox;
