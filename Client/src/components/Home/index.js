import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Filters from "./Filters";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import ActiveFilterTags from "./ActiveFilterTags";
import EmptyState from "./EmptyState";
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
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
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

  // 从 URL 读取所有筛选参数（唯一数据源）
  const readUrlParams = useCallback(() => {
    const p = new URLSearchParams(location.search);
    return {
      search: p.get("search") || "",
      department: p.get("department") || "",
      major: p.get("major") || "",
      category: p.get("category") || "",
      sort: p.get("sort") || "latest",
      minPrice: p.get("minPrice") || "",
      maxPrice: p.get("maxPrice") || "",
      page: parseInt(p.get("page")) || 1,
    };
  }, [location.search]);

  // 专业下拉框联动 URL 中的 department
  useEffect(() => {
    const { department } = readUrlParams();
    if (department && majorMap[department]) {
      setMajors(majorMap[department]);
      setMajorDisabled(false);
    } else {
      setMajors([]);
      setMajorDisabled(!department);
    }
  }, [location.search, majorMap, readUrlParams]);

  // 合并更新 URL 参数（保留未传入的旧参数，自动重置 page）
  const applyFilters = useCallback(
    (updates) => {
      const current = new URLSearchParams(location.search);
      for (const [k, v] of Object.entries(updates)) {
        if (v === "" || v === null || v === undefined) {
          current.delete(k);
        } else {
          current.set(k, String(v));
        }
      }
      if (!("page" in updates)) {
        current.delete("page");
      }
      const qs = current.toString();
      navigate(qs ? `/home?${qs}` : "/home", { replace: true });
    },
    [location.search, navigate]
  );

  const handleDepartmentChange = (e) => {
    applyFilters({ department: e.target.value, major: "" });
  };

  const handleMajorChange = (e) => {
    applyFilters({ major: e.target.value });
  };

  const handleSortChange = (e) => {
    applyFilters({ sort: e.target.value });
  };

  const handlePriceRangeChange = (min, max) => {
    applyFilters({
      minPrice: min > 0 ? String(min) : "",
      maxPrice: max < 10000 ? String(max) : "",
    });
  };

  const handleCategoryFilterChange = (e) => {
    applyFilters({ category: e.target.value });
  };

  // 移除单个筛选标签（学院重置时联动清专业）
  const handleRemoveFilter = useCallback(
    (key) => {
      if (key === "minPrice") {
        applyFilters({ minPrice: "", maxPrice: "" });
      } else if (key === "department") {
        applyFilters({ department: "", major: "" });
      } else {
        applyFilters({ [key]: "" });
      }
    },
    [applyFilters]
  );

  const fetchProducts = useCallback(async () => {
    const { search, category, department, major, sort, minPrice, maxPrice, page } = readUrlParams();
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (search.trim()) params.append("search", search.trim());
      if (category) params.append("category", category);
      if (department) params.append("department", department);
      if (major) params.append("major", major);
      params.append("sort", sort);
      if (sort === "closest" && user?.department) {
        params.append("userDepartment", user.department);
      }
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const response = await fetch(`/api/products/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [readUrlParams, user?.department]);

  // URL 变化 → 拉取商品
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 页面可见性恢复时刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProducts();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchProducts]);

  const paginate = (pageNumber) => {
    applyFilters({ page: pageNumber });
  };

  const filters = readUrlParams();

  // 稳定 priceRange 引用，避免 Filters 内 useEffect 每次渲染都触发
  const stablePriceRange = useMemo(
    () => [
      filters.minPrice ? parseFloat(filters.minPrice) : 0,
      filters.maxPrice ? parseFloat(filters.maxPrice) : 10000,
    ],
    [filters.minPrice, filters.maxPrice]
  );

  // 仅首次加载无数据时展示全屏 Loading，避免 Filters 因 isLoading 切换而反复卸载
  const showFullLoading = isLoading && products.length === 0;
  // 已有数据时的后续加载（搜索/筛选/翻页），显示轻量指示器
  const isRefreshing = isLoading && products.length > 0;

  return (
    <main className="lg:w-4/5 mx-4 md:mx-auto py-4">
      <Announcement />
      <HomeBanner departments={departments} />
      <WantedList />
      {user?.department && (
        <Recommendations
          userId={user.id}
          department={user.department}
          limit={4}
        />
      )}
      <h1 className="text-2xl font-semibold mb-4">最近上新</h1>
      {!showFullLoading && (
        <ActiveFilterTags
          filters={filters}
          onRemove={handleRemoveFilter}
          onResetAll={() => navigate("/home")}
        />
      )}
      <div>
        <div className="flex flex-col md:flex-row">
          {!showFullLoading && (
            <Filters
              departmentFilter={filters.department}
              handleDepartmentChange={handleDepartmentChange}
              majorFilter={filters.major}
              handleMajorChange={handleMajorChange}
              departments={departments}
              majors={majors}
              majorDisabled={majorDisabled}
              sortBy={filters.sort}
              handleSortChange={handleSortChange}
              priceRange={stablePriceRange}
              handlePriceRangeChange={handlePriceRangeChange}
              categoryFilter={filters.category}
              handleCategoryFilterChange={handleCategoryFilterChange}
              handleResetAll={() => navigate("/home")}
            />
          )}
          <div className="w-full flex flex-col items-center">
            {showFullLoading ? (
              <Loading />
            ) : products.length === 0 ? (
              <EmptyState
                search={filters.search}
                category={filters.category}
                department={filters.department}
                major={filters.major}
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onResetAll={() => navigate("/home")}
              />
            ) : (
              <>
                {isRefreshing && (
                  <div className="w-full px-4">
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-1 bg-yellow-500 rounded-full animate-pulse w-2/3" />
                    </div>
                  </div>
                )}
                <ProductList currentProducts={products} searchTerm={filters.search} />
              </>
            )}
            {!showFullLoading && products.length > 0 && (
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                paginate={paginate}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductsList;
