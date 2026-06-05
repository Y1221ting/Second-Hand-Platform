import React from "react";

// 安全高亮组件：不依赖 dangerouslySetInnerHTML，纯 JSX 数组渲染
const Highlight = ({ text, keyword }) => {
  if (!text || !keyword || !keyword.trim()) return <>{text}</>;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default Highlight;
