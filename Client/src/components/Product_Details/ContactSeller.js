import React, { useState } from "react";
import { FaTimes, FaCopy, FaWeixin, FaQq, FaPhone } from "react-icons/fa";

const ContactSeller = ({ contact, onClose }) => {
  const [copied, setCopied] = useState(null);

  const handleCopy = (label, value) => {
    // 创建临时 textarea（兼容 HTTP 非安全上下文，无需 HTTPS）
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // 极端兜底：提示用户手动复制
      alert(`复制失败，请手动复制：${value}`);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const items = [];
  if (contact.wechat) {
    items.push({ label: "wechat", icon: <FaWeixin className="text-green-500" />, title: "微信", value: contact.wechat });
  }
  if (contact.qq) {
    items.push({ label: "qq", icon: <FaQq className="text-blue-500" />, title: "QQ", value: contact.qq });
  }
  if (contact.phone) {
    items.push({ label: "phone", icon: <FaPhone className="text-gray-500" />, title: "手机", value: contact.phone });
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:w-96 rounded-t-2xl md:rounded-2xl p-6 shadow-xl md:mb-0 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">联系卖家</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {contact.sellerName} · {contact.sellerDepartment}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* 联系方式列表 */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">卖家暂未填写联系方式</p>
          ) : (
            items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{item.title}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(item.label, item.value)}
                  className={`shrink-0 ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    copied === item.label
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  }`}
                >
                  {copied === item.label ? "已复制 ✓" : <><FaCopy className="inline mr-1 text-xs" />复制</>}
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-5 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 leading-relaxed">
          <p className="font-medium mb-1">💡 交易提示</p>
          <p>复制微信/QQ后可添加好友与卖家沟通。交易时请注意人身和财产安全，建议选择校内公共区域面交。</p>
        </div>
      </div>
    </div>
  );
};

export default ContactSeller;
