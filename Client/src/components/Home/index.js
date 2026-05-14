import React, { useState, useEffect, useCallback, useRef } from "react";
import Filters from "./Filters";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import Loading from "../Utility/Loading";

const ProductsList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");
  const [debouncedCollege, setDebouncedCollege] = useState("");
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef(null);

  const collegeOptions = [
    "全部",
    "南昌大学",
    "江西师范大学",
    "江西财经大学",
    "江西农业大学",
    "华东交通大学",
    "南昌航空大学",
    "江西理工大学",
    "东华理工大学",
    "景德镇陶瓷大学",
    "江西中医药大学",
    "赣南医科大学",
    "南昌工程学院",
    "江西科技师范大学",
    "井冈山大学",
    "宜春学院",
    "九江学院",
    "上饶师范学院",
    "赣南师范大学",
    "南昌师范学院",
    "萍乡学院",
    "新余学院",
    "景德镇学院",
    "豫章师范学院",
    "江西警察学院",
    "南昌理工学院",
    "江西科技学院",
    "江西服装学院",
    "江西工程学院",
    "江西应用科技学院",
    "南昌工学院",
    "南昌医学院",
    "赣东学院",
    "赣南科技学院",
    "南昌应用技术师范学院",
    "江西软件职业技术大学",
    "南昌职业大学",
    "景德镇艺术职业大学",
  ];

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
  };

  const handleCollegeQueryChange = (e) => {
    setCollegeQuery(e.target.value);
    setCurrentPage(1);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedCollege(e.target.value);
    }, 500);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (min, max) => {
    setPriceRange([min, max]);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const fetchProducts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (categoryFilter) params.append("category", categoryFilter);
      if (debouncedCollege && debouncedCollege !== "全部") params.append("college", debouncedCollege);
      params.append("sort", sortBy);
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0]);
      if (priceRange[1] < 10000) params.append("maxPrice", priceRange[1]);

      const response = await fetch(`/api/products/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, debouncedCollege, sortBy, priceRange, categoryFilter]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProducts(currentPage);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchProducts, currentPage]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="lg:w-4/5 mx-4 md:mx-auto py-4">
      <h1 className="text-3xl font-semibold mb-4">全部商品</h1>
      <div>
        {!isLoading ? (
          <div className="flex flex-col md:flex-row">
            <Filters
              searchQuery={searchQuery}
              handleSearchQueryChange={handleSearchQueryChange}
              collegeQuery={collegeQuery}
              handleCollegeQueryChange={handleCollegeQueryChange}
              collegeOptions={collegeOptions}
              sortBy={sortBy}
              handleSortChange={handleSortChange}
              priceRange={priceRange}
              handlePriceRangeChange={handlePriceRangeChange}
              categoryFilter={categoryFilter}
              handleCategoryFilterChange={handleCategoryFilterChange}
            />
            <div className="w-full flex flex-col items-center">
              <ProductList currentProducts={products} />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  );
};

export default ProductsList;
