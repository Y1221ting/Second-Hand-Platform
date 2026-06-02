import React, { useState } from "react";
import { FaUser, FaSearch, FaBell, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { useNotifications } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const trimmed = searchTerm.trim();
      if (trimmed) {
        navigate(`/home?search=${encodeURIComponent(trimmed)}`);
      } else {
        navigate("/home");
      }
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/home");
  };

  return (
    <nav className="relative bg-gray-900 py-3 px-4 md:px-8 flex items-center justify-between z-10">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <Link to="/home" className="text-white text-2xl md:text-3xl font-bold whitespace-nowrap">
          <span className="text-yellow-500">Second</span>Hand
        </Link>
      </div>

      {/* 搜索框（桌面端显示） */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="搜索商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full py-1.5 px-4 pr-10 rounded-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm transition-colors"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        </div>
      </div>

      {/* 移动端搜索栏 */}
      {isMobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 px-4 py-3 md:hidden z-50 border-t border-gray-700">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="搜索商品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                handleSearch(e);
                if (e.key === "Enter") setIsMobileSearchOpen(false);
              }}
              className="w-full py-2 px-4 pr-10 rounded-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm transition-colors"
              autoFocus
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>
        </div>
      )}

      {/* 右侧导航链接 + 用户 */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* 移动端搜索图标 */}
        <button
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="md:hidden text-gray-400 hover:text-yellow-500 p-2 transition-colors"
          aria-label="搜索"
        >
          <FaSearch className="text-sm" />
        </button>

        {isAuthenticated ? (
          <>
            {/* 导航链接 */}
            <Link
              to="/home"
              className="hidden md:inline text-white hover:text-yellow-500 px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap"
            >
              首页
            </Link>
            <Link
              to="/add-product"
              className="hidden md:inline text-white hover:text-yellow-500 px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap"
            >
              发布闲置
            </Link>
            <Link
              to={`/profile/${user?.id}`}
              className="hidden md:inline text-white hover:text-yellow-500 px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap"
            >
              个人中心
            </Link>

            {/* 系统通知铃铛 */}
            <Link
              to="/warnings"
              className="relative text-gray-400 hover:text-yellow-500 p-2 transition-colors"
              title="系统通知"
            >
              <FaBell className="text-sm" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* 头像 + 下拉菜单 */}
            <div className="relative ml-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none hover:bg-gray-800 rounded-lg px-2 md:px-3 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold text-sm">
                  {user?.fullName ? user.fullName[0] : <FaUser className="text-xs" />}
                </div>
                <span className="text-white text-sm hidden md:inline">
                  {user?.fullName || "用户"}
                </span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl z-50 py-1 border border-gray-200">
                    <Link
                      to={`/profile/${user?.id}`}
                      className="block px-4 py-2.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors text-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      个人资料
                    </Link>
                    <Link
                      to="/cart"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors text-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      购物车
                    </Link>
                    <Link
                      to="/add-product"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors text-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      发布商品
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors text-sm flex items-center gap-2"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FaShieldAlt className="text-xs" />
                        管理后台
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-sm"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="text-white text-sm hover:text-yellow-500 transition duration-300 px-4 py-2"
          >
            登录
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
