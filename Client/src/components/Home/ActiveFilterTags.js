import React from "react";

const SORT_LABELS = {
  latest: "最新发布",
  lowestPrice: "价格从低到高",
  highestPrice: "价格从高到低",
  closest: "离我最近",
};

const ActiveFilterTags = ({ filters, onRemove, onResetAll }) => {
  const tags = [];

  // 搜索
  if (filters.search) {
    tags.push({ key: "search", icon: "🔍", label: `"${filters.search}"` });
  }

  // 学院
  if (filters.department) {
    tags.push({ key: "department", icon: "🏫", label: filters.department });
  }

  // 专业
  if (filters.major) {
    tags.push({ key: "major", icon: "📚", label: filters.major });
  }

  // 分类
  if (filters.category) {
    tags.push({ key: "category", icon: "📦", label: filters.category });
  }

  // 排序（仅非默认值显示）
  if (filters.sort && filters.sort !== "latest") {
    tags.push({ key: "sort", icon: "↕️", label: SORT_LABELS[filters.sort] || filters.sort });
  }

  // 价格（仅非默认值显示）
  const min = parseFloat(filters.minPrice) || 0;
  const max = parseFloat(filters.maxPrice) || 10000;
  if (min > 0 || max < 10000) {
    tags.push({ key: "minPrice", icon: "💰", label: `¥${min} - ¥${max}` });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {tags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-full border border-gray-700"
        >
          <span>{tag.icon}</span>
          <span>{tag.label}</span>
          <button
            onClick={() => onRemove(tag.key)}
            className="ml-1 text-gray-400 hover:text-red-400 transition-colors text-xs leading-none"
            aria-label={`移除${tag.label}`}
          >
            ✕
          </button>
        </span>
      ))}
      {tags.length > 1 && (
        <button
          onClick={onResetAll}
          className="text-sm text-gray-400 hover:text-red-400 transition-colors ml-2"
        >
          清空全部
        </button>
      )}
    </div>
  );
};

export default ActiveFilterTags;
