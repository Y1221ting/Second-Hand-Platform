import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

// 公告内容放在这里，改内容时把 version 加 1 即可让所有用户重新看到
const ANNOUNCEMENT = {
  version: 1,
  title: "你们好呀，欢迎欢迎 👋",
  content:
    "我是该网站的开发者之一听风，希望帅气美丽的你们愿意陪同这个网站一起成长 ⌯oᴗo⌯\n\n闲来无事来试试吧，让我这个新手小白涨涨知识！要是有哪些需要改进或者不妥的地方可以向我提出，我会好好看滴！\n\n📮 我的邮箱：3237671249@qq.com",
};

const STORAGE_KEY = "announcement_dismissed_version";

const Announcement = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== String(ANNOUNCEMENT.version)) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, String(ANNOUNCEMENT.version));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-md mx-4 p-6">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <FaTimes className="text-lg" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {ANNOUNCEMENT.title}
        </h2>
        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
          {ANNOUNCEMENT.content}
        </p>
        <button
          onClick={handleClose}
          className="mt-5 w-full py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
        >
          我知道了
        </button>
      </div>
    </div>
  );
};

export default Announcement;
