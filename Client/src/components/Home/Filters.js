import React, { useState } from "react";

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
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
        {/* 价格范围 */}
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">价格范围：</label>
          <input
            type="range"
            min={0}
            max={10000}
            value={priceRange[0]}
            onChange={(e) =>
              handlePriceRangeChange(+e.target.value, priceRange[1])
            }
            className="mr-2 w-full bg-gray-900"
          />
          <input
            type="range"
            min={0}
            max={10000}
            value={priceRange[1]}
            onChange={(e) =>
              handlePriceRangeChange(priceRange[0], +e.target.value)
            }
            className="ml-2 w-full bg-gray-900"
          />
          <div className="flex justify-between">
            <span className="text-gray-600">{priceRange[0]}</span>
            <span className="text-gray-600">{priceRange[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
