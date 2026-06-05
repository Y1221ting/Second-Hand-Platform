import React from "react";

const ALL_CATEGORIES = [
  "教材教辅", "电子数码", "生活用品", "体育用品",
  "服饰美妆", "文具办公", "宿舍神器", "乐器爱好", "其他",
];

const Suggestion = ({ icon, text, children }) => (
  <div className="flex items-start gap-2">
    <span className="shrink-0 mt-0.5">{icon}</span>
    <span className="text-gray-400">{text || children}</span>
  </div>
);

const EmptyState = ({ search, category, department, major, minPrice, maxPrice, onResetAll }) => {
  const activeFilterCount = [
    category,
    department,
    major,
    minPrice && parseFloat(minPrice) > 0 ? 1 : 0,
    maxPrice && parseFloat(maxPrice) < 10000 ? 1 : 0,
  ].filter(Boolean).length;

  const isSearch = !!search;
  const isFilteredOnly = !isSearch && activeFilterCount >= 2;
  const isCategoryOnly = !isSearch && activeFilterCount === 1 && !!category;

  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-6">{isSearch ? "🔍" : "📭"}</span>

      {/* 场景 A：搜索无结果 */}
      {isSearch && (
        <>
          <p className="text-lg text-white mb-2">
            没有找到与 <span className="text-yellow-400">"{search}"</span> 相关的商品
          </p>
          <p className="text-sm mb-4">试试以下方法：</p>
          <div className="flex flex-col gap-2 text-sm text-left max-w-sm">
            <Suggestion icon="🔍" text="换个更简单的词试试，比如去掉修饰词" />
            <Suggestion icon="🔄" text="检查是否有拼写错误" />
            {activeFilterCount > 0 && (
              <Suggestion icon="🎯">
                <span>
                  当前筛选可能过窄，
                  <button onClick={onResetAll} className="text-yellow-400 hover:underline">清除全部筛选</button>
                  {" "}后再搜
                </span>
              </Suggestion>
            )}
            <Suggestion icon="📝">
              <span>
                去{" "}
                <a href="/wanted" className="text-yellow-400 hover:underline">求购广场</a>
                {" "}发布你想要的物品
              </span>
            </Suggestion>
          </div>
        </>
      )}

      {/* 场景 B：筛选过窄 */}
      {isFilteredOnly && !isSearch && (
        <>
          <p className="text-lg text-white mb-2">当前筛选条件下暂无商品</p>
          <p className="text-sm mb-4">试试放宽筛选条件：</p>
          <div className="flex flex-col gap-2 text-sm">
            <Suggestion icon="🔄">
              <span>
                <button onClick={onResetAll} className="text-yellow-400 hover:underline">清除全部筛选</button>
                ，查看所有商品
              </span>
            </Suggestion>
          </div>
        </>
      )}

      {/* 场景 C：单一分类为空 */}
      {isCategoryOnly && (
        <>
          <p className="text-lg text-white mb-2">「{category}」分类暂无在售商品</p>
          <p className="text-sm mb-4">看看其他分类：</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs">
            {ALL_CATEGORIES.filter((c) => c !== category).map((c) => (
              <a
                key={c}
                href={`/home?category=${encodeURIComponent(c)}`}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
              >
                {c}
              </a>
            ))}
          </div>
        </>
      )}

      {/* 场景 D：数据库为空（无搜索、无筛选也无结果） */}
      {!isSearch && !isFilteredOnly && !isCategoryOnly && (
        <>
          <p className="text-lg text-white mb-2">还没有商品，来做第一个发布者吧！</p>
          <a
            href="/add-product"
            className="mt-3 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
          >
            发布闲置
          </a>
        </>
      )}
    </div>
  );
};

export default EmptyState;
