import React from "react";
import { FaExclamationTriangle, FaBoxOpen, FaBan, FaClipboardCheck } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";

const typeConfig = {
  warning: {
    icon: FaExclamationTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  product_delisted: {
    icon: FaBoxOpen,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  account_banned: {
    icon: FaBan,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  appeal_result: {
    icon: FaClipboardCheck,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
};

const NotificationModal = () => {
  const { criticalNotification, acknowledgeNotification } = useNotifications();

  if (!criticalNotification) return null;

  const config = typeConfig[criticalNotification.type] || typeConfig.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        <div className={`p-6 ${config.bg} flex items-center gap-4`}>
          <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${config.color}`}>
            <Icon className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{criticalNotification.title}</h2>
            <span className="text-xs text-gray-500">
              {new Date(criticalNotification.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{criticalNotification.content}</p>
          {criticalNotification.metadata?.reason && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium text-gray-700">原因：</span>
              {criticalNotification.metadata.reason}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => acknowledgeNotification(criticalNotification._id)}
            className="w-full py-3 bg-yellow-500 text-gray-900 rounded-xl font-bold hover:bg-yellow-600 transition-colors text-base"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
