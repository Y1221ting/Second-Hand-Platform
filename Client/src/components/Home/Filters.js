import React, { useState } from "react";

const Filters = ({
  searchQuery,
  handleSearchQueryChange,
  collegeQuery,
  handleCollegeQueryChange,
  collegeOptions,
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

  const filteredCollegeOptions = collegeOptions.filter((college) =>
    college.toLowerCase().includes(collegeQuery.toLowerCase())
  );

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
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">搜索：</label>
          <input
            type="text"
            className="bg-gray-800 text-white p-2 w-full border-2 border-transparent focus:border-white"
            placeholder="搜索..."
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        </div>
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">学校：</label>
          <input
            type="text"
            className="bg-gray-800 text-white p-2 w-full border-2 border-transparent focus:border-white"
            placeholder="搜索学校..."
            value={collegeQuery}
            onChange={handleCollegeQueryChange}
          />
          <select
            value={collegeQuery}
            onChange={handleCollegeQueryChange}
            className="p-2 rounded bg-gray-800 text-white w-full mt-2"
          >
            {filteredCollegeOptions.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">排序：</label>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="p-2 rounded bg-gray-800 text-white w-full"
          >
            <option value="latest">最新</option>
            <option value="lowestPrice">价格最低</option>
            <option value="highestPrice">价格最高</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="text-gray-600 block mb-2">分类：</label>
          <select
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            className="p-2 rounded bg-gray-800 text-white w-full"
          >
            <option value="">全部</option>
            <option value="electronics">电子产品</option>
            <option value="mattress">床垫</option>
            <option value="air cooler">空调扇</option>
            <option value="cycles">自行车</option>
            <option value="books">书籍</option>
            {/* Add more options for different categories */}
          </select>
        </div>
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
        <div className="mb-4">
          <span className="text-gray-600 text-sm">筛选实时生效</span>
        </div>
      </div>
    </div>
  );
};

export default Filters;
