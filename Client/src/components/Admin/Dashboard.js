import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBox, FaUserPlus, FaBoxOpen, FaFlag, FaUserClock } from "react-icons/fa";
import Loading from "../Utility/Loading";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, trendRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/stats/trend?days=7", { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (trendRes.ok) setTrend(await trendRes.json());
    } catch (err) {
      console.error("获取数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 可点击跳转的统计卡片
  const linkMap = {
    "待审核用户": "/admin/users",
    "待处理举报": "/admin/reports",
  };

  if (loading) return <Loading />;

  const cards = [
    { label: "用户总数", value: stats?.userCount ?? "-", icon: FaUsers, color: "bg-blue-500" },
    { label: "在售商品", value: stats?.productCount ?? "-", icon: FaBox, color: "bg-green-500" },
    { label: "今日新增用户", value: stats?.todayUsers ?? "-", icon: FaUserPlus, color: "bg-purple-500" },
    { label: "今日新增商品", value: stats?.todayProducts ?? "-", icon: FaBoxOpen, color: "bg-orange-500" },
    { label: "待审核用户", value: stats?.pendingUsers ?? "-", icon: FaUserClock, color: "bg-yellow-500" },
    { label: "待处理举报", value: stats?.pendingReports ?? "-", icon: FaFlag, color: "bg-red-500" },
  ];

  // 计算柱状图的最大值（用于统一缩放）
  const maxVal = trend.length > 0
    ? Math.max(...trend.flatMap((d) => [d.newUsers, d.newProducts, d.newReports]), 1)
    : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <button
          onClick={fetchAll}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
        >
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 ${
              linkMap[card.label] ? "cursor-pointer hover:shadow-md transition-shadow" : ""
            }`}
            onClick={linkMap[card.label] ? () => navigate(linkMap[card.label]) : undefined}
          >
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
              <card.icon className="text-white text-lg" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 近 7 天趋势图 + 待办事项 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* 趋势图 — 占 2 列 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">近 7 天趋势</h2>
          {trend.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无趋势数据</p>
          ) : (
            <div className="space-y-5">
              {/* 新增用户 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">新增用户</p>
                <div className="flex items-end gap-1 h-20">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {d.newUsers || ""}
                      </span>
                      <div
                        className="w-full bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                        style={{ height: `${(d.newUsers / maxVal) * 100}%`, minHeight: d.newUsers > 0 ? "4px" : "0" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-gray-400">
                      {d.date}
                    </div>
                  ))}
                </div>
              </div>

              {/* 新增商品 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">新增商品</p>
                <div className="flex items-end gap-1 h-20">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {d.newProducts || ""}
                      </span>
                      <div
                        className="w-full bg-orange-400 rounded-t transition-all hover:bg-orange-500"
                        style={{ height: `${(d.newProducts / maxVal) * 100}%`, minHeight: d.newProducts > 0 ? "4px" : "0" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-gray-400">
                      {d.date}
                    </div>
                  ))}
                </div>
              </div>

              {/* 新增举报 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">新增举报</p>
                <div className="flex items-end gap-1 h-16">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {d.newReports || ""}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all ${
                          d.newReports > 0 ? "bg-red-400 hover:bg-red-500" : "bg-gray-200"
                        }`}
                        style={{ height: `${(d.newReports / maxVal) * 100}%`, minHeight: d.newReports > 0 ? "4px" : "0" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  {trend.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-gray-400">
                      {d.date}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 待办事项 — 占 1 列 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">待办事项</h2>
          <div className="space-y-3">
            {stats?.pendingUsers > 0 && (
              <div
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => navigate("/admin/users")}
              >
                <div className="flex items-center gap-3">
                  <FaUserClock className="text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">待审核用户</p>
                    <p className="text-xs text-gray-500">{stats.pendingUsers} 人等待审核</p>
                  </div>
                </div>
                <span className="text-xs text-yellow-700 font-medium bg-yellow-200 px-2 py-0.5 rounded-full">
                  {stats.pendingUsers}
                </span>
              </div>
            )}
            {stats?.pendingReports > 0 && (
              <div
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => navigate("/admin/reports")}
              >
                <div className="flex items-center gap-3">
                  <FaFlag className="text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">待处理举报</p>
                    <p className="text-xs text-gray-500">{stats.pendingReports} 条举报待处理</p>
                  </div>
                </div>
                <span className="text-xs text-red-700 font-medium bg-red-200 px-2 py-0.5 rounded-full">
                  {stats.pendingReports}
                </span>
              </div>
            )}
            {(!stats?.pendingUsers || stats.pendingUsers === 0) &&
             (!stats?.pendingReports || stats.pendingReports === 0) && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm">全部已处理</p>
                <p className="text-xs mt-1">暂无待办事项</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
