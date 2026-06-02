import React, { useState, useEffect } from "react";
import { FaUsers, FaBox, FaUserPlus, FaBoxOpen, FaFlag } from "react-icons/fa";
import Loading from "../Utility/Loading";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("获取统计数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: "用户总数", value: stats?.userCount ?? "-", icon: FaUsers, color: "bg-blue-500" },
    { label: "在售商品", value: stats?.productCount ?? "-", icon: FaBox, color: "bg-green-500" },
    { label: "今日新增用户", value: stats?.todayUsers ?? "-", icon: FaUserPlus, color: "bg-purple-500" },
    { label: "今日新增商品", value: stats?.todayProducts ?? "-", icon: FaBoxOpen, color: "bg-orange-500" },
    { label: "待处理举报", value: stats?.pendingReports ?? "-", icon: FaFlag, color: "bg-red-500" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
        >
          刷新数据
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
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
    </div>
  );
};

export default Dashboard;
