import React from "react";

const AppealList = ({ appeals }) => {
  const statusLabel = (s) => {
    if (s === "pending") return { text: "待处理", cls: "bg-yellow-100 text-yellow-800" };
    if (s === "approved") return { text: "已通过", cls: "bg-green-100 text-green-800" };
    if (s === "rejected") return { text: "已驳回", cls: "bg-red-100 text-red-800" };
    return { text: s, cls: "" };
  };

  if (appeals.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8 text-sm">暂无申诉记录</p>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">我的申诉</h2>
      <div className="space-y-3">
        {appeals.map((appeal) => (
          <div key={appeal._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {appeal.productId?.name || "商品已删除"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel(appeal.status).cls}`}>
                    {statusLabel(appeal.status).text}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">申诉理由：{appeal.reason}</p>
                {appeal.handleNote && (
                  <p className="text-sm text-gray-500 mt-1">
                    管理员备注：{appeal.handleNote}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(appeal.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {appeal.productId?.images?.[0] && (
                <div
                  className="w-14 h-14 rounded-lg bg-gray-200 bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${appeal.productId.images[0]})` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppealList;
