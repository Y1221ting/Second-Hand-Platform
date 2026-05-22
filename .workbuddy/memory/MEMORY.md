# MEMORY.md — 长期记忆

## 项目关键约定

### Decimal128 价格处理（2026-05-21 修复）
- MongoDB `price` 字段类型为 `Decimal128`，`toJSON`/`toObject` transform 在 populate 场景下不可靠
- **双保险原则**：后端所有 API 返回前显式 `Number(productObj.price) || 0`；前端用 `Number(product.price ?? 0)` 替代 `parseFloat()`
- 涉及的所有文件已在 productController.js、cartController.js、前端 ProductCard/ProductDetails/Cart/UserProfile/ProductList 中修复

### 导航栏命名约定（2026-05-22）
- 顶部 Navbar「首页」→ `/home`（商品列表）；底部 Footer「首页」→「网站首页」→ `/`（欢迎页），避免名称冲突
- Navbar 中「我的交易」→「个人中心」，与下拉菜单「个人资料」语义一致

### 商品列表搜索机制（2026-05-22）
- Navbar 搜索框按 Enter 跳转 `/home?search=xxx`
- `Home/index.js` 从 URL search 参数读取并初始化 `debouncedSearch`
- Filters.js 左侧不再有搜索输入框

### 个人商品卡片风格（2026-05-22）
- Profile/ProductList.js 改为紧凑横条布局（80px 小图 + 名称 + 价格 + 日期），描述不直接显示，点商品名进详情页查看

### 商品列表布局（2026-05-22）
- Home/ProductList.js 容器采用 Grid 响应式布局：`grid-cols-1 sm:2 lg:3 xl:4`

### UserDetails 字段合并（2026-05-22）
- 删除 city/state/zipCode 独立字段，所有地区信息统一走 `address` 一个字段
- 省市区联动选择结果与详情地址合并成一条字符串存入 `address`

### 购物车数据获取（2026-05-22）
- UserProfile 挂载时即获取购物车数据，不再依赖 activeTab 切换
- cartController.js 的 removeFromCart 和 updateQuantity 返回 populate 后的购物车
