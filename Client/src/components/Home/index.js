import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Filters from "./Filters";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import Loading from "../Utility/Loading";
import HomeBanner from "./HomeBanner";
import Recommendations from "./Recommendations";
import WantedList from "./WantedList";
import Announcement from "./Announcement";
import { useAuth } from "../../context/authContext";

const ProductsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 学院-专业映射
  const [majorMap, setMajorMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [majorDisabled, setMajorDisabled] = useState(true);

  useEffect(() => {
    fetch("/api/majorMap")
      .then((res) => res.json())
      .then((data) => {
        setMajorMap(data);
        setDepartments(Object.keys(data));
      })
      .catch(() => console.error("获取学院列表失败"));
  }, []);

  // 从 URL 参数同步搜索状态和页码
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchFromUrl = params.get("search");
    const pageFromUrl = parseInt(params.get("page")) || 1;
    setDebouncedSearch(searchFromUrl || "");
    setCurrentPage(pageFromUrl);
  }, [location.search]);

  const triggerSearch = () => {
    const params = new URLSearchParams(location.search);
    params.delete("page");
    navigate(`/home?${params.toString()}`, { replace: true });
  };

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setDepartmentFilter(dept);
    setMajorFilter("");
    if (dept && majorMap[dept]) {
      setMajors(majorMap[dept]);
      setMajorDisabled(false);
    } else {
      setMajors([]);
      setMajorDisabled(true);
    }
    triggerSearch();
  };

  const handleMajorChange = (e) => {
    setMajorFilter(e.target.value);
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
      if (departmentFilter) params.append("department", departmentFilter);
      if (majorFilter) params.append("major", majorFilter);
      params.append("sort", sortBy);
      if (sortBy === "closest" && user?.department) {
        params.append("userDepartment", user.department);
      }
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
  }, [debouncedSearch, departmentFilter, majorFilter, sortBy, priceRange, categoryFilter, user?.department]);

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
    <main className="lg:w-4/5 mx-4 md:mx-auto py-4">
      {/* 公告弹窗 */}
      <Announcement />

      {/* 顶部统计 Banner */}
      <HomeBanner departments={departments} />

      {/* 同学求购 */}
      <WantedList />

      {/* 你所在专业的热门 */}
      {user?.department && (
        <Recommendations
          userId={user.id}
          department={user.department}
          limit={4}
        />
      )}

      <h1 className="text-2xl font-semibold mb-4">最近上新</h1>
      <div>
        {!isLoading ? (
          <div className="flex flex-col md:flex-row">
            <Filters
              departmentFilter={departmentFilter}
              handleDepartmentChange={handleDepartmentChange}
              majorFilter={majorFilter}
              handleMajorChange={handleMajorChange}
              departments={departments}
              majors={majors}
              majorDisabled={majorDisabled}
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
    </main>
  );
};

export default ProductsList;
