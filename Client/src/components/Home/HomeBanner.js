import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// 学院 → emoji 映射（支持模糊匹配）
const DEPT_EMOJI = {
  "计算机":   "💻",
  "经济管理":  "📊",
  "外国语":   "🌍",
  "电子信息":  "🔌",
  "艺术":     "🎨",
  "机械工程":  "⚙️",
  "数学":     "📐",
  "物理":     "⚛️",
  "化学化工":  "🧪",
  "文学":     "📚",
  "法学":     "⚖️",
  "马克思":   "📖",
  "体育":     "🏃",
  "音乐":     "🎵",
  "美术":     "🖌️",
};
const DEFAULT_EMOJI = "🏛";

const getDeptEmoji = (dept) => {
  for (const [key, emoji] of Object.entries(DEPT_EMOJI)) {
    if (dept.includes(key)) return emoji;
  }
  return DEFAULT_EMOJI;
};

const HomeBanner = ({ departments }) => {
  const [stats, setStats] = useState({ userCount: 0, productCount: 0, todayCount: 0 });
  const [showHint, setShowHint] = useState(true);
  const [animTick, setAnimTick] = useState(0);
  const location = useLocation();

  // 从 URL 读取当前选中的学院
  const params = new URLSearchParams(location.search);
  const activeDept = params.get("department") || "";

  // 获取统计数据
  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          // key +1 → 数字组件重新挂载 → @keyframes 自然重新播放
          setAnimTick((t) => t + 1);
        })
        .catch(() => {});
    };
    fetchStats();
    // 每 60 秒轮询刷新（同时重新弹跳数字）
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // 选中学院后隐藏提示文字
  useEffect(() => {
    if (activeDept) setShowHint(false);
  }, [activeDept]);

  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 sm:p-6 mb-6 text-gray-900"
      style={{
        background: [
          `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.06) 20px, rgba(255,255,255,0.06) 21px)`,
          `radial-gradient(ellipse 180px 60px at 5% 100%, rgba(255,255,255,0.22) 0%, transparent 60%)`,
          `radial-gradient(ellipse 100px 80px at 92% 90%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          `linear-gradient(135deg, #facc15, #eab308, #ca8a04)`,
        ].join(","),
      }}
    >
      {/* 教学楼剪影装饰 */}
      <div
        className="absolute bottom-0 right-4 sm:right-6 flex items-end gap-[3px] sm:gap-[5px] opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        <div className="w-3 sm:w-4 h-8 sm:h-9 bg-amber-800 rounded-t-sm" />
        <div className="w-4 sm:w-5 h-10 sm:h-12 bg-amber-800 rounded-t-sm" />
        <div className="w-3 sm:w-3.5 h-6 sm:h-7 bg-amber-800 rounded-t-sm" />
        <div className="w-1.5 sm:w-2" />
        <div className="w-4 sm:w-[18px] h-9 sm:h-[42px] bg-amber-800 rounded-t-sm" />
        <div className="w-5 sm:w-[22px] h-11 sm:h-[52px] bg-amber-800 rounded-t-sm" />
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        {/* === 标题行：左侧标题 + 右侧统计数据 === */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
            🏫 校园二手集市
          </h1>
          <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
            <span className="flex items-center gap-1 whitespace-nowrap">
              👥 <strong
                key={"user-" + animTick}
                className="text-sm sm:text-lg inline-block animate-numPop"
              >{stats.userCount}</strong>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              📦 <strong
                key={"prod-" + animTick}
                className="text-sm sm:text-lg inline-block animate-numPop"
                style={{ animationDelay: "0.08s" }}
              >{stats.productCount}</strong>
            </span>
            {stats.todayCount > 0 && (
              <span className="text-amber-800/60 flex items-center gap-1 whitespace-nowrap">
                📌 今日+<strong
                  key={"today-" + animTick}
                  className="text-sm sm:text-lg inline-block animate-numPop"
                  style={{ animationDelay: "0.16s" }}
                >{stats.todayCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* === 学院标签区（最多 8 个，点击跳转筛选） === */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {departments.slice(0, 8).map((dept) => {
            const isActive = activeDept === dept;
            return (
              <Link
                key={dept}
                to={`/home?department=${encodeURIComponent(dept)}`}
                className={[
                  "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full",
                  "text-xs sm:text-sm transition-all duration-200",
                  "flex items-center gap-1 border-2",
                  isActive
                    ? "bg-white text-amber-800 font-semibold shadow-md border-yellow-400"
                    : "bg-white/35 hover:bg-white/55 text-gray-800 border-transparent",
                ].join(" ")}
              >
                <span className="text-xs sm:text-sm">{getDeptEmoji(dept)}</span>
                <span className="truncate max-w-[80px] sm:max-w-none">{dept}</span>
              </Link>
            );
          })}
        </div>

        {/* === 交互提示（选中学院后自动淡出） === */}
        <div
          className={[
            "mt-2 text-[10px] sm:text-xs text-amber-800/40 transition-opacity duration-500",
            showHint ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          💡 点击学院标签查看该学院在售商品
          {activeDept && <span className="ml-3">🎯 当前筛选：{activeDept}</span>}
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
