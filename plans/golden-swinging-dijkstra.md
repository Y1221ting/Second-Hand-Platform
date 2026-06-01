# P1 详细实施方案 — 体验提升

---

## 一、收藏/心愿单

### 1.1 新增 Favorite 模型 (`Server/models/Favorite.js`)

```js
{ userId: ObjectId, productId: ObjectId ref Product, createdAt: Date }
// 联合唯一索引 { userId, productId }
```

### 1.2 API 端点 (`Server/routes/favoriteRoutes.js`)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/favorites/:productId` | 收藏商品 |
| DELETE | `/api/favorites/:productId` | 取消收藏 |
| GET | `/api/favorites` | 我的收藏列表（分页，populate 商品信息） |
| GET | `/api/favorites/check/:productId` | 检查是否已收藏 |

### 1.3 前端改动（3 处）

**A. ProductCard** — 右上角心形按钮：
- 空心 ♡ 未收藏 → 点击变实心 ❤️ 红色
- 已收藏状态从 API 获取
- 未登录点击跳转登录页

**B. ProductDetails** — 价格旁心形收藏按钮（大号）

**C. UserProfile** — 新增"收藏"Tab：
- 网格展示收藏的商品卡片
- 点击取消收藏

**D. Navbar / 个人中心** — 下拉菜单添加"我的收藏"入口

---

## 二、搜索增强

### 2.1 修复现有问题

**Home 页搜索框** — 当前只有 `onChange` 设置 keyword，回车不触发实际搜索：
- 添加搜索按钮 onClick
- 回车触发搜索
- 搜索后将 keyword 同步到 URL `?search=xxx`

### 2.2 搜索联想 (`Server/routes/productRoutes.js`)

新增 `GET /api/products/suggest?q=xxx`：
- 基于已有商品名称做 prefix regex 匹配
- 返回最多 8 条建议 `[{ _id, name, category }]`
- 前端：搜索框下拉建议列表，点击直接跳转

### 2.3 搜索历史（纯前端）

- localStorage 存储最近 10 条搜索
- 搜索框聚焦时显示历史列表
- 点击历史项直接搜索
- "清除历史"按钮

### 2.4 分类筛选

- 给 Product 模型添加 `category` 字段（复用现有的 9 种中文分类）
- Filters 组件已有分类下拉，需确保与后端对应
- 搜索框添加分类快捷标签（横向滚动标签栏）

---

## 三、个人主页增强

### 3.1 信用卡片

在 UserProfile 顶部信息卡片下方添加：
```
┌────────────────────────────────┐
│ ⭐ 4.8  好评率 96%  32条评价   │
│ ★★★★★  (分布条)               │
│ 在售 5 件 · 已售 12 件        │
└────────────────────────────────┘
```
- 评分数据已在 UserProfile 中获取（P0 已完成）
- 补充在售商品数 + 已售商品数统计

### 3.2 动态时间线

UserProfile 新增"动态"Tab：
- 最近上架的商品
- 最近的评价
- 按时间倒序混合展示

---

## 四、浏览历史

### 4.1 方案

纯前端，localStorage 存储：
```js
history: [{ productId, name, image, price, department, viewedAt }]
```
- 最多保存 50 条
- ProductPage 进入时写入
- Home 页侧边栏或底部新增"最近浏览"区域（横向滚动卡片）

---

## 五、商品发布体验优化

### 5.1 图片上传改造

**问题**：EditProduct 用 FileReader 转 base64 上传，大图会导致请求体过大。

**方案**：
- 改用 `FormData` + `multipart/form-data` 上传
- 后端新增 `POST /api/upload` 端点（已有 uploadRoutes，复用即可）
- 前端上传图片后拿到 URL，再提交表单
- 上传进度提示

### 5.2 常量抽取

**问题**：`SPEC_SUGGESTIONS` 在 AddProduct 和 ProductForm 中重复定义。

**方案**：抽取到 `Client/src/constants/specSuggestions.js`，两处 import 使用。

### 5.3 草稿自动保存

- `localStorage.setItem("product_draft", JSON.stringify(formData))` 每 30 秒
- 进入发布页时检测草稿 → 提示"检测到未完成的发布，是否恢复？"
- 发布成功后清除草稿

---

## 六、改动文件预估

| P1 模块 | 新增后端 | 新增前端 | 修改前端 | API |
|---------|---------|---------|---------|-----|
| 收藏 | 1 模型 + 1 路由 | 0 | 4 | 4 |
| 搜索增强 | 0 | 0 | 3 | 1 |
| 个人主页 | 0 | 0 | 1 | 0 |
| 浏览历史 | 0 | 0 | 2 | 0 |
| 发布体验 | 0 | 1 | 3 | 0 |
| **合计** | **2** | **1** | **13** | **5** |

总代码量 ~600 行，全兼容 2 核 2G 服务器。

---

## 七、实施顺序

```
1️⃣ 收藏/心愿单     ← 中等，前后端都要改，用户粘性功能
2️⃣ 搜索增强        ← 轻度，修改+新增1个API
3️⃣ 个人主页增强    ← 轻度，纯前端改动
4️⃣ 浏览历史        ← 简单，纯前端 localStorage
5️⃣ 发布体验优化    ← 中等，图片上传改造+常量抽取+草稿
```
