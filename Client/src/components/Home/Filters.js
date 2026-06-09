import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

// ─── 内联小组件 ───────────────────────────────────────

const FilterButton = ({ icon, label, isActive, isSelected, onClick, onHover, clickOnly }) => (
  <button
    onClick={onClick}
    onMouseEnter={clickOnly ? undefined : onHover}
    className={`
      flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-all select-none
      ${isActive
        ? "bg-gray-800 text-white border border-yellow-500/30"
        : isSelected
          ? "text-yellow-400 font-medium hover:bg-gray-800/60"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }
    `}
  >
    {icon && <span className="text-xs">{icon}</span>}
    <span className={isSelected ? "text-yellow-400" : ""}>{label}</span>
    {!clickOnly && (
      <FaChevronDown className={`text-[10px] transition-transform ${isActive ? "rotate-180" : ""} ${isSelected ? "text-yellow-400/60" : "text-gray-500"}`} />
    )}
  </button>
);

const DeptItem = ({ name, selected, hasChildren, onHover, onClick }) => (
  <button
    onMouseEnter={onHover}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
      selected
        ? "bg-yellow-500/10 text-yellow-400"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`}
  >
    <span>{name}</span>
    {hasChildren && <FaChevronRight className="text-[10px] text-gray-500 shrink-0" />}
  </button>
);

const MajorItem = ({ name, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
      selected
        ? "bg-yellow-500/10 text-yellow-400"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`}
  >
    {name}
  </button>
);

const ListItem = ({ name, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
      selected
        ? "bg-yellow-500/10 text-yellow-400"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? "bg-yellow-400" : "bg-transparent"}`} />
    {name}
  </button>
);

const SORT_LABELS = {
  latest: "最新发布",
  lowestPrice: "价格从低到高",
  highestPrice: "价格从高到低",
  closest: "离我最近",
};

const ALL_CATEGORIES = [
  "教材教辅", "电子数码", "生活用品", "体育用品",
  "服饰美妆", "文具办公", "宿舍神器", "乐器爱好", "其他",
];

// ─── 主组件 ───────────────────────────────────────────

const Filters = ({
  departmentFilter,
  handleDepartmentChange,
  majorFilter,
  handleMajorChange,
  departments,
  majors,
  majorDisabled,
  majorMap,
  sortBy,
  handleSortChange,
  priceRange,
  handlePriceRangeChange,
  categoryFilter,
  handleCategoryFilterChange,
  handleResetAll,
  counts,
}) => {
  // ── 状态 ──
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hoverDept, setHoverDept] = useState(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [flyoutPos, setFlyoutPos] = useState({ left: 0, top: 0 });

  const containerRef = useRef(null);
  const closeTimer = useRef(null);
  const btnRefs = useRef({ department: null, category: null, sort: null, price: null });

  // ── 衍生值 ──
  const currentDept = departmentFilter || "";
  const currentMajor = majorFilter || "";
  const currentCat = categoryFilter || "";
  const currentSort = sortBy || "latest";
  const hasPrice = priceRange[0] > 0 || priceRange[1] < 10000;

  const deptLabel = currentDept || "全部学院";
  const catLabel = currentCat || "全部分类";
  const sortLabel = SORT_LABELS[currentSort] || "最新发布";
  const priceLabel = hasPrice ? `¥${priceRange[0]} - ¥${priceRange[1]}` : "价格";

  // ── 浮层定位辅助 ──
  const positionFlyout = (name) => {
    const btn = btnRefs.current[name];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      let left = rect.left;
      // 估算浮层宽度并约束到视口内
      const estWidth = { department: 400, category: 180, sort: 200, price: 260 }[name] || 260;
      if (left + estWidth > window.innerWidth - 16) {
        left = window.innerWidth - estWidth - 16;
      }
      setFlyoutPos({ left: Math.max(8, left), top: rect.bottom + 4 });
    }
  };

  // ── 浮层控制 ──
  const openFilter = (name, lock) => {
    clearTimeout(closeTimer.current);
    if (activeFilter === name && isLocked) {
      setActiveFilter(null);
      setIsLocked(false);
      setHoverDept(null);
      return;
    }
    setActiveFilter(name);
    setIsLocked(lock);
    if (name !== "department") setHoverDept(null);
    positionFlyout(name);
  };

  const closeFilter = () => {
    setActiveFilter(null);
    setIsLocked(false);
    setHoverDept(null);
  };

  // 按钮 hover（仅非锁定状态下切换浮层）
  const handleFilterHover = (name) => {
    if (activeFilter !== null && isLocked) return;
    clearTimeout(closeTimer.current);
    if (activeFilter !== name) {
      setActiveFilter(name);
      setIsLocked(false);
      if (name !== "department") setHoverDept(null);
      positionFlyout(name);
    }
  };

  // ── 鼠标离开/进入操作区域（操作栏 + 浮层）──
  const handleAreaEnter = () => clearTimeout(closeTimer.current);

  const handleAreaLeave = () => {
    closeTimer.current = setTimeout(() => closeFilter(), 200);
  };

  // ── 外部点击 + ESC 关闭 ──
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeFilter();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeFilter();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // ── 价格弹窗打开时同步当前值 ──
  useEffect(() => {
    if (activeFilter === "price") {
      setPriceMin(priceRange[0] > 0 ? String(priceRange[0]) : "");
      setPriceMax(priceRange[1] < 10000 ? String(priceRange[1]) : "");
    }
  }, [activeFilter, priceRange]);

  // ── 浮层/底部 sheet 打开时锁定 body 滚动 ──
  useEffect(() => {
    const shouldLock = activeFilter !== null || showMobileFilters;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeFilter, showMobileFilters]);

  // ── 筛选操作 ──
  const selectDepartment = (dept) => {
    handleDepartmentChange({ target: { value: dept } });
    handleMajorChange({ target: { value: "" } });
    if (!dept || !majorMap[dept]?.length) closeFilter();
  };

  const selectMajor = (major) => {
    handleMajorChange({ target: { value: major } });
    closeFilter();
  };

  const selectCategory = (cat) => {
    handleCategoryFilterChange({ target: { value: cat } });
    closeFilter();
  };

  const selectSort = (sort) => {
    handleSortChange({ target: { value: sort } });
    closeFilter();
  };

  const confirmPrice = () => {
    const min = priceMin === "" ? 0 : Math.max(0, parseFloat(priceMin) || 0);
    const max = priceMax === "" ? 10000 : Math.min(10000, parseFloat(priceMax) || 10000);
    handlePriceRangeChange(Math.min(min, max), Math.max(min, max));
    closeFilter();
  };

  const resetPrice = () => {
    setPriceMin("");
    setPriceMax("");
    handlePriceRangeChange(0, 10000);
    closeFilter();
  };

  const hasActiveFilter = !!(currentDept || currentMajor || currentCat || currentSort !== "latest" || hasPrice);

  const handlePriceKeyDown = (e) => {
    if (e.key === "Enter") confirmPrice();
  };

  return (
    <div ref={containerRef}>
      {/* ════════════════ 桌面端 ════════════════ */}
      {/* 整个操作区域用一个容器包裹，鼠标离开时自动关闭（非锁定态） */}
      <div className="hidden md:block relative">
        {/* 操作栏 */}
        <div onMouseEnter={handleAreaEnter} onMouseLeave={handleAreaLeave}>
          <div className="flex items-center gap-1.5 bg-gray-900/50 rounded-lg px-3 py-2">
            {/* 学院 */}
            <div ref={(el) => { btnRefs.current.department = el; }}>
              <FilterButton
                icon="🏫"
                label={deptLabel}
                isActive={activeFilter === "department"}
                isSelected={!!currentDept}
                onClick={() => openFilter("department", true)}
                onHover={() => handleFilterHover("department")}
              />
            </div>
            {/* 分类 */}
            <div ref={(el) => { btnRefs.current.category = el; }}>
              <FilterButton
                icon="📦"
                label={catLabel}
                isActive={activeFilter === "category"}
                isSelected={!!currentCat}
                onClick={() => openFilter("category", true)}
                onHover={() => handleFilterHover("category")}
              />
            </div>
            {/* 排序 */}
            <div ref={(el) => { btnRefs.current.sort = el; }}>
              <FilterButton
                icon="↕️"
                label={sortLabel}
                isActive={activeFilter === "sort"}
                isSelected={currentSort !== "latest"}
                onClick={() => openFilter("sort", true)}
                onHover={() => handleFilterHover("sort")}
              />
            </div>
            {/* 价格 — click only */}
            <div ref={(el) => { btnRefs.current.price = el; }}>
              <FilterButton
                icon="💰"
                label={priceLabel}
                isActive={activeFilter === "price"}
                isSelected={hasPrice}
                onClick={() => openFilter("price", true)}
                clickOnly
              />
            </div>

            {/* 重置 */}
            {hasActiveFilter && (
              <button
                onClick={handleResetAll}
                className="ml-auto text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {/* 浮层 — fixed 定位，出现在对应按钮下方 */}
        {activeFilter && (
          <div
            style={{ position: "fixed", left: flyoutPos.left, top: flyoutPos.top, zIndex: 40 }}
            onMouseEnter={handleAreaEnter}
            onMouseLeave={handleAreaLeave}
          >
            {/* 学院级联浮层 */}
            {activeFilter === "department" && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex">
                  <div className="w-44 py-1 max-h-80 overflow-y-auto">
                    <DeptItem
                      name="全部学院"
                      selected={!currentDept}
                      onHover={() => { setHoverDept(null); clearTimeout(closeTimer.current); }}
                      onClick={() => selectDepartment("")}
                    />
                    {departments.map((dept) => (
                      <DeptItem
                        key={dept}
                        name={dept}
                        selected={currentDept === dept}
                        hasChildren={majorMap[dept]?.length > 0}
                        onHover={() => { setHoverDept(dept); clearTimeout(closeTimer.current); }}
                        onClick={() => selectDepartment(dept)}
                      />
                    ))}
                  </div>
                  {hoverDept && majorMap[hoverDept]?.length > 0 && (
                    <div className="w-52 py-1 max-h-80 overflow-y-auto border-l border-gray-700">
                      {majorMap[hoverDept].map((major) => (
                        <MajorItem
                          key={major}
                          name={major}
                          selected={currentMajor === major}
                          onClick={() => selectMajor(major)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 分类浮层 */}
            {activeFilter === "category" && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 w-44">
                <ListItem name="全部分类" selected={!currentCat} onClick={() => selectCategory("")} />
                {ALL_CATEGORIES.map((cat) => (
                  <ListItem key={cat} name={cat} selected={currentCat === cat} onClick={() => selectCategory(cat)} />
                ))}
              </div>
            )}

            {/* 排序浮层 */}
            {activeFilter === "sort" && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 w-48">
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <ListItem key={value} name={label} selected={currentSort === value} onClick={() => selectSort(value)} />
                ))}
              </div>
            )}

            {/* 价格弹窗 */}
            {activeFilter === "price" && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-64">
                <p className="text-xs text-gray-400 mb-3">价格范围</p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    className="w-full bg-gray-800 text-white text-center rounded-lg py-2 text-sm border border-gray-600 focus:outline-none focus:border-yellow-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-gray-500 text-sm shrink-0">—</span>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="10000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    className="w-full bg-gray-800 text-white text-center rounded-lg py-2 text-sm border border-gray-600 focus:outline-none focus:border-yellow-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmPrice}
                    className="flex-1 bg-yellow-500 text-gray-900 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
                  >
                    确认
                  </button>
                  <button
                    onClick={resetPrice}
                    className="flex-1 bg-gray-700 text-gray-300 py-1.5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════ 移动端 ════════════════ */}
      <div className="md:hidden">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="w-full bg-gray-800 text-white py-2.5 px-4 rounded-lg text-sm flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            🏷️ 筛选条件
            {hasActiveFilter && (
              <span className="bg-yellow-500 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {(!!currentDept + !!currentCat + (currentSort !== "latest") + hasPrice)}
              </span>
            )}
          </span>
          <FaChevronDown className="text-gray-400 text-xs" />
        </button>

        {showMobileFilters && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="flex justify-center pt-2 pb-1 sticky top-0 bg-gray-900 z-10">
                <div className="w-8 h-1 bg-gray-600 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
                <h3 className="text-white font-medium text-base">筛选</h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-white p-1">✕</button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">学院</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => { handleDepartmentChange(e); handleMajorChange({ target: { value: "" } }); }}
                    className="w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">全部学院{counts?.total ? ` (${counts.total})` : ""}</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}{counts?.byDepartment?.[dept] ? ` (${counts.byDepartment[dept]})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">专业</label>
                  <select
                    value={majorFilter}
                    onChange={handleMajorChange}
                    disabled={majorDisabled}
                    className={`w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 focus:outline-none focus:border-yellow-500 ${majorDisabled ? "opacity-50" : ""}`}
                  >
                    <option value="">{majorDisabled ? "请先选学院" : "全部专业"}</option>
                    {majors.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">分类</label>
                  <select
                    value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                    className="w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">全部分类{counts?.total ? ` (${counts.total})` : ""}</option>
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}{counts?.byCategory?.[cat] ? ` (${counts.byCategory[cat]})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">排序</label>
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">价格范围</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="最低价"
                      value={priceRange[0] > 0 ? priceRange[0] : ""}
                      onChange={(e) => {
                        const min = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                        handlePriceRangeChange(min, priceRange[1]);
                      }}
                      className="w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm text-center border border-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      placeholder="最高价"
                      value={priceRange[1] < 10000 ? priceRange[1] : ""}
                      onChange={(e) => {
                        const max = e.target.value === "" ? 10000 : Math.min(10000, parseInt(e.target.value) || 0);
                        handlePriceRangeChange(priceRange[0], max);
                      }}
                      className="w-full p-2.5 rounded-lg bg-gray-800 text-white text-sm text-center border border-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 p-4 bg-gray-900 border-t border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => { handleResetAll(); setShowMobileFilters(false); }}
                    className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    重置
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-[2] py-2.5 rounded-lg bg-yellow-500 text-gray-900 text-sm font-bold hover:bg-yellow-400 transition-colors"
                  >
                    完成
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Filters;
