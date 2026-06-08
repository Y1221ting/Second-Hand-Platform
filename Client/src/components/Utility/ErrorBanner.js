import React from "react";

const ErrorBanner = ({ message, onRetry, fullPage }) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <span className="text-5xl mb-4">⚠️</span>
      <p className="text-lg text-white mb-2">加载失败</p>
      <p className="text-sm text-gray-500 mb-4 text-center px-4">
        {message || "请检查网络连接后重试"}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
        >
          重新加载
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorBanner;
