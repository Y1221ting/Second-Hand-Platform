import React from "react";

const SkeletonCard = () => (
  <div className="flex flex-col justify-between w-full bg-gray-900 px-3 py-3 rounded-md overflow-hidden animate-pulse">
    {/* 图片占位 */}
    <div className="w-full h-40 mb-1.5 rounded-md bg-gray-700" />

    {/* 标题占位 */}
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />

    {/* 卖家名 + 库存占位 */}
    <div className="flex items-center justify-between mb-0.5">
      <div className="h-3 bg-gray-700 rounded w-1/3" />
      <div className="h-3 bg-gray-700 rounded w-1/6" />
    </div>

    {/* 学院占位 */}
    <div className="h-3 bg-gray-700 rounded w-1/2 mb-1.5" />

    {/* 价格占位 */}
    <div className="h-5 bg-gray-700 rounded w-1/4 mx-auto mb-1.5" />

    {/* 按钮占位（两个） */}
    <div className="grid grid-cols-2 gap-1.5">
      <div className="h-8 bg-gray-700 rounded" />
      <div className="h-8 bg-gray-700 rounded" />
    </div>
  </div>
);

export default SkeletonCard;
