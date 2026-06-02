import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaHeart, FaTimes } from "react-icons/fa";

const ANNOUNCEMENT = {
  version: 1,
};

const STORAGE_KEY = "announcement_dismissed_version";

const REJECT_MESSAGES = [
  "不行，必须同意 😏",
  "再想想？你没有拒绝的选项哦～",
  "这个按钮是装饰品啦 🤪",
  "别挣扎了，点同意吧～",
  "拒绝无效！请重新选择 😎",
  "你点不到的，嘿嘿 ⌯oᴗo⌯",
];

const Announcement = () => {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [rejectMsg, setRejectMsg] = useState("");
  const [rejectCount, setRejectCount] = useState(0);
  const [running, setRunning] = useState(false);
  const rejectRef = useRef(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== String(ANNOUNCEMENT.version)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setAgreed(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, String(ANNOUNCEMENT.version));
      setVisible(false);
    }, 1800);
  };

  const randomizePosition = useCallback(() => {
    const btn = rejectRef.current;
    if (!btn) return;
    const parent = btn.parentElement;
    if (!parent) return;
    const pw = parent.clientWidth - btn.offsetWidth - 16;
    const ph = parent.clientHeight - btn.offsetHeight - 16;
    const x = Math.max(0, Math.floor(Math.random() * pw));
    const y = Math.max(0, Math.floor(Math.random() * ph));
    setRunning(true);
    btn.style.position = "absolute";
    btn.style.left = x + "px";
    btn.style.top = y + "px";
    setTimeout(() => setRunning(false), 300);
  }, []);

  const handleReject = () => {
    const msg = REJECT_MESSAGES[rejectCount % REJECT_MESSAGES.length];
    setRejectMsg(msg);
    setRejectCount((c) => c + 1);
    randomizePosition();
  };

  if (!visible) return null;

  if (agreed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-sm mx-4 p-8 text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">十分感谢！</h2>
          <p className="text-gray-500">欢迎加入南昌师范学院二手大家庭～</p>
          <p className="text-yellow-500 mt-2 font-medium">祝你淘到心仪好物 ⌯oᴗo⌯</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-sm mx-4 p-6 overflow-hidden"
        style={{ minHeight: "320px" }}
      >
        {/* 顶栏装饰 */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-yellow-400 to-green-400" />

        {/* 右上角关闭（给真有需要的人留后路） */}
        <button
          onClick={handleAccept}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
          title="关闭"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* 正文 */}
        <div className="text-center mt-4 mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            欢迎来到南昌师范学院二手平台！
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            我是开发者之一 <span className="font-semibold text-yellow-600">听风</span>
            ，希望帅气美丽的你们愿意陪这个网站一起成长 ⌯oᴗo⌯
          </p>
          <p className="text-xs text-gray-400 mt-3">
            闲来无事来试试吧，让我这个新手小白涨涨知识！<br />
            有改进建议随时向我提出～
          </p>
          <p className="text-xs text-gray-400 mt-1">
            📮 3237671249@qq.com
          </p>
        </div>

        {/* 灵魂拷问 */}
        <p className="text-center text-sm font-medium text-gray-700 mb-4">
          那么，你愿意留下来看看吗？
        </p>

        {/* 按钮区 */}
        <div className="relative flex justify-center gap-4 flex-wrap" style={{ minHeight: "60px" }}>
          <button
            onClick={handleAccept}
            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <FaHeart className="text-red-500 animate-pulse" />
            同意！
          </button>

          <button
            ref={rejectRef}
            onClick={handleReject}
            onMouseEnter={randomizePosition}
            className={`px-6 py-2.5 bg-gray-200 text-gray-500 rounded-full text-sm font-medium transition-all duration-200 select-none ${
              running ? "scale-90 opacity-70" : "hover:bg-gray-300"
            }`}
            style={{ touchAction: "manipulation" }}
          >
            残忍拒绝 😢
          </button>
        </div>

        {/* 拒绝反馈 */}
        {rejectMsg && (
          <p className="text-center text-xs text-pink-500 mt-3 animate-pulse font-medium">
            {rejectMsg}
          </p>
        )}

        {/* 小字 */}
        <p className="text-center text-[10px] text-gray-300 mt-4 select-none">
          其实你没有拒绝的选项 ⌯oᴗo⌯
        </p>
      </div>
    </div>
  );
};

export default Announcement;
