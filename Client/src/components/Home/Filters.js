import React, { useState, useEffect } from "react";

const Filters = ({
  departmentFilter,
  handleDepartmentChange,
  majorFilter,
  handleMajorChange,
  departments,
  majors,
  majorDisabled,
  sortBy,
  handleSortChange,
  priceRange,
  handlePriceRangeChange,
  categoryFilter,
  handleCategoryFilterChange,
  handleResetAll,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  // 当 URL 参数变化时同步输入框（用户点击确认/重置/重置全部后触发）
  useEffect(() => {
    setMinInput(priceRange[0] > 0 ? String(priceRange[0]) : "");
    setMaxInput(priceRange[1] < 10000 ? String(priceRange[1]) : "");
  }, [priceRange]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handlePriceConfirm = () => {
    const min = minInput === "" ? 0 : Math.max(0, parseFloat(minInput) || 0);
    const max = maxInput === "" ? 10000 : Math.min(10000, parseFloat(maxInput) || 10000);
    handlePriceRangeChange(min, max);
  };

  const handlePriceClear = () => {
    setMinInput("");
    setMaxInput("");
    handlePriceRangeChange(0, 10000);
  };

  const filtersClass = `${showFilters ? "block" : "hidden"} md:block`;

  return (
    <div className="md:w-1/3 lg:w-1/4 p-4 ">
      <h2 className="text-right font-semibold mb-4 md:hidden">
        <button
          onClick={toggleFilters}
          className="bg-gray-800 text-white py-2 px-4 rounded hover:bg-yellow-500 hover:text-gray-900 transition-all"
        >
          筛选
        </button>
      </h2>
      <div className={filtersClass}>
        {/* 学院 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2" htmlFor="department-select">学院：</label>
          <select
            id="department-select"
            value={departmentFilter}
            onChange={handleDepartmentChange}
            className="p-2 rounded bg-gray-800 text-white w-full"
          >
            <option value="">全部学院</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        {/* 专业 — 联动 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2" htmlFor="major-select">专业：</label>
          <select
            id="major-select"
            value={majorFilter}
            onChange={handleMajorChange}
            disabled={majorDisabled}
            className={`p-2 rounded bg-gray-800 text-white w-full ${
              majorDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <option value="">{majorDisabled ? "请先选学院" : "全部专业"}</option>
            {majors.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {/* 排序 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2" htmlFor="sort-select">排序：</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={handleSortChange}
            className="p-2 rounded bg-gray-800 text-white w-full"
          >
            <option value="latest">最新发布</option>
            <option value="lowestPrice">价格从低到高</option>
            <option value="highestPrice">价格从高到低</option>
            <option value="closest">离我最近</option>
          </select>
        </div>
        {/* 分类 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2" htmlFor="category-select">分类：</label>
          <select
            id="category-select"
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            className="p-2 rounded bg-gray-800 text-white w-full"
          >
            <option value="">全部</option>
            <option value="教材教辅">教材教辅</option>
            <option value="电子数码">电子数码</option>
            <option value="生活用品">生活用品</option>
            <option value="体育用品">体育用品</option>
            <option value="服饰美妆">服饰美妆</option>
            <option value="文具办公">文具办公</option>
            <option value="宿舍神器">宿舍神器</option>
            <option value="乐器爱好">乐器爱好</option>
            <option value="其他">其他</option>
          </select>
        </div>
        {/* 价格范围 — 双输入框 + 确认按钮 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">价格范围（元）：</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="最低价"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              min="0"
              max="9999"
              className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:outline-none focus:border-yellow-500"
            />
            <span className="text-gray-500 text-sm">—</span>
            <input
              type="number"
              placeholder="最高价"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              min="0"
              max="10000"
              className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handlePriceConfirm}
              className="flex-1 bg-yellow-500 text-gray-900 py-1.5 rounded text-sm font-medium hover:bg-yellow-400 transition-colors"
            >
              确认
            </button>
            <button
              onClick={handlePriceClear}
              className="flex-1 bg-gray-700 text-gray-300 py-1.5 rounded text-sm hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
        {/* 重置全部筛选 */}
        <button
          onClick={handleResetAll}
          className="w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-400 transition-colors"
        >
          重置全部
        </button>
      </div>
    </div>
  );
};

export default Filters;
