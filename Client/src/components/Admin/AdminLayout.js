import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { FaTachometerAlt, FaFlag, FaBox, FaUsers, FaHome } from "react-icons/fa";

const AdminLayout = () => {
  const { isAdmin, user } = useAuth();
  const location = useLocation();
  const [badges, setBadges] = useState({ pendingReports: 0, pendingUsers: 0 });

  // 获取待处理事项数量
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBadges({
            pendingReports: data.pendingReports || 0,
            pendingUsers: data.pendingUsers || 0,
          });
        }
      })
      .catch(() => {});
  }, [location.pathname]); // 切换页面时刷新角标

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const navItems = [
    { to: "/admin/dashboard", icon: FaTachometerAlt, label: "仪表盘" },
    { to: "/admin/reports", icon: FaFlag, label: "举报管理", badge: badges.pendingReports },
    { to: "/admin/products", icon: FaBox, label: "商品管理" },
    { to: "/admin/users", icon: FaUsers, label: "用户管理", badge: badges.pendingUsers },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0 min-h-screen flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">
            <span className="text-yellow-500">管理</span>后台
          </h2>
          <p className="text-gray-400 text-xs mt-1 truncate">{user?.fullName || user?.name}</p>
        </div>
        <nav className="py-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-yellow-500 text-gray-900 font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <item.icon className="text-xs" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 返回首页 */}
        <div className="p-3 border-t border-gray-700">
          <NavLink
            to="/home"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <FaHome className="text-xs" />
            返回首页
          </NavLink>
        </div>
      </aside>

      {/* 内容区 */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
