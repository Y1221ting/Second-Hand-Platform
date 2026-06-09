import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Filters from "./Filters";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import ActiveFilterTags from "./ActiveFilterTags";
import EmptyState from "./EmptyState";
import SkeletonCard from "../Utility/SkeletonCard";
import ErrorBanner from "../Utility/ErrorBanner";
import HomeBanner from "./HomeBanner";
import Recommendations from "./Recommendations";
import Announcement from "./Announcement";
import { useAuth } from "../../context/authContext";
import { FaArrowUp } from "react-icons/fa";

const ProductsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filterCounts, setFilterCounts] = useState(null);
  const [wantedsCount, setWantedsCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const productListRef = useRef(null);

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

  // 获取筛选计数（分类/学院维度）
  useEffect(() => {
    fetch("/api/products/counts")
      .then((res) => res.json())
      .then((data) => setFilterCounts(data))
      .catch(() => setFilterCounts(null)); // 静默失败
  }, []);

  // 获取求购总数（用于入口 banner）
  useEffect(() => {
    fetch("/api/wanted?page=1&limit=1")
      .then((res) => res.json())
      .then((data) => setWantedsCount(data.total || 0))
      .catch(() => {});
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
    setFetchError(null);
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
        setFetchError("服务器响应异常，请稍后重试");
      }
    } catch (error) {
      setFetchError("网络连接失败，请检查后重试");
    } finally {
      setIsLoading(false);
    }
  }, [readUrlParams, user?.department]);

  // URL 变化 → 拉取商品
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 搜索/筛选变化时自动滚动到商品列表
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasActiveSearch = params.has("search") || params.has("category") || params.has("department") || params.has("major");
    if (hasActiveSearch && productListRef.current) {
      // 延迟等待数据渲染
      const timer = setTimeout(() => {
        productListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

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

  // 滚动监听 — 显示/隐藏回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      {wantedsCount > 0 && (
        <Link
          to="/wanted"
          className="block mb-4 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-800">
              📢 当前有 {wantedsCount} 位同学在求购商品
            </span>
            <span className="text-xs text-green-600 font-medium">去看看 →</span>
          </div>
        </Link>
      )}
      {user?.department && (
        <Recommendations
          userId={user.id}
          department={user.department}
          limit={4}
        />
      )}
      <h1 ref={productListRef} className="text-2xl font-semibold mb-4">最近上新</h1>
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
              counts={filterCounts}
            />
          )}
          <div className="w-full flex flex-col items-center">
            {showFullLoading ? (
              <div className="w-full p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ) : fetchError ? (
              <ErrorBanner message={fetchError} onRetry={fetchProducts} fullPage />
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
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-1.5 w-1/4 bg-yellow-500 rounded-full animate-loading-bar" />
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
      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-gray-900/80 hover:bg-yellow-500 text-white hover:text-gray-900 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="回到顶部"
        >
          <FaArrowUp size={16} />
        </button>
      )}
    </main>
  );
};

export default ProductsList;
