import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Filters from "./Filters";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import Loading from "../Utility/Loading";
import JIANGXI_COLLEGES from "../../constants/colleges";

const ProductsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
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
  const isComposingRef = useRef(false);

  // 从 URL 参数同步搜索状态和页码（空值 = 重置）
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchFromUrl = params.get("search");
    const pageFromUrl = parseInt(params.get("page")) || 1;
    setDebouncedSearch(searchFromUrl || "");
    setCurrentPage(pageFromUrl);
  }, [location.search]);

  const collegeOptions = [
    "全部",
    ...JIANGXI_COLLEGES,
  ];

  const triggerSearch = () => {
    const params = new URLSearchParams(location.search);
    params.delete("page"); // 切筛选条件回到第 1 页
    navigate(`/home?${params.toString()}`, { replace: true });
  };

  const handleCollegeCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCollegeCompositionEnd = (e) => {
    isComposingRef.current = false;
  };

  const handleCollegeKeyDown = (e) => {
    if (e.key === "Enter") {
      clearTimeout(debounceTimer.current);
      setDebouncedCollege(collegeQuery);
      triggerSearch();
    }
  };

  const handleCollegeQueryChange = (e) => {
    setCollegeQuery(e.target.value);
  };

  const handleCollegeSelect = (e) => {
    setCollegeQuery(e.target.value);
    setDebouncedCollege(e.target.value);
    triggerSearch();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    triggerSearch();
  };

  const handlePriceRangeChange = (min, max) => {
    setPriceRange([min, max]);
    triggerSearch();
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    triggerSearch();
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
    const params = new URLSearchParams(location.search);
    params.set("page", pageNumber);
    navigate(`/home?${params.toString()}`, { replace: true });
  };

  return (
    <div className="lg:w-4/5 mx-4 md:mx-auto py-4">
      <h1 className="text-3xl font-semibold mb-4">全部商品</h1>
      <div>
        {!isLoading ? (
          <div className="flex flex-col md:flex-row">
            <Filters
              collegeQuery={collegeQuery}
              handleCollegeQueryChange={handleCollegeQueryChange}
              handleCollegeSelect={handleCollegeSelect}
              handleCollegeKeyDown={handleCollegeKeyDown}
              handleCollegeCompositionStart={handleCollegeCompositionStart}
              handleCollegeCompositionEnd={handleCollegeCompositionEnd}
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
