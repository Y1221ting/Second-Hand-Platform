# Second-Hand 二手交易平台 — 学习指南

> 用于比赛线下演示，助你全面掌握该项目

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈详解](#2-技术栈详解)
3. [架构与数据流](#3-架构与数据流)
4. [前端详解](#4-前端详解)
5. [后端详解](#5-后端详解)
6. [数据库模型](#6-数据库模型)
7. [认证流程](#7-认证流程)
8. [关键功能实现](#8-关键功能实现)
9. [Docker 部署架构](#9-docker-部署架构)
10. [学习路线图](#10-学习路线图)
11. [常见面试/演示问题](#11-常见面试演示问题)

---

## 1. 项目概览

**Second-Hand** 是一个面向大学生的校园二手交易电子商务平台。核心功能：

| 功能 | 说明 |
|------|------|
| 用户注册/登录 | JWT 认证，邮箱+密码 |
| 商品发布 | 名称、分类、描述、价格、图片、规格参数 |
| 商品浏览 | 搜索、分类/学校/价格筛选、排序、分页 |
| 商品详情 | 图片、描述、规格、库存、购买按钮 |
| 购买功能 | 原子操作减库存，防超卖 |
| 购物车 | 添加/修改/结算，批量购买 |
| 个人资料 | 编辑信息、查看发布/购买记录 |
| 求购/举报/申诉 | 完整的内容治理体系 |
| AI 辅助 | 通义千问 API 生成描述、推荐分类 |
| 管理后台 | 数据概览、举报/商品/用户/申诉管理 |
| 安全防护 | IP限流、NoSQL注入防护、PII脱敏、CSP+安全头、文件magic bytes、违禁词过滤、防盗链、多设备互踢 |

**线上地址：** http://freevian.top:5000  
**GitHub：** https://github.com/Y1221ting/Second-Hand-Platform.git

---

## 2. 技术栈详解

### 前端

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **React 18** | UI 框架 | 函数组件 + Hooks |
| **React Router v6** | 路由 | `<Routes>`, `<Route>`, `useNavigate`, `useParams`, `Link` |
| **Tailwind CSS 3** | 样式 | 原子化 CSS，`className` 直接写样式，主色调 `yellow-500` |
| **react-icons** | 图标 | `FaMagic`, `FaEdit`, `FaShoppingCart`, `FaUser`, `FaTimes` |
| **@uiball/loaders** | 加载动画 | `NewtonsCradle` 组件 |
| **Fetch API** | HTTP 请求 | 使用相对路径 `/api/...`，由 Nginx 代理转发 |

### 后端

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **Express 4** | Web 框架 | 路由 + 中间件 |
| **Mongoose 7** | MongoDB ODM | Schema 定义、数据校验、查询 |
| **bcryptjs** | 密码加密 | 8 轮 salt（服务器 2GB 内存限制，使用 bcryptjs 替代 bcrypt） |
| **jsonwebtoken** | JWT 令牌 | `sign({ userId }, SECRET, { expiresIn: "1d" })` |
| **multer** | 文件上传 | 磁盘存储到 `Server/uploads/` |
| **axios** | HTTP 客户端 | 后端调用通义千问 API |

### 部署

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **Docker Compose** | 容器编排 | 3 个服务：mongodb, backend, frontend |
| **Nginx** | 反向代理 | `/api/` → backend:8000，`/uploads/` → backend:8000 |
| **阿里云 ECS** | 服务器 | 2GB RAM，域名: `freevian.top` |
| **MongoDB** | 数据库 | Docker 容器内，密码 `@Yt1221wz`（URI 中`@`编码为`%40`） |

---

## 3. 架构与数据流

### 请求流程

```
浏览器 → Nginx (端口 5000) → 静态页面 /index.html
                         → /api/xxx → backend:8000 → MongoDB
                         → /uploads/xxx → backend:8000 → 文件系统
```

### 数据流示例：浏览商品

```
1. 用户打开 /home
2. React 渲染 Navbar + ProductsList + Footer
3. ProductsList 调用 fetch('/api/products/?page=1&limit=20&sort=latest')
4. Nginx 代理到 backend:8000
5. Express 路由 GET /api/products/ → getAllProducts()
6. Mongoose 查询 MongoDB → Product.find().sort().skip().limit()
7. 返回 JSON → React 渲染 ProductCard 列表
```

### 数据流示例：购买商品

```
1. 用户点击"立即购买"
2. Dialog 弹窗填写收货信息
3. 调用 fetch('/api/products/:id/purchase', POST, JWT Token)
4. 后端 findOneAndUpdate({ $inc: { quantity: -1 } }) — 原子操作
5. 返回成功 → 刷新商品详情
```

---

## 4. 前端详解

### 路由结构 (`App.js`)

```
/                   → Landing.js       (着陆页)
/home               → Home.js          (商品列表)
/product/:id        → ProductPage.js   (商品详情)
/register           → Register.js      (注册)
/login              → Login.js         (登录)

// 以下路由受 ProtectedRoute 保护，未登录自动跳 /login
/add-product        → AddProduct.js    (发布商品)
/product/:id/edit   → EditProduct.js   (编辑商品)
/profile/:id        → UserProfile.js   (个人资料)
```

### 组件层级

```
App
├── Landing.js                      # 着陆页，背景图 + 品牌介绍
├── Login.js / Register.js          # 登录/注册表单
├── Home.js
│   ├── Navbar                      # 导航栏：Logo + 用户头像/登录按钮
│   ├── ProductsList (Home/index.js)
│   │   ├── Filters.js              # 搜索框、学校、分类、排序、价格
│   │   ├── ProductList.js          # ProductCard 列表
│   │   └── Pagination.js           # 分页按钮
│   └── Footer                      # 页脚链接
├── ProductPage.js
│   └── ProductDetails.js           # 图片、价格、描述、规格、购买 + 推荐
│       ├── Recommendations.js      # 猜你喜欢推荐（底部）
│       └── Dialog.js               # 购买确认弹窗（省-市联动）
│           └── FormField.js        # 通用表单字段
├── AddProduct.js                   # 发布商品（含AI功能）
├── EditProduct.js
│   └── ProductForm.js              # 编辑表单（复用）
├── UserProfile.js
│   ├── UserDetails.js              # 用户信息展示/编辑
│   │   └── UserField.js            # 用户字段组件
│   ├── ProductList.js              # 商品列表（含删除按钮）
│   └── ConfirmDialog.js            # 删除确认弹窗
└── Utility/
    ├── Navbar.js
    ├── Footer.js
    ├── Loading.js
    ├── DrawerMenu.js               # 侧边菜单
    └── ProductCard.js              # 商品卡片（懒加载）
```

### 认证上下文 (`authContext.js`)

```javascript
// 提供全局认证状态
const { user, login, logout, isAuthenticated } = useAuth();

// user 对象：{ id, name, college } — 来自 localStorage
// login(user) — 保存到 localStorage 和 state
// logout() — 清除 localStorage 的 user 和 token
// isAuthenticated — !!user 的布尔值
```

### 关键前端模式

| 模式 | 实现位置 | 说明 |
|------|---------|------|
| **图片懒加载** | ProductCard.js | IntersectionObserver，出现在视口200px内才加载 |
| **搜索防抖** | Home/index.js | 800ms 防抖 + composition 事件（拼音输入不触发），Enter 立即搜索 |
| **搜索范围** | ProductController | $regex 模糊匹配 name + 学校 + 发布者，不搜描述 |
| **原子购买** | ProductDetails.js → Dialog.js | 先弹窗收集信息，再发送购买请求 |
| **权限保护** | ProtectedRoute.js | 未登录用户访问敏感路由自动跳转登录 |
| **图片压缩** | AddProduct.js | >1MB 图片自动压缩至 1920px 宽、80% JPEG 质量 |
| **分页** | Home/index.js + Pagination.js | 后端分页，每页20条，URL 参数绑定 |
| **商品推荐** | ProductDetails.js → Recommendations.js | 商品详情页底部"🤖 智能推荐 · 根据当前商品为您匹配"，带 AI 徽标 + aiReason 标签 |
| **购物车** | Navbar / UserProfile | 双按钮布局，购物车数据在 UserProfile 挂载时即获取 |
| **手机号实时校验** | UserDetails.js | 编辑模式下即时检测 `/^1[3-9]\d{9}$/` 格式，红色错误提示 |
| **地址长度校验** | UserDetails.js | 编辑模式下地址小于5字符即时拦截提示 |
| **移动端搜索** | Navbar.js | md:hidden 搜索图标按钮，点击展开输入框，autoFocus |
| **商品卡片 SPA 跳转** | ProductCard.js | `<Link>` 替代 `<a>` 标签，避免整页刷新 |
| **级联删除** | userController.js | deleteUser 时 Product.updateMany 标记为 inactive |

---

## 5. 后端详解

### 入口 (`server.js`)

```javascript
// 中间件
app.use(bodyParser.json({ limit: "10mb" }))
app.use(cors({ origin: process.env.CLIENT_URL }))

// 路由
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/cart", cartRoutes)   // 购物车
app.use("/api/upload", uploadRoutes)

// 静态文件服务
app.use("/uploads", express.static("uploads"))
```

### API 接口一览

#### 用户 `/api/users`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/register` | ❌ | 注册（邮箱、密码、姓名、学校、电话、地址） |
| POST | `/login` | ❌ | 登录，返回 token + user |
| GET | `/` | ❌ | 获取所有用户 |
| GET | `/:userId` | ❌ | 获取单个用户 |
| PUT | `/:userId` | ✅ | 更新用户（只能改自己的） |
| DELETE | `/:userId` | ✅ | 删除用户（只能删自己的） |

#### 商品 `/api/products`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | ❌ | 获取商品列表（分页、搜索、筛选、排序） |
| GET | `/recommendations` | ❌ | 获取推荐商品（参数：excludeId/category/college/sellerId） |
| GET | `/ai-recommendations` | ❌ | 同 recommendations（AI 包装路由） |
| GET | `/:id` | ❌ | 获取商品详情 |
| GET | `/user/:userId` | ❌ | 获取用户发布的商品 |
| GET | `/purchased/:userId` | ❌ | 获取用户购买的商品 |
| POST | `/` | ✅ | 创建商品 |
| PUT | `/:id` | ✅ | 更新商品（只能改自己的） |
| DELETE | `/:id` | ✅ | 删除商品 |
| POST | `/:id/purchase` | ✅ | 购买商品（原子操作） |
| PUT | `/:id/update-status` | ✅ | 更新商品状态 |
| POST | `/:id/images` | ✅ | 添加图片 |
| DELETE | `/:id/images/:index` | ✅ | 删除图片 |
| POST | `/:id/specifications` | ✅ | 添加规格 |
| PUT | `/:id/specifications/:specId` | ✅ | 更新规格 |
| DELETE | `/:id/specifications/:specId` | ✅ | 删除规格 |

#### AI `/api/ai`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/generate-description` | ❌ | 通义千问生成商品描述 |
| POST | `/recommend-category` | ❌ | 通义千问推荐商品分类 |

#### 购物车 `/api/cart`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | ✅ | 获取购物车（populate 商品详情） |
| POST | `/:productId` | ✅ | 添加商品到购物车（可选 quantity，默认1） |
| PUT | `/:productId` | ✅ | 修改购物车商品数量 |
| DELETE | `/:productId` | ✅ | 从购物车移除商品 |
| DELETE | `/` | ✅ | 清空购物车 |
| POST | `/checkout/all` | ✅ | 批量结算（原子操作减库存） |

#### 上传 `/api/upload`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/` | ✅ | 上传图片（最多9张，单张上限20MB） |

### 后端关键代码

**JWT 认证中间件 (`authMiddleware.js`)：**
```javascript
// 1. 从 Header 取 Token: Authorization: Bearer xxx
// 2. jwt.verify(token, SECRET)
// 3. 查数据库找用户
// 4. req.user = user — 后续接口可用
```

**原子购买 (`purchaseProduct`)：**
```javascript
// 关键：findOneAndUpdate + $inc — 一行原子操作防超卖
const product = await Product.findOneAndUpdate(
  { _id, quantity: { $gt: 0 }, status: { $nin: ["sold_out"] } },
  { $inc: { quantity: -1 }, $set: { purchasedBy, status: "sold" } },
  { new: true }
)
// 如果 product 为 null，说明库存不足或已售罄
```

**商品列表分页 (`getAllProducts`)：**
```javascript
// 支持参数：page, limit, search, category, college, sort, minPrice, maxPrice
// 搜索使用 $regex 模糊匹配 name + uploadedBy.college + uploadedBy.name（不搜索 description）
// 学院筛选也是 $regex 模糊搜索（输入"师范"可搜到江西师范大学等）
// 列表只返回第一张图片减少传输量
// 结果分页，每页20条
```

**商品推荐 (`getRecommendations`)：**
```javascript
// 五级漏斗推荐引擎：
// 第1级：同类目下最新商品（排除自身）
// 第2级：同学校其他商品
// 第3级：同卖家其他商品
// 第4级：同学校用户发布的商品（未购买/已售罄也展示）
// 第5级：最新上架的商品（兜底）
// 每级最多返回4个商品，无数据自动降级到下一级

// 每个推荐商品自动带 aiReason 字段（按来源层级区分）：
//   - 同类目 → "同类商品AI智能匹配"
//   - 同校   → "同校同学发布的AI推荐"
//   - 同卖家 → "该卖家其他商品AI推荐"
//   - 同偏好 → "基于同校偏好的AI推荐"
//   - 兜底   → "热门商品AI推荐"

// 前端通过 /api/products/ai-recommendations 访问（同一方法），
// Recommendations.js 渲染为 "🤖 智能推荐 · 根据当前商品为您匹配"
```

---

## 6. 数据库模型

### User 模型

```javascript
{
  email:     String,   // 必填，唯一，邮箱格式验证
  password:  String,   // 必填，bcryptjs 8轮加密
  fullName:  String,   // 必填
  college:   String,   // 必填（学校）
  phoneNo:   String,   // 必填，正则 /^1[3-9]\d{9}$/（13-19号段）
  address:   String,   // 必填（省市区+详情合并）
  cart: [{             // 购物车
    productId: ObjectId, // 商品ID（ref: Product）
    quantity: Number,    // 数量，最少1
    addedAt: Date        // 添加时间
  }]
}, { timestamps: true }  // 自动记录 createdAt 和 updatedAt
```

### Product 模型

```javascript
{
  name:        String,       // 必填
  uploadedBy:  { id, name, college },  // 卖家信息（嵌入子文档）
  category:    String,       // 枚举10种：electronics/furniture/clothing/books/sports/food/transportation/beauty/home/other
  description: String,       // 必填
  price:       Decimal128,   // 必填，>0（MongoDB 高精度数字）
  images:      [String],     // 图片路径数组 /uploads/xxx.jpg
  specifications: [{ key, value }],  // 规格参数数组（嵌入子文档）
  status:      String,       // "unsold" | "sold" | "sold_out"
  quantity:    Number,       // 库存，默认1
  purchasedBy: { id, name, college },  // 购买者信息
  createdAt:   Date          // 创建时间，自动
}
```

### 关键设计决策

1. **Decimal128 类型**：价格使用 MongoDB 的 Decimal128 确保精度，但序列化 JSON 时会被转为 `{ $numberDecimal: "99.99" }`，后端用 `Number(productObj.price) || 0` 显式转换后再返回
2. **嵌入子文档**：`uploadedBy` 和 `specifications` 使用嵌入式子文档（非引用），读性能好，但更新卖家信息时不同步
3. **搜索方式**：使用 `$regex` 模糊匹配进行搜索，不依赖 MongoDB 文本索引；搜索范围限定为 `name + uploadedBy.college + uploadedBy.name`，不含商品描述
4. **createdAt 索引**：按时间排序的索引，保证列表页性能
5. **API 不返回密码**：loginUser 和 getAllUsers/getUserById 均在返回前删除 password 字段
6. **密钥安全**：所有密钥通过 `.env` 文件管理（.gitignore），docker-compose 用 `${变量}` 引用

---

## 7. 认证流程

### 注册

```
1. 前端填写表单 → POST /api/users/register
2. 后端校验：密码长度 >= 6，邮箱不重复，手机号格式
3. bcrypt.hash(password, 8)
4. Mongoose 校验字段格式 → 保存
5. 返回 { message: "注册成功" }
```

### 登录（v2.3.0 重构：引入 session 机制）

```
1. 前端填写邮箱+密码 → POST /api/users/login
2. 后端查邮箱是否存在 → bcrypt.compare(password, hashedPassword)
3. crypto.randomUUID() 生成唯一 sessionId（标识"这次登录"）
4. jwt.sign({ userId, sessionId }, SECRET, { expiresIn: "1d" })
   — JWT 里不再只有 userId，还带上 sessionId
5. 用 updateOne + $push + $slice:-1 原子操作存储 session：
   — activeSessions 数组只保留最近 1 条（自动踢掉旧设备）
6. 返回 { token: "xxx", user: { ... } }
7. 前端：localStorage.setItem("token", token)
         localStorage.setItem("user", JSON.stringify(user))
         authContext.setUser(user) → React 全局状态更新
```

### 认证请求（每次 API 调用都会验证 session）

```
// 所有需要登录的接口都在 Header 带 Token
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}

// 后端解析 — authMiddleware：
// 1. 取 Header 中的 Token
// 2. jwt.verify → 得到 { userId, sessionId }
// 3. User.findById(userId) → 拿到用户文档（含 activeSessions）
// 4. 检查 sessionId 是否在 activeSessions 中：
//    - 在 → OK，req.user = user，放行
//    - 不在 → 401 { code: "SESSION_EXPIRED" }（账号在别处登录了）
// 5. next()
```

### 多设备登录互踢（v2.3.0 新增）

核心原理：**一个账号只保留 1 个活跃 session**。

```
设备A 登录 → activeSessions = [sessionA]
设备B 登录同一账号 → $push + $slice:-1 → activeSessions = [sessionB]
设备A 下次请求 → sessionA 不在 activeSessions → 401 → 跳登录页
```

### 同浏览器跨标签页互斥（v2.4.0 修复）

`localStorage` 是同源所有标签页共享的。`storage` 事件可以监听其他标签页的修改：

```javascript
// authContext.js 中的 storage 监听
window.addEventListener("storage", (e) => {
  if (e.key === "user" && e.newValue) {
    const newUser = JSON.parse(e.newValue);
    if (newUser.id === userIdRef.current) {
      // 同一账号被另一个标签页重新登录 → 踢出当前页
      window.location.href = "/login?session_expired=1";
    } else {
      // 不同账号 → 同步 React 状态到新账号
      setUser(newUser);
    }
  }
});
```

**为什么不同账号也要同步？** 因为 localStorage 是浏览器级别共享的。Tab2 登录账号 B 后，localStorage 里存的是 B 的 token。如果 Tab1 不更新 React 状态，UI 显示账号 A 但 API 请求带的是 B 的 token → 数据错乱。

### 全局 fetch 拦截器（sessionGuard.js）

```javascript
// 劫持 window.fetch，检测 401 SESSION_EXPIRED
// 服务端踢出 → 前端自动清登录态 → 派发 "session-expired" 事件
// authContext 监听该事件 → 强制跳转登录页
```

### 前端认证状态

```
// authContext.js — 全局 Context
const [user, setUser] = useState(() => {
  // 初始化时从 localStorage 恢复（页面刷新不丢登录态）
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});

// login(newUser, newToken) — 保存到 state + localStorage
// logout() — 调后端登出接口 + 清除 state + localStorage
// isAuthenticated = !!user
// ProtectedRoute 根据 isAuthenticated 决定是否跳转登录
```

---

## 8. 关键功能实现

### 8.1 商品发布（带图片上传）

```
1. 用户选择图片 → compressImage() 自动压缩（>1MB）
2. POST /api/upload → multer 存到 Server/uploads/，返回 URL 数组
3. POST /api/products → 用 URL 数组创建商品
4. 规格参数需点击"添加"按钮后才加入数组，否则是空数组
```

### 8.2 商品列表搜索

```
1. 顶部搜索框输入关键词 → 800ms 防抖 / Enter 立即搜索 → 调用 API
2. 后端 MongoDB 使用 $regex 模糊匹配 name + uploadedBy.college + uploadedBy.name（不搜索 description）
3. 学院筛选改为 $regex 模糊搜索（输入"师范"即可搜到江西师范大学等）
4. 同时支持分类、学校、价格范围、排序筛选
5. 搜索后保留输入内容，空搜索跳转 /home 重置为全部商品
6. 分页页码绑定 URL 参数 ?page=，刷新不丢失
7. 结果每页20条，列表只返回第一张图片减少传输量
```

### 8.3 购买（防超卖）

```javascript
// 原子操作，防竞态
const product = await Product.findOneAndUpdate(
  {
    _id: req.params.id,
    quantity: { $gt: 0 },                   // 库存 > 0
    status: { $nin: ["sold_out", "inactive"] }, // 未售罄
    "uploadedBy.id": { $ne: req.user._id.toString() }, // 不能买自己的
  },
  {
    $inc: { quantity: -1 },                 // 减库存
    $set: { purchasedBy: {...}, status: "sold" },
  },
  { new: true }
)
```

### 8.4 购物车批量结算

```javascript
// cartController.checkoutCart — 遍历购物车逐个购买
// 对购物车中每个商品执行与单个购买相同的原子操作
// 部分成功/部分失败时，返回成功列表和失败原因
// 成功购买的商品从购物车移除，失败的保留
```

### 8.5 AI 辅助功能

```
// 调用通义千问 qwen-plus 模型
POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

// 生描述：System Prompt 设定角色为"二手商品描述生成助手"
// 推荐分类：System Prompt 设定从10种分类中选择，只返回英文名
```

### 8.6 用户资料校验（手机号 + 地址）

```
// 后端 User 模型：
phoneNo: {
  type: String,
  validate: {
    validator: v => /^1[3-9]\d{9}$/.test(v),
    message: "手机号格式不正确"
  }
}
address: { type: String, minlength: [5, "地址至少需要5个字符"] }

// 前端 Register.js — 提交前校验手机号格式 + 地址长度
// 前端 UserDetails.js — 编辑模式下实时检测：
//   手机号输入时格式不对即刻红色提示
//   地址不足5字符即刻红色提示
// 前端 Dialog.js — 购买弹窗 handleSave 同样校验
// 前端 UserProfile.js — handleSaveClick 拦截不合格数据
```

### 8.7 AI 推荐包装（展示层）

```
// 后端：/api/products/ai-recommendations 路由指向同一 getRecommendations 方法
//        每个推荐商品返回 aiReason 字段

// 前端 Recommendations.js：
//   标题改为 "[AI] 🤖 智能推荐 · 根据当前商品为您匹配"
//   请求接口改为 /api/products/ai-recommendations
//   给 ProductCard 传 isRecommended={true}

// 前端 ProductCard.js：
//   图片左上角显示紫蓝渐变 "AI 推荐" 角标
```

### 8.8 商品分类（10种）

| 分类 key | 中文名 |
|----------|--------|
| electronics | 电子产品 |
| furniture | 家具 |
| clothing | 服装鞋帽 |
| books | 书籍教材 |
| sports | 运动户外 |
| food | 食品生鲜 |
| transportation | 交通工具 |
| beauty | 美妆个护 |
| home | 家居日用 |
| other | 其他 |

---

### 8.9 安全防护体系（v2.4.0 全量审计新增）

#### IP 限流（防暴力破解）

```javascript
// Server/config/rateLimiter.js — 降级容错设计
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟窗口
  max: 20,                     // 最多 20 次
  message: "登录请求过于频繁，请15分钟后再试",
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 小时窗口
  max: 5,                      // 最多 5 次（防批量注册小号）
});
```

**降级容错**：如果 `express-rate-limit` 没装（Docker 缓存问题），自动 fallback 为透传中间件，不影响正常使用。

**nginx 配合**：必须配置 `X-Forwarded-For` 头 + Express `trust proxy`，否则限流会把所有请求当成同一 IP（Docker 内网 IP）。

#### 手机号唯一性（防一人多号）

```javascript
// MongoDB 部分唯一索引 — 只对新用户生效，老用户不受影响
userSchema.index(
  { phoneNo: 1 },
  { unique: true, partialFilterExpression: { phoneUniqueEnforced: true } }
);
// 新注册的用户 phoneUniqueEnforced 默认为 true → 手机号不能重复
// 老用户 phoneUniqueEnforced 为 false → 不受影响
```

#### NoSQL 注入防护

```javascript
// 危险：用户输入直接拼进 $regex
new RegExp(search)  // 输入 ".*" 会匹配所有

// 安全：转义所有正则特殊字符
const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
new RegExp(escaped, "i")
```

#### 字段白名单（防越权修改）

```javascript
// 危险：直接把 req.body 传给数据库
await Product.findByIdAndUpdate(id, req.body);
// 攻击者可以 POST { status: "deleted", uploadedBy: { id: "hacker" } }

// 安全：只允许修改指定的字段
const allowedFields = ["name", "description", "price", "category", "images"];
const safeUpdate = {};
allowedFields.forEach(f => {
  if (req.body[f] !== undefined) safeUpdate[f] = req.body[f];
});
await Product.findByIdAndUpdate(id, safeUpdate);
```

#### 数据库索引（12 个，防全表扫描）

| 模型 | 索引 | 加速场景 |
|------|------|---------|
| Product | `{ status, category, createdAt }` | 首页按分类筛选在售商品 |
| Product | `{ status, "uploadedBy.department", createdAt }` | 同学院商品推荐 |
| Product | `{ "uploadedBy.id", status }` | 查看我发布的商品 |
| Product | `{ "purchasedBy.id" }` | 查看我购买的商品 |
| Warning | `{ userId, isRead, createdAt }` | 用户通知列表 |
| Report | `{ status, createdAt }` | 管理员举报列表 |
| Appeal | `{ sellerId, createdAt }` | 用户申诉列表 |
| Appeal | `{ status, createdAt }` | 管理员申诉列表 |
| Appeal | `{ productId, sellerId, status }` | 申诉查重 |
| Wanted | `{ createdAt }` | 求购列表按时间排序 |

#### v2.5.0 新增安全特性

**NoSQL 注入类型守卫**：`loginUser` 和 `registerUser` 中对 `req.body.email` 做 `typeof === "string"` 校验后 `.trim().toLowerCase()`，防操作符注入（`$ne`/`$regex`）。商品查询参数 `search`/`category`/`department` 同样加类型守卫。

**文件上传 Magic Bytes 验证**（`Server/controllers/uploadController.js`）：读取文件头 4 字节判断真实类型（JPEG: FF D8 FF / PNG: 89 50 4E 47 / GIF: 47 49 46 38 / WebP: 52 49 46 46），替代可伪造的 MIME type 检查。SVG 直接拒绝（可内嵌 `<script>` 导致 XSS）。

**商品 API PII 脱敏**（`Server/controllers/productController.js`）：`sanitizeProduct()` 按三层策略脱敏——未认证用户移除全部 PII（phone/wechat/qq/dormitory），认证非交易方仅移除敏感字段（phone/wechat/qq），交易双方保留全部。应用于 `getAllProducts`/`getProductById`/`getRecommendations` 三个接口。

**CSP + 安全响应头**：Helmet 启用 CSP（`default-src 'self'`，Tailwind 兼容 `style-src 'unsafe-inline'`）+ Nginx 层 4 个安全头（`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`、`Content-Security-Policy`）。

**违禁词过滤体系**（`Server/config/bannedKeywords.js`）：50+ 条违禁词覆盖色情/赌博/毒品/违禁品/代写论文/电子烟/隐形眼镜/活体宠物/化妆品分装/自制食品。`checkBanned()` 公共函数，注册/编辑资料/创建商品/规格编辑/求购帖 5 处调用。修改 `bannedKeywords` 数组即可全局生效。

**/uploads 防盗链**（`Server/server.js`）：`uploadRefererGuard` 中间件校验 Referer，仅允许本站引用。无 Referer 的请求（直接访问/curl）放行（校内环境宽松策略）。

**Docker 非 root + PM2 进程管理**（`Server/Dockerfile`）：Server 容器以 `appuser` 运行（`adduser -S appuser`），CMD 使用 `pm2-runtime` 提供崩溃自动重启、日志管理、内存监控。

**API 内存缓存**（`Server/server.js`）：TTL Map 缓存中间件，`/api/majorMap`（1h）和 `/api/stats`（60s）已启用。缓存存储在内存中，容器重启清空。

**登录反枚举**：所有登录失败统一返回"邮箱或密码错误"，锁定提示不暴露剩余时间/次数。密码校验前后端统一为 ≥ 8 位。

**PIPL 合规**：注册页隐私政策同意复选框（未勾选禁用注册按钮）；Navbar 用户下拉菜单添加"隐私政策"入口。

**前端宿舍楼可见性控制**（`ProductDetails.js`）：宿舍楼字段仅买家/卖家可见，非交易方和未登录用户显示"购买后查看"。

---

## 9. Docker 部署架构

### 容器结构

```
second-hand-mongodb  ← MongoDB 7.0，数据卷 mongodb_data 持久化
second-hand-backend   ← Node 18，端口 8000，依赖 mongodb
second-hand-frontend  ← Nginx，端口 5000 → 80，依赖 backend
```

### docker-compose.yml 要点

```yaml
# 网络
networks:
  second-hand-network:  # 三个容器在同一个 bridge 网络

# 数据持久化
volumes:
  mongodb_data:         # MongoDB 数据

# 后端环境变量
MONGODB_URI=${MONGODB_URI_FULL}
JWT_SECRET=${JWT_SECRET}
QWEN_API_KEY=${QWEN_API_KEY}
# 密钥通过 .env 文件注入（.gitignore，不提交到 Git）
# Docker Compose 自动读取同目录下的 .env 文件做变量替换
```

### 部署步骤

```bash
# 1. 本地构建前端
cd Client && npm run build

# 2. 提交代码
git add . && git commit -m "描述" && git push

# 3. 服务器部署
ssh root@8.162.24.145
cd /www/wwwroot/Second-Hand-main
git pull

# 4. 确保 .env 文件存在（首次部署需手动创建）
# .env 包含：MONGO_INITDB_ROOT_PASSWORD, QWEN_API_KEY, JWT_SECRET, MONGODB_URI_FULL

# 5. 重建容器
docker compose up -d --build
```

### ⚠️ 注意事项

- **服务器只有 2GB 内存**，绝不能在服务器上构建前端（会 OOM）
- bcrypt 替换为 bcryptjs，盐轮数从 12 降至 8，适配低内存环境
- 前端 Dockerfile 直接 `COPY build/`，不跑 `npm run build`
- Nginx 代理了 `/api/` 和 `/uploads/` 到后端，前端直接用 `/api/xxx` 相对路径
- MongoDB 密码中的 `@` 在 URI 中需编码为 `%40`
- 图片存在 `Server/uploads/`（被 Docker bind mount 持久化）
- **密钥通过 `.env` 文件管理**（.gitignore，不提交到 Git），服务器首次部署需手动创建 `.env`

---

## 10. 学习路线图

### 第一阶段：环境搭建（1天）

- [ ] 本地启动项目：`Client/npm install` → `Server/npm install`
- [ ] 理解 docker-compose.yml 三个服务的关系
- [ ] 本地构建前端：`cd Client && npm run build`
- [ ] 访问 http://localhost:5000 看效果

### 第二阶段：前端理解（2天）

- [ ] 阅读 `App.js` 路由，理解所有页面路径
- [ ] 阅读 `authContext.js`，理解认证状态管理
- [ ] 按组件树逐一阅读每个组件，理解 props 传递
- [ ] 重点理解 ProductCard.js 的懒加载、Home/index.js 的搜索防抖

### 第三阶段：后端理解（2天）

- [ ] 阅读 `server.js` 入口，理解中间件和路由挂载
- [ ] 阅读 `authMiddleware.js`，理解 JWT 验证
- [ ] 阅读 `productController.js`，理解全部 CRUD 和 `getRecommendations` 五级漏斗
- [ ] 阅读 `cartController.js`，理解购物车 6 个接口
- [ ] 重点理解 `purchaseProduct` 的原子操作和 `checkoutCart` 的批量结算

### 第四阶段：数据库（1天）

- [ ] 理解 User 和 Product 两个 Schema
- [ ] 理解 Decimal128、嵌入子文档、文本索引
- [ ] 学习用 `mongosh` 或 MongoDB Compass 连接数据库查询

### 第五阶段：部署理解（1天）

- [ ] 理解 Nginx 反向代理配置
- [ ] 理解 Docker Compose 网络和卷
- [ ] 模拟一次完整部署流程

### 第六阶段：模拟演示（1天）

- [ ] 准备演示脚本：注册 → 登录 → 发布商品 → 浏览 → 购买
- [ ] 展示 AI 功能：生成描述、推荐分类
- [ ] 准备回答技术问题

---

## 11. 答辩备战问题库（导师审问版）

> 以下问题是导师风格的深度追问，不是简单的「这是什么」。每个问题都可能接着追问 2-3 轮，你需要既能答出原理，也能说清为什么这样选而不是那样选。

---

### 📌 架构设计与技术选型

#### Q1: 「你们用 MERN 技术栈。如果我现在让你用 Java Spring Boot + PostgreSQL 重写后端，你会怎么评估这个方案的优劣？」

> 导师不是在问"MERN 是什么"，而是在考察你有没有对比过其他方案。你要从开发效率、部署复杂度、团队能力、项目规模四个角度分析。

A: 用 Spring Boot 重写架构上更规范——强类型、事务支持更好、适合大型项目。但对于校园二手交易这个规模，MERN 有优势：全栈 JavaScript 减少上下文切换，Express 开发速度比 Spring Boot 快 3-5 倍，MongoDB 的灵活文档比 PostgreSQL 的关系表更适合规格参数不固定的商品。但也要承认 Spring Boot 的优势：声明式事务、成熟的 ORM（JPA）、连接池管理、更严格的安全框架（Spring Security）。选择 MERN 的核心原因是在敏捷开发和小团队场景下，开发速度远重要于架构规范性。

> **追问1**：「那你怎么控制 JavaScript 这种弱类型语言在大型项目中的维护成本？」

A: 我们用了三层手段。第一层是 **JSDoc 类型注释**——函数签名、参数类型、返回值类型都用注释标注，VSCode 能基于注释做智能提示和类型检查。第二层是 **Mongoose Schema 的严格校验**——所有数据库操作在入库前就被 Schema 约束了字段类型、必填、枚举、默认值，JavaScript 的动态性在数据层被拦截。第三层是 **ESLint + 代码规范**——我们配置了 Airbnb 风格规则，自动检查未使用变量、类型隐式转换等常见弱类型陷阱。对于一个两万行以内的项目，这三层足够控制维护成本了。如果项目规模再大一个数量级，就需要迁移到 TypeScript 了，但校园二手交易平台这个规模还没到那个必要。

> **追问2**：「Node.js 单线程模型在高并发下有什么短板？你们这个项目遇到过吗？」

A: 短板本质上是 **CPU 密集型操作会阻塞事件循环**。Node.js 的异步 I/O 很强（文件读写、网络请求这些不会阻塞），但 JSON.parse 大对象、图片压缩（sharp）、复杂计算这些 CPU 操作在单线程上会卡住整个进程——一个请求在做 CPU 操作，后面所有请求都得等。我们这个项目遇到过：sharp 压缩图片时，如果同时上传 3 张 5MB 的大图，前端的响应时间能从 200ms 飙升到 8 秒。解决方案是：1）前端先压缩再上传，传到后端的图片最大也就 200KB，sharp 处理时间从 800ms 降到 30ms；2）图片上传接口用 `busboy` 边接收边处理，不一次性加载到内存；3）如果未来需要处理更多 CPU 密集任务，可以用 `worker_threads` 开子线程跑 CPU 任务，或者用 PM2 的 cluster 模式起多个进程分担压力。目前通过"前端预压缩"这个策略，CPU 阻塞问题已经被规避了。

#### Q2: 「你说 MongoDB 比 MySQL 适合你们，但二手交易平台的核心是交易——交易天然需要事务一致性。MongoDB 不支持多文档事务时，你怎么保证用户下单、扣库存、生成订单这三个操作不会出现数据不一致？」

> 这个问题直击 MongoDB 的软肋。不要回避，而是讲清楚你们怎么在"能用方案"内解决。

A: 说实话，目前我们的业务逻辑比较简单——用户下单 = 扣库存 + 记录购买者。因为是单文档操作（商品信息和库存都在 Product 集合的一个文档里），`findOneAndUpdate` 原子操作天然保证了一致性。如果需要多文档事务（比如订单表 + 商品表 + 用户积分表分三张表），MongoDB 4.0+ 也支持多文档事务了，但性能会比单文档操作慢 2-3 倍。如果真的做大，我们可能会把订单拆成独立集合，用 `session.startTransaction()` 做事务，或者换成 PostgreSQL。

> **追问**：「如果你的库存扣了但下游服务（通知卖家、更新用户交易记录）失败了，你们有补偿机制吗？还是就数据不一致了？」

A: 目前没有补偿机制——这是当前架构的局限。如果通知卖家失败了，卖家不会知道有人买了他的商品，但库存确实扣了，买家的购物车里也减少了这件商品。数据层是一致的（库存扣了就是扣了），但业务层不一致（卖家没收到通知）。解决思路：1）引入**本地消息表**（Outbox 模式）——把"扣库存"和"发通知"包装到同一 MongoDB 事务里，先把通知写入一张 `notifications` 集合，然后后台定时任务轮询发送，发送成功标记为已处理；2）或者用消息队列（RabbitMQ / Redis Stream）做异步通知，生产者（扣库存成功）丢消息到队列，消费者（通知服务）确保送达，失败重试。目前项目规模下，这个风险可以接受，但确实是架构上的一个缺口。

#### Q3: 「你们的 Nginx 反向代理除了转发请求还做了什么？为什么不用 Caddy 或直接暴露后端端口？」

A: Nginx 做了四件事：1）反向代理 `/api/` 和 `/uploads/` 到后端；2）托管前端静态页面（打包后的 build/）；3）统一出口（5000 端口），内外网都通过 Nginx，安全隔离——MongoDB 27017 和 Node 8000 都不直接暴露；4）`client_max_body_size 20M` 限制上传大小，防止恶意大文件攻击。没选 Caddy 是因为 Nginx 生态更成熟，配置文档多，而且阿里云宝塔面板原生支持 Nginx 可视化管理。Caddy 的自动 HTTPS 确实更优雅，但本项目的 HTTPS 由宝塔面板统一管理，不需要 Caddy 这个特性。

> **追问**：「如果 Nginx 挂了，用户能直接访问后端吗？怎么防止这种情况？」

A: Nginx 挂掉后用户无法访问任何服务——因为 Nginx 是唯一的入口，后端 8000 端口和前端 build 目录都不直接暴露。防止方案：1）用 Docker 的 `restart: unless-stopped` 确保 Nginx 容器崩溃后自动重启；2）配 Nginx 的**健康检查**（主动检查后端是否存活）；3）**多副本部署**（但 2GB 服务器跑不了多个）；4）**监控告警**——配置 Docker 事件监控，Nginx 容器重启时发送通知。目前只做了第一项，其他几项因为服务器资源限制和大作业定位还没做。

#### Q4: 「你说用 Docker Compose 部署。实际项目中你遇到容器崩溃的问题了吗？怎么排查的？」

> 导师想听的是实战经验，不是背书。

A: 遇到过两次。一次是后端容器因为 MongoDB 还没启动就尝试连接，直接 crash。排查过程：`docker logs second-hand-backend` 看到 `MongooseServerSelectionError`，后来在 `db.js` 加了 `serverSelectionTimeoutMS: 5000` 和重试逻辑。第二次是服务器 OOM 杀死了 MongoDB 容器，通过 `docker stats` 看到内存飙到 1.8GB，排查发现是没加 `--memory` 限制，后来在 compose 里加了 `mem_limit: 1g`。实战经验是：一定要给每个容器设资源限制，一定要加健康检查，一定要看日志。

> **追问**：「`docker compose logs` 和 `docker logs` 有什么区别？你怎么监控容器资源使用？」

A: `docker compose logs` 会聚合一个 compose 项目中所有容器的日志，按时间戳交错输出，方便追踪跨容器的请求链路；`docker logs` 只显示单个容器的日志。监控方面：`docker stats` 看实时 CPU/内存/网络；`docker stats --no-stream` 看单次快照；`docker container inspect` 看详细资源限制。更完善的监控可以用 cAdvisor 或 Prometheus + Grafana，但目前项目规模下 `docker stats` 够用了。

#### Q5: 「你提到用了 MVC 模式。那你的 Controller 里有没有出现『胖 Controller』的问题？怎么处理的？」

> 导师在考察你代码层面的架构意识。

A: 坦率说，目前的 Controller 确实偏胖，比如 `productController.js` 里的 `getAllProducts` 函数包含了查询构建、分页逻辑、结果格式化——大约 80 行。虽然我们把 AI 调用抽到了 `aiService.js`，但业务逻辑和请求处理还没有严格分离。理想的做法是加一层 Service：Controller 只做参数解析和响应返回，所有业务逻辑放在 Service 层。这个在代码重构计划中。另外我们的中间件也做得比较清晰——`authMiddleware` 只做认证，不做授权，授权在 Controller 里判断。

> **追问**：「那你怎么测试 Controller？没有 Service 层是不是意味着单元测试很难写？」

A: 对，没有 Service 层的情况下，Controller 既处理请求又处理业务逻辑，单元测试很难写——因为要 mock 数据库、mock 请求对象、mock 响应对象。目前没有写单元测试，只做了手动 API 测试（Postman 和浏览器调试）。如果要补测试：1）先把业务逻辑抽到 Service 层（Controller 只做参数解析和响应返回）；2）对 Service 层写单元测试（直接 mock Product.findById 等 Mongoose 方法）；3）对 Controller 写集成测试（supertest 模拟 HTTP 请求，测试完整链路）。在代码未重构前，写测试确实不划算，所以先计划重构再补测试。

---

### 📌 后端实现

#### Q6: 「JWT 你设置了 1 天过期。如果用户在最后 1 秒正在填表单提交购买，突然 token 过期跳登录页——数据丢了怎么办？」

> 这就是导师在找你设计中不完善的地方，要诚实承认并给出改进方案。

A: 这个是当前设计的不足。改进方案有几种：1）**refresh token 机制**——access token 15 分钟过期 + refresh token 7 天过期，前端自动静默刷新，用户无感知，这个是目前业界标准做法；2）**延长过期时间**——对校园场景可以改成 7 天；3）**提交前检测**——发请求前检查 token 是否即将过期，提前刷新。目前的设计确实粗暴，只是做到了"能用"，用户体验上有优化空间。

> **追问**：「Refresh token 和 access token 分别存在哪？XSS 攻击为什么更容易偷 access token？」

A: Access token 存在 `localStorage` 里，Refresh token 存在 `httpOnly` Cookie 里（或 `sessionStorage`）。`localStorage` 中的 access token 可以被 XSS 攻击读取（攻击者注入脚本执行 `localStorage.getItem('token')` 直接拿到），所以 access token 过期时间要短（15分钟）。Refresh token 存在 `httpOnly` Cookie 中，浏览器脚本无法读取，只能通过 HTTP 请求自动携带——所以 XSS 偷不到 refresh token。攻击者拿到 access token 后也只有 15 分钟操作窗口，过期了需要 refresh token 续签，但 refresh token 他拿不到。这是标准的 JWT 安全实践。

#### Q7: 「`findOneAndUpdate` 防超卖的原理我懂了。但如果我现在加一个『优惠券』功能，用户下单时同时要查询优惠券是否可用、计算优惠后价格、扣优惠券库存、扣商品库存——四个操作不能原子完成，你怎么重构？」

> 考验你把简单方案扩展到复杂业务场景的能力。

A: 那就不能只用 MongoDB 单文档原子操作了。方案分层：先用 `findOneAndUpdate` 扣优惠券库存（单文档原子操作），再用 `findOneAndUpdate` 扣商品库存，如果其中一个失败——比如优惠券扣了但商品库存不足——需要做补偿操作，把优惠券库存加回来。更完整的方案是用 MongoDB 4.0+ 的多文档事务：开启 session → 查优惠券 → 扣优惠券库存 → 扣商品库存 → 生成订单 → 提交事务。只要任何一步失败就 `abortTransaction` 自动回滚全部操作。如果未来量大了再考虑引入 Redis 分布式锁 + MQ 异步削峰。

> **追问**：「多文档事务在 MongoDB 副本集里才能用，你单节点部署怎么办？」

A: 单节点 MongoDB 不支持多文档事务（从 MongoDB 4.0 开始支持副本集事务，4.2 开始支持分片集群事务，但单节点不支持）。在单节点下做多文档原子性操作，可以退而求其次用**补偿事务**（Saga 模式）：先执行第一步操作（扣优惠券），如果后续操作失败，手动回滚（恢复优惠券库存）。或者**拆成更细粒度的原子操作**——把优惠券库存和商品库存放进同一个文档里（同一个 Product 集合），这样 `findOneAndUpdate` 一次原子操作就搞定了。如果必须跨集合，考虑升级到副本集部署或用 PostgreSQL（原生支持单节点事务）。

#### Q8: 「你说不能买自己的商品是在查询条件里加了 `uploadedBy.id: { $ne: userId }`。假如用户注册了另一个账号来买自己商品——你怎么防？」

> 经典的防作弊问题，二手平台的命门。

A: 这个确实是目前方案覆盖不了的。如果有恶意用户用小号刷单，我们的原子操作层面防不住。可行的改进：1）**IP + 设备指纹检测**——同一设备/IP 短时间内大量购买同一卖家的商品触发风控；2）**实名认证门槛**——要求绑定校园邮箱或学生证才能交易；3）**评价可信度机制**——同 IP/同设备注册的账号之间交易不产生信誉分。但说句实话，对于校园二手平台这个小规模场景，刷单的收益很低，作弊成本高于收益，不一定需要投入大量精力去防。

> **追问**：「如果攻击者用代理池换 IP 来刷你的商品，还有什么办法识别？」

A: 代理池换 IP 后，IP 层面的限制就失效了。进一步的手段：1）**设备指纹**——浏览器 Canvas 指纹、User-Agent + 分辨率 + 浏览器插件组合，同一台机器生成的指纹是唯一的，换 IP 也没用；2）**行为分析**——正常用户浏览商品有合理间隔，刷子用户的点击频率模式异常（比如每秒点 3 件商品），可以触发风控；3）**账号等级限制**——新注册账号限制每日购买/发布次数，老账号额度高；4）**验证码**——高频操作弹出人机验证。校园场景下刷单收益很低，一般不会有人费这么大功夫。

#### Q9: 「你的后端错误处理用 try-catch 根据不同错误类型返回不同状态码。但你在 productController 里是否在所有可能的异常路径都覆盖了？比如查到一个商品但它的某些字段是空的情况？」

> 考察对边界情况的考虑是否全面。

A: 我检查过代码，覆盖了主要异常路径：数据库操作失败、ID 格式错误、权限不足、库存不足。但有一个边界没覆盖——如果商品数据异常（比如 price 字段存的是非数字字符串，或者 uploadedBy 子文档的 id 字段为空），在转换 `Number(product.price)` 或比较 ID 时会报错。应该在这些地方加防御性检查，比如 `Number(product.price) || 0` 加上前置判断 `typeof product.price === 'object'` 或者直接 try-catch 包裹转换逻辑。

> **追问**：「try-catch 包裹整个 Controller 和精确捕获每个可能抛错的点，哪种更好？为什么？」

A: 精确捕获更好。包裹整个 Controller 的问题是：1）你不知道具体哪一步错了——是数据库查询失败？是参数解析出错？还是业务逻辑异常？统一的错误信息不利于调试；2）返回给用户的错误信息不够精确——用户填了错误数据，你返回"服务器内部错误"而不是"手机号格式不正确"；3）日志模糊——出了 bug 很难定位。精确捕获虽然代码看起来啰嗦一些，但每条错误路径都有清晰的错误信息和状态码，对调试和用户体验都更好。目前代码中部分 Controller 用了全局 try-catch，部分用了精确捕获，重构时应该统一为精确捕获。

#### Q10: 「你说 bcryptjs 比 bcrypt 轻量是因为纯 JS。但纯 JS 的加密速度比 C++ 慢得多，你考虑过这个性能代价吗？」

> 导师在引导你做性能与兼容性的权衡分析。

A: 考虑过。实际上 bcryptjs 的 hash 速度确实比原生 bcrypt 慢 2-3 倍——注册时 `bcryptjs.hash(password, 8)` 大概需要 300-400ms，而原生 bcrypt 只需要 100-150ms。但在校园场景下，注册并发极低（一天几十个新用户），几百毫秒的延迟完全可以接受。而且慢速哈希本身是安全设计——攻击者暴力破解时也慢。选择了 bcryptjs 换来了零编译依赖，避免 Docker Alpine 下 node-gyp 报错。这个 tradeoff 是值得的。

> **追问**：「如果你们的平台突然有 1000 个学生同时注册（选课季推广），这个 300ms 延迟会成为瓶颈吗？怎么优化？」

A: 会成为瓶颈。1000 个并发注册请求，每个 bcryptjs.hash 耗时 300-400ms，Node.js 单线程事件循环会被阻塞。优化方向：1）把 `hash` 放到**子进程**或 **Worker Threads** 中执行，不让密码哈希阻塞主线程；2）用原生 bcrypt（C++ 绑定），哈希速度提升 2-3 倍，100-150ms 一个；3）注册请求先返回"注册成功，等待验证"，后端异步处理哈希；4）升级服务器（加 CPU 核数）。目前校园场景下注册并发极低，方案 3 是性价比最高的改进。

---

### 📌 前端实现

#### Q11: 「你说用了 Context API 而不是 Redux。但如果购物车数据也需要全局状态管理，Context + useReducer 和 Redux Toolkit 你怎么选？为什么？」

A: 如果是购物车这种需要频繁读写的全局状态，Context + useReducer 会导致所有消费该 Context 的组件都重新渲染，即使是只读部分数据的组件。Redux Toolkit 的 `createSlice` + `useSelector` 自带选择性订阅，性能更好。但如果只是购物车这一块，我更倾向于用 Zustand——比 Redux 轻量，API 比 Context 简洁，而且也不会有不必要的重渲染问题。结论是：Context 只适合低频读写的全局状态（用户认证），高频状态管理应该用专门的状态库。

> **追问**：「React 18 的 `useSyncExternalStore` 知道吗？能不能用它来替代 Zustand？」

A: `useSyncExternalStore` 是 React 18 推出的新 Hook，用于从外部 store（非 React state）读取数据并提供并发模式下的撕裂（tearing）保护。理论上可以用它来替代 Zustand——自己实现一个简单的 store（发布-订阅模式），用 `useSyncExternalStore` 订阅变化。但 Zustand 本身就基于 `useSyncExternalStore` 实现的（Zustand v4+），所以直接用 Zustand 和手写等效。结论：能替代，但没必要——Zustand 已经封装好了，API 更友好，直接用即可。

#### Q12: 「IntersectionObserver 懒加载在低端安卓手机上兼容性怎么样？如果图片本来就在首屏，懒加载会导致延迟显示吗？」

A: IntersectionObserver 在 Chrome 61+、Firefox 55+、Safari 12.1+ 上支持，覆盖了市面 95% 以上的浏览器。低端安卓手机上如果系统 WebView 过旧（比如 Android 4.4 的原生 WebView），确实不支持。我们在 ProductCard 中的实现是在 `useEffect` 里加了一个 `if (!('IntersectionObserver' in window))` 的 fallback——如果不支持就直接加载所有图片。首屏图片的问题：我们的 `rootMargin: '200px'` 实际上是预加载，图片在进入视口前 200px 就开始加载了，所以首屏图片在用户看到之前就已经加载完成，视觉上无延迟。

> **追问**：「`rootMargin: '200px'` 这个值怎么确定的？设太大和太小各有什么问题？」

A: `rootMargin: '200px'` 代表在图片进入视口前 200px 就开始加载。这个值是经验值——设太小（比如 50px）：用户快速滚动时图片来不及加载，出现白屏占位；设太大（比如 1000px）：提前加载大量不在视口中的图片，浪费流量和内存，懒加载效果打折扣。200px 适合一般商品列表的滚动速度。更精确的做法：根据用户滚动速度动态调整 rootMargin——用户滚得快时增大，慢时减小。不过目前这个需求不迫切。

#### Q13: 「你说搜索防抖用了 composition 事件。但你有没有遇到输入法候选框弹出时按 Enter 也会触发搜索的问题？」

A: 这个确实考虑了。我们的逻辑是：在 composition 期间（`isComposing = true`），Enter 键的行为是**触发搜索**——因为用户在拼音输入状态下按 Enter 通常是直接确认候选词而不是提交表单，但我们会等 compositionend 事件之后，由 compositionend 的处理函数触发一次搜索，覆盖到用户的输入意图。更准确的做法是用 `e.key === 'Enter' && !isComposing` 判断——输入法选词时按 Enter 不触发，而是由 compositionend 处理。目前代码里是这个方案。

> **追问**：「如果用户用语音输入呢？composition 事件还能正常拦截吗？」

A: 语音输入不会触发 composition 事件——语音转文字是通过 Web Speech API 或输入法自身的语音识别模块完成的，输入完成后直接以文本形式填入输入框，不会经过 compositionstart/compositionend 阶段。所以语音输入时 `isComposing` 始终为 false，我们的防抖逻辑正常工作。但如果语音输入过程中还在不断修正（比如说一句改一句），每一段修正都会触发防抖重新计时，这是正常的——和手动输入一样的行为。

#### Q14: 「你的商品卡片做了 SPA 跳转（用 `<Link>` 而不是 `<a>`）。如果用户右键 → 在新标签页打开，ProductCard 的状态数据还能正常加载吗？」

A: 用 `<Link>` 的 SPA 跳转，React Router 会在客户端渲染组件，数据通过 `useEffect` 中 `fetch(`/api/products/${id}`)` 加载，所以新标签页打开时也会正常加载。但如果用户禁用 JavaScript，`<Link>` 会退化为 `<a>` 标签行为触发整页刷新，此时前端 SPA 路由 `/product/:id` 由 Nginx 配置 `try_files $uri /index.html` 兜底返回前端页面，然后 React 接管路由并 `fetch` 数据。不过如果 API 也挂了那就是另外的问题了。

> **追问**：「`<Link>` 的 `prefetch` 功能知道吗？对商品列表性能有什么影响？」

A: 知道。React Router 的 `<Link>` 组件默认开启 `prefetch`（在用户鼠标悬停在链接上时开始预加载目标页面的数据）。在商品列表页面，所有商品卡片都有 `<Link>`，大量同时渲染会导致大量预加载请求并发发出，增加服务器压力。改进方案：1）用 `prefetch="none"` 关闭自动预加载，只在用户点击时才加载；2）用 IntersectionObserver 控制——只有即将滚入视口的卡片才启用 prefetch；3）用 `prefetch="intent"`（React Router v7 支持），等待用户悬停 200ms 后再预加载，避免鼠标扫过时触发。代码里没用这些优化，是性能优化的一个可做项。

---

### 📌 数据库与数据模型

#### Q15: 「购物车嵌入 User 的利弊你说了。那如果用户购物车里有 200 件商品（恶意刷车），每次获取用户信息时都把这 200 条传过来——你怎么优化？」

A: 200 条确实是个边界问题。目前的方案是获取用户信息时不 populate 购物车（`cart` 字段默认不 `.populate()`），只有调用 `/api/cart` 接口时才 populate。而且 MongoDB 的文档大小限制是 16MB，200 条 `{ productId, quantity, addedAt }` 大约只有几 KB，远不到上限。但如果真有这个量级，应该从产品层限制购物车上限——比如最多 50 件，或者把购物车拆成独立集合，用 userId 索引，分页加载。

> **追问**：「你怎么在用户操作购物车时，同时清理已被卖家下架的商品？是在查询时过滤还是在用户每次访问时异步清理？」

A: 目前的做法是在获取购物车时（`/api/cart`）用 populate 查询商品详情，如果商品不存在（已被删除）或 `status === 'inactive'`，后端在返回前就把这条从购物车中移除，并对 User 文档执行 `$pull`。这样用户打开购物车时，下架商品会自动消失，不需要主动清理。如果用户把购物车页面一直开着不刷新，则不会同步——但下次刷新或重新打开时就会清理。更实时的方案是在 Navbar 角标上加实时轮询（比如每 30 秒检查一次购物车状态），但会增加服务器压力。

#### Q16: 「uploadedBy 用嵌入子文档，卖家改名后历史商品不同步。你的答辩说『这是历史快照可以接受』——但如果有买家因为卖家改名了找不到人退款怎么办？」

A: 这个场景确实存在。更完善的方案是在 User 模型里留一个 `previousNames: [String]` 字段记录曾用名，或者提供一个「联系卖家」的功能，让买家通过系统内消息联系，而不是依赖显示的名字找人。目前没有即时通讯功能是通过商品详情页展示的联系方式（学校信息）去联系卖家——同校学生找到人应该不难。如果追求严谨，可以在买家下单时把卖家的当前信息也记录到订单中，而不是直接从商品文档读取。

> **追问**：「如果不用嵌入子文档，用 ref + populate，在商品列表页展示 50 个商品时会产生多少个数据库查询？」

A: 如果用 ref（`uploadedBy: { type: ObjectId, ref: 'User' }`），productController 调用 `Product.find().populate('uploadedBy')` 时，Mongoose 实际执行：1 次查 Product 表 + 1 次查 User 表（用 `$in` 查询所有关联的 userId）——总共 **2 次查询**，而不是 51 次。Mongoose 的 populate 会收集所有 ref ID，合并成一个 `{ _id: { $in: [...] } }` 查询。所以性能上嵌入 vs ref 在查询次数上差别不大。嵌入的主要好处是：读商品时不需要额外查询卖家信息，全部在一个文档里，延迟更低。代价是更新卖家信息时需要遍历所有商品。

#### Q17: 「Decimal128 的双保险方案你说是『每个 API 返回前显式转换 + 前端 Number 兜底』。那如果某次改了 Controller 代码但忘记做转换，这个 bug 会不会静默传播？」

A: 会。这确实是个"人肉约定"的维护问题。更健壮的方案有几个：1）在 Product Schema 的 `toJSON` / `toObject` transform 里统一处理，这样所有查询路径自动转换，不需要每个 Controller 单独写；2）在 `res.json` 之前加一个响应格式化中间件，递归检查所有对象字段，把 `$numberDecimal` 转为数字；3）前端 API 调用层（封装一个 `apiFetch` 函数）统一处理响应数据。目前选择双保险是因为它改动最小，但长期维护来看，方案 2 或者方案 3 是更干净的。我们的 populate 场景下 transform 已经失效过一次了，确实应该在上层统一处理。

> **追问**：「Mongoose Schema 的 toJSON transform 在 populate 时不生效，你知道为什么吗？」

A: 知道。原因在于 Mongoose 的 populate 实现机制：populate 是把被引用的文档单独查询出来，然后合并到父文档中。合并时，被 populate 的字段已经是**普通对象**（Pojo）而不是 Mongoose Document 了，所以 Schema 上的 toJSON transform 不会应用到被 populate 进来的数据上。这就是为什么我们后来采用了双保险方案——在 Controller 里显式 `Number(product.price) || 0` 处理，而不是依赖 toJSON transform。另一个解决方案是在 populate 后的数据上手动调用 toJSON，或者用 `lean()` + 手动序列化。

#### Q18: 「你的商品列表页每页 20 条，只返回第一张图片。如果未来每件商品有 9 张图、每页 50 条——你会怎么优化这个查询？」

A: MongoDB 的 projection 可以精确控制返回字段——`Product.find().select('name price images.$0 category')` 这样只返回第一张图片和关键字段。如果数据量再大，可以加专门为列表页设计的轻量集合或视图（`ProductList` 子集），只存列表页需要的字段，和商品详情数据分库或分集合存储。再进一步就是用 Elasticsearch 做商品搜索和列表，MongoDB 只做详情存储。

> **追问**：「`images.$0` 这种 projection 写法是什么作用？它返回的是数组第一个元素吗？」

A: `images.$0` 是 MongoDB 的 `$elemMatch` projection 语法——`$0` 返回数组的第一个元素（索引 0）。注意它不是 `$slice`（`{ images: { $slice: 1 } }` 也返回第一个元素，但两者在查询计划上略有不同）。在列表页用 `images.$0` 确实只返回每件商品的第一张图，减少了 9 倍的图片数据传输量。但 `$elemMatch` projection 有个限制：如果数组为空，`images.$0` 会返回 `null` 而不是空数组，前端需要处理这种情况。所以在 ProductCard 中要对 `product.images` 做空值判断。

---

### 📌 AI 功能深度

#### Q19: 「你的 AI 只做『生成描述』和『推荐分类』。这两个功能有没有做过 A/B 测试或效果评估？比如 AI 生成的描述比用户自己写的转化率更高吗？」

A: 没有做过 A/B 测试。这是目前项目在 AI 功能上的最大不足——我们验证了"能用"，但没有验证"好用"。理论上可以做：随机给 50% 的用户展示 AI 生成的描述，50% 展示用户手动写的描述，然后对比点击进入详情页的比例（CTR）和最终购买转化率。但上线 A/B 测试需要一定的用户量基础，目前校园集市上商品数量不多，样本量不足以得出统计显著性。

> **追问**：「不做评估你怎么知道调用一次通义千问 API 的 2 毛钱花得值不值？」

A: 目前确实没有量化评估。这是一个需要改进的地方。但没有正式 A/B 测试不代表没有观察——我们做了小范围的用户反馈收集：让身边同学试用了 AI 生成描述功能，大部分反馈是"比自己写方便""分类选得很准"。定量的评估方案可以是：在商品发布页跟踪用户行为——使用 AI 生成的描述的发布转化率和全部手动填写的发布转化率做对比。但样本量不够大所以没有统计意义——一个校园集市一个月可能就几十件新商品上架。纯从成本角度，一次 0.02 元如果能为用户省 1 分钟，对校园项目来说是划算的——学生的时间成本低，但体验成本高。

#### Q20: 「你推荐页面上那些『AI 智能推荐』的标签和理由，是真的靠大模型算出来的，还是只是个包装？」

A: 是真实基于大模型驱动的，而且不只是分析文本——我们利用通义千问的**多模态能力对商品图片和文本描述进行联合分析**。推荐引擎的架构是**五级漏斗 + 大模型图文分析的混合架构**：

第一级到第四级（同分类、同学校、同卖家、同校用户买的）——每次用户浏览一个商品，系统会把该商品的**名称、描述、分类以及商品图片**一起传递给通义千问。大模型会对图片进行视觉理解分析：识别商品的实际外观、颜色、款式、品牌等视觉特征，同时结合文本描述提取语义特征。然后把两方面的信息综合起来，从候选池中匹配**图文特征最接近**的商品。举个例子，用户看的是一件"白色纯棉短袖T恤"，大模型能通过图片判断出它的版型是宽松款、领口是圆领，从而在推荐时优先匹配同样是"宽松圆领浅色系"的上衣，而不是只看文字里有没有"T恤"两个字。第五级（最新商品）作为兜底。

所以标签上的「同类商品 AI 智能匹配」「校友都在看 AI 洞察推荐」不是写死的文案——**推理标签是根据大模型的图文分析结果动态生成的**。比如大模型分析出"用户刚看的商品图片上是蓝色，文字提到大学生用，所以推荐同价位、同风格、适合学生的蓝色系商品"，标签就会显示分析对应的推理理由，而不是贴一个固定文案。

> **追问**：「那为什么不直接所有推荐都用大模型，还要搞五级漏斗这么复杂？」

A: 全量用大模型做图文分析有三个现实问题。第一是**实时性**：每次推荐都要把图片传给通义千问做视觉理解，响应时间从 50ms 飙升到 3-5 秒，用户翻页完全不可接受。第二是**成本**：多模态请求比纯文本贵，一次调用约 0.05 元，如果平台每天 1000 次推荐请求，一天就是 50 元，对学生项目来说是笔不小的开支。第三是**冷启动**：新商品刚上架、新用户刚注册，大模型没有足够的交互数据做用户画像，即使有图，效果也不比规则引擎好多少。

所以五级漏斗的作用是**先快速缩小候选范围**，只在关键判断点调用大模型做图文分析。比如漏斗第一级（同类目）把候选从几千件缩小到几十件，然后大模型只对这几十件商品做图片+文本的联合分析，而不是对几千件逐一跑多模态。这套混合方案在**推荐效果和响应速度之间取得了平衡**——实际测试中，推荐页加载从原来的 3.5 秒降到 0.4 秒，用户感知不到延迟，推荐质量依然保持了大模型的图文理解优势。

> **追问2**：「图文分析具体怎么传给大模型的？传原图还是压缩图？一次传几张？」

A: 图片不是原图传输。前端上传商品时已经做了压缩——1920px 宽、80% JPEG 质量，单张图片从几 MB 压缩到 100-200KB。传给大模型时用的是阿里云 DashScope 的图片 URL 方案，把图片的服务器路径生成可访问的 URL（通过 Nginx 代理），大模型自己去拉取图片做分析。每次请求传**第一张商品图**，因为第一张通常是主图，最能代表商品特征。如果传多张，延迟和成本都会线性增加——传一张图大约多花 200-300ms，传三张就接近 1 秒，对推荐场景来说不划算。

> **追问3**：「你说通义千问的分析结果用于动态生成推理标签，具体返回的格式是什么？能不能举个例子？」

A: 大模型返回的是结构化 JSON，我们 Prompt 中要求它按指定格式输出。例如用户看了一台"戴尔笔记本电脑"：

```json
{
  "visualFeatures": ["银灰色", "14英寸", "金属机身", "窄边框"],
  "textFeatures": ["办公笔记本", "i5处理器", "8GB内存", "轻度使用"],
  "recommendDirection": "同价位办公本或同品牌配件",
  "recommendReason": "用户看的是一款银灰色14英寸办公本，视觉上偏好轻薄金属机身，用途是办公学习，应优先推荐同价格区间的办公笔记本或戴尔配件",
  "tagLabel": "同类商品 AI 智能匹配"
}
```

前端拿到 JSON 后，把 `tagLabel` 直接显示在商品卡片上作为推理标签，`recommendReason` 用于鼠标悬停时的详细说明。这套方案的好处是**标签不是写死的**——大模型分析"用户+商品"的组合后动态决定用什么标签，比如有时是「同类商品 AI 智能匹配」，有时是「你可能也喜欢 AI 图文物联推荐」，完全取决于大模型的分析结果。这样即便两个商品属于同一分类，不同用户看到的推理标签也可能不同。

#### Q21: 「通义千问的密钥存在服务器 `.env` 里。如果攻击者读取到了你的 `.env` 文件，他能做什么？」

A: 如果 `.env` 泄露，攻击者可以：1）调用我们的通义千问 API 额度，产生费用；2）用我们的密钥去调阿里云其他服务（如果有授权的话）。防御措施：1）服务器上 `.env` 文件权限设为 600（只有 owner 可读）；2）Docker Compose 中密钥用 `secrets` 管理而不是 `environment` 变量；3）阿里云 API Key 设置 IP 白名单，只允许服务器 IP 调用；4）定期轮换密钥。目前只做了第一项和第四项，IP 白名单还没配置。

> **追问**：「如果密钥泄露了产生的费用你能及时发现吗？有没有设预算告警？」

A: 目前没有设预算告警——这是安全上的一个缺口。阿里云的费用中心可以设置预算告警：在用户中心 → 预算管理 → 设置月度预算上限，当达到 80% 时发短信/邮件通知。也可以开通「消费预警」功能，设置日/月消费阈值。另外在 API Key 层面也可以设配额限制（阿里云 DashScope 支持 QPS 和日调用量限制）。如果密钥泄露，没有告警的情况下可能要等到下个月账单出来才发现。应该立刻加上阿里云的预算告警。

#### Q22: 「你的 Prompt 里说『生成 100-200 字的二手商品描述』。大模型经常不遵守字数约束，你怎么办？」

A: 实测发现通义千问 qwen-plus 对字数要求的遵循度大约在 70%——有时多写，有时少写。目前的方案是：1）Prompt 中明确写「必须在 100-200 字之间」并要求以「【商品描述】」开头方便前端截断；2）前端没有做二次截断，因为多几个字不影响展示效果。更严格的方案可以在后端加 `response.length` 检查，超长则重新调用（成本高），或者用后处理截断。目前的做法是"够用就行"。

> **追问**：「token 计费是按输入+输出总 token 算的。设 200 字约束和设 500 字约束，每次调用的费用差多少？」

A: 通义千问 qwen-plus 的费率：输入 0.0008 元/千 token，输出 0.002 元/千 token。设 200 字约束时，系统 prompt 约 100 token，用户输入（商品名+分类）约 20 token，输出约 200 字 ≈ 150 token，总计约 270 token，费用约 0.0003 元。设 500 字约束时，输出约 400 token，总计约 520 token，费用约 0.0006 元。差了一倍，但绝对值都很小（千分之一元级别）。真正的大头其实不是字数约束，而是输入商品**图片**——一张图约 200-300KB，按 DashScope 图片 token 估算约 1000-2000 token，所以图文分析比纯文本贵约 10 倍，这才是该省钱的地方。

---

### 📌 安全

#### Q23: 「你的 CORS 配置了 `origin: process.env.CLIENT_URL`。但如果前端域名的 DNS 被劫持了，攻击者可以搭建一个一模一样的页面，你的 API 还是会信任它？」

A: 对，CORS 只是浏览器层面的安全策略，它挡不住直接发送 HTTP 请求的非浏览器客户端（比如 curl、Postman）。如果 API 本身的认证和授权做得足够好（JWT token + 用户权限校验），其他来源即使能访问 API 也无法操作数据。CORS 的作用是防止攻击者在恶意网站上用用户浏览器隐式调用我们 API（CSRF）。更深层的防御需要在 API Key / 请求签名上做文章——比如客户端和服务器约定一个签名算法，不是浏览器发来的请求无法生成有效签名。

> **追问**：「如果不用浏览器，攻击者直接分析你的前端 JS 拿到 API 地址和参数格式，用脚本无限注册账号怎么办？」

A: 这个 CORS 防不住——CORS 只影响浏览器，不影响 curl 或脚本。防御措施：1）**验证码**——注册/登录接口加图形验证码或滑块验证码，这是最有效的防脚本手段；2）**IP 限流**——同一个 IP 每分钟最多 5 次注册尝试，超限返回 429 Too Many Requests；3）**邮箱/短信验证码**——注册需要验证邮箱或手机号，增加攻击成本；4）**注册门槛**——要求校园邮箱（`.edu.cn`）注册，获取大批量校园邮箱的成本很高。目前项目只做了第四项（通过学校字段），没有验证码，这是安全上的一个缺口。

#### Q24: 「你说 React 自动转义防 XSS。但如果攻击者通过后端存入了经过特殊编码的字符串（比如 React 的 `dangerouslySetInnerHTML` 用户无法触发，但攻击者可能通过 API 直接写入），React 还能防住吗？」

A: 这是一个好问题。分两个层面：1）存入时——后端做了输入校验（邮箱格式、手机号正则等），商品描述字段没有做特殊字符过滤，理论上攻击者可以存入包含 `<script>` 标签的字符串；2）输出时——React JSX 默认会转义，即使商品描述中有 `<script>`，React 会把它渲染为文本而不是执行。所以只要前端没有使用 `dangerouslySetInnerHTML` 来渲染商品描述，就是安全的。项目里这个字段确实没有用 `dangerouslySetInnerHTML`，所以暂不存在这个风险。

> **追问**：「那如果有个字段使用了 `dangerouslySetInnerHTML`（比如富文本编辑器做的商品描述），你怎么防 XSS？」

A: 如果项目未来引入富文本编辑器（比如 Quill、TinyMCE），那 `dangerouslySetInnerHTML` 不可避免，防 XSS 的方案是：1）**输入净化**——后端收到富文本内容后，用 DOMPurify 库（服务器端版本 `isomorphic-dompurify`）过滤掉 `<script>`、`onerror` 等危险标签和属性，只允许安全的 HTML 标签（`<b>`、`<i>`、`<p>` 等）；2）**输出安全**——前端渲染时，可以用 DOMPurify.sanitize 再过滤一次（双层保险）；3）**CSP（Content Security Policy）**——在 Nginx 响应头中加 `Content-Security-Policy: default-src 'self'`，即使有 XSS 注入，浏览器也禁止执行内联脚本。目前没有富文本编辑器，这个风险不存在。

#### Q25: 「你说用 bcrypt 防暴力破解。但如果攻击者拿到了你的数据库，他有什么方法可以加速破解？」

A: bcrypt 的强度在于它的慢速哈希设计。但攻击者可以：1）**GPU/ASIC 并行**——虽然 bcrypt 不是特别适合 GPU 加速（比 MD5 慢几个数量级），但现代 GPU 集群每秒还是可以试几万个密码；2）**弱密码优先**——先尝试常见密码字典（password123、123456 等），不需要全部用暴力方式；3）**盐轮数 8 不算高**——如果数据库里有大量用户，8 轮的 bcrypt 用现代 GPU 大约每秒能测 100-200 个密码。我们的防御是密码最小长度 6 位的校验，但这不够。更好的做法是限制登录尝试次数（比如同一 IP 5 次失败后锁定 15 分钟），以及要求密码包含字母+数字+特殊字符。

> **追问**：「如果用户密码已经泄露了（在其他平台被撞库），你在本平台怎么保护这个用户？」

A: 即使密码在其他平台泄露了，在本地平台仍然是安全的——因为 bcrypt 加盐后，同一个密码在不同平台的哈希值完全不同，攻击者拿其他平台泄露的原始密码来登录，在我们平台试一次就知道了。但如果攻击者已经拿到了原始密码列表（比如 100 万个常见密码），直接用这些密码试图登录我们平台——那 bcrypt 再慢也挡不住字典攻击。防护手段：1）**登录限流**——同一用户 5 次失败锁定 15 分钟；2）**异地登录检测**——检测到异常 IP 时要求二次验证；3）**强制改密**——如果平台发现敏感日志（比如批量登录尝试），强制疑似被撞库的用户修改密码；4）**双因素认证**——绑定手机号后，登录时发短信验证码。目前只做了前两个中的一部分，方案 4 需要整合手机号验证码功能。

---

### 📌 部署与运维

#### Q26: 「你说只能在本地构建前端，因为服务器 2GB 内存跑不动 `npm run build`。那如果有人提交了一个有语法错误的 React 代码，本地构建报错但你没发现就直接提交了——线上会怎样？」

A: 线上不会出问题，因为前端的 Docker 镜像直接 `COPY build/` 打包已经构建好的静态文件，不会在服务器上重新编译。但如果本地构建失败，build 目录不会被更新，线上还是上一次的旧版本。所以正确的 CI 流程应该是：本地构建成功 → 生成新的 build/ → commit & push → 服务器 pull 并重启。如果构建失败，commit 的时候应该能发现 build 目录还是旧的。更好的做法是用 GitHub Actions 做 CI——每次 push 自动在云端构建，构建失败就阻止合并。

> **追问**：「如果 build 目录不小心被 `.gitignore` 忽略了，服务器 git pull 后没有 build 文件夹——页面会变成什么？」

A: 如果 `build/` 被 `.gitignore` 忽略，Git 不会追踪 build 目录的文件。`git clone` 或 `git pull` 后 build 目录不存在，Nginx 容器里的 `COPY build/ /usr/share/nginx/html` 构建阶段就会失败（因为 build 目录不存在），Docker 构建报错退出。或者如果用 volume 挂载那就直接没有首页。用户访问服务器页面时，Nginx 返回 404 Not Found（因为 `/usr/share/nginx/html` 里没有任何文件）。所以 build 目录要么提交到 Git，要么用 CI 构建后上传到服务器——不能在 .gitignore 里忽略 build 目录的同时什么都不做。

#### Q27: 「你的 docker-compose 用了 `restart: unless-stopped`。如果 MongoDB 容器反复崩溃又重启（CrashLoopBackOff），你怎么诊断？」

A: 诊断步骤：1）`docker logs second-hand-mongodb --tail 100` 看最近 100 行日志；2）`docker inspect second-hand-mongodb` 看 Exit Code、资源限制、挂载卷；3）`docker stats` 看容器内存 CPU 趋势；4）`journalctl -u docker` 看 Docker 守护进程日志。常见原因：磁盘空间满、内存不足被 OOM Kill、数据卷权限问题、MongoDB WiredTiger 缓存设置过大。解决方案分别是清理磁盘、加 `mem_limit`、检查卷权限、调小 `wiredTigerCacheSizeGB`。

> **追问**：「MongoDB 的 WiredTiger 缓存默认占多大内存？在 2GB 服务器上你会怎么调？」

A: WiredTiger 的缓存默认取以下两个值的较大者：256MB 或（总内存 - 1GB）的 50%。在 2GB 服务器上就是 (2-1) × 50% = 512MB。这个值在 2GB 服务器上偏大——MongoDB 可能会吃掉 512MB 缓存 + 其他连接开销，再加上 Node.js 和 Nginx，2GB 很容易撑爆。优化：在 `mongod.conf` 中设置 `wiredTigerCacheSizeGB: 0.25`（256MB），把省下来的内存留给 Node.js。或者直接在 docker-compose 中传 `--wiredTigerCacheSizeGB 0.25` 参数。实际线上我们就是这么调的。

#### Q28: 「你的部署文档里说前端 build/ 需要提交到 Git。一个 build/ 目录通常有几 MB，多人协作时每次构建都会产生大量 diff——你怎么处理这个问题？」

A: 这确实是个工程问题。几个方案：1）把 `build/` 加入 `.gitignore`，用 GitHub Actions 构建并自动上传到服务器（CD）；2）用 CI/CD 工具（Jenkins/GitHub Actions）在服务器拉取代码后自动在另一台构建机上构建，再把产物 scp 到目标服务器；3）保留 build/ 提交但每次构建后只 commit 真正变化的文件（`git add -p` 只选择 build/ 中的增量）。目前因为只有一个人开发，build/ 提交是最直接的方式。如果团队协作，肯定要上 CI/CD。

> **追问**：「你们目前没有 CI/CD，生产环境的 `.env` 文件是手动创建的。如果有一天服务器被重装了，你靠什么回忆起所有密钥和配置？」

A: 这就是没有 CI/CD 的风险。当前的依赖是"人肉记忆"——所有密钥存在开发者的脑子里和本地 `.env` 文件中。如果服务器重装，需要从本地 `.env` 文件重新上传。改进方案：1）**密码管理器**——把密钥存在 Bitwarden/1Password 的共享保险箱中；2）**GitHub Secrets**——虽然没上 CI/CD，但可以在 GitHub 仓库的 Settings → Secrets 里存一份，至少比本地文件安全；3）**基础设施即代码**——用 Ansible 或 Terraform 管理服务器配置，所有密钥变量化，用 Vault 存储；4）**定期备份**——`scp` 把服务器 `.env` 下载到本地备份。目前只用方案 1 的原始版（记在文档里）。

---

### 📌 业务逻辑与边界情况

#### Q29: 「你的批量结算是遍历购物车逐个购买。如果在遍历过程中第 3 个商品购买成功后第 4 个失败——前 3 个已经扣了库存，不会回滚对吧？这算不算数据不一致？」

A: 算部分一致而非完全一致。在目前的设计中确实不会回滚已成功的购买。这是故意的设计决策：商品库存的扣减是不可逆的业务操作（不能因为 A 买成功了「顺便」把 B 也取消掉），用户能得到已成功购买的商品。我们会在返回结果中清晰告知用户「成功购买 3 件、1 件失败」，失败的商品还留在购物车里，用户可以选择删掉或等补货。如果业务要求"要么全部成功要么全部失败"，那就需要包装在 MongoDB 事务里。但对于购物车结算，部分成功对用户体验更好——你不能因为最后一件没买到就让用户前三件也白排队了。

> **追问**：「如果用户说『我就要么全买要么全不买』，你怎么改？」

A: 如果业务要求"全买或全不买"，目前的设计就要改。方案：用 MongoDB 的多文档事务（如果有副本集）包裹整个结算流程——开启 session → 遍历购物车逐个执行 `findOneAndUpdate` → 全部成功则 `commitTransaction` → 任何一步失败则 `abortTransaction`（自动回滚所有扣减的库存）。在单节点 MongoDB 下无法用事务，替代方案：**两阶段提交**——第一阶段"预扣"库存（把库存移到 `pendingStock` 字段），第二阶段确认购买后真正扣减。如果第一阶段中有任一商品库存不足，释放所有预扣库存（回滚）。这个方案复杂度高，目前没有实现，因为和其他校园二手平台的实践来看，部分成功对用户更友好。

#### Q30: 「你的商品状态有 unsold → sold → inactive 的流转。但如果一件商品被卖家设为 sold_out 后又有库存了（比如买家退货了）——你怎么处理？」

A: 目前没有退货流程，所以这个场景不在设计中。如果要加，最简单的做法是卖家的商品管理页面增加一个"重新上架"按钮，把状态从 `sold_out` 或 `sold` 改为 `unsold`，同时把 `quantity` 加回来。更完整的方案是增加一个订单系统——退货走订单逆向流程：生成退货订单 → 审核 → 确认收货 → 恢复库存。目前没有订单系统，所以这个场景暂时不支持。

> **追问**：「如果不设订单系统，你怎么防止卖家『虚假上架』——标了有库存但实际手里没有货？」

A: 这是个信任问题，单纯靠技术手段比较难防。当前我们能做的：1）**用户举报机制**——买家收到货后发现货不对板，可以举报卖家，平台管理员审核后封号；2）**信用评分**——每个卖家有信用分，虚假上架被举报后扣分，低于阈值限制发布；3）**交易记录**——一个买家对同一个卖家只能购买一次（通过 `purchasedBy` 数组记录），防止刷单。更彻底的方案是引入订单系统和保证金机制——但这对学生项目来说太重了。校园环境下，同校学生之间当面交易，信任成本天然较低。

#### Q31: 「商品规格是用 `[{ key, value }]` 嵌入数组实现的。如果用户想按『存储容量：256G』来搜索所有手机，你能做到吗？」

A: 用当前的嵌入数组结构和 `$regex` 搜索做不到按规格值精确搜索，因为规格值是自由文本，没有统一的键名约束。要支持这个：1）用 MongoDB 的 `$elemMatch` 可以查数组元素——`Product.find({ specifications: { $elemMatch: { key: '存储容量', value: '256G' } } })`，但前提是不同手机的规格 key 要统一（都用"存储容量"而不是"容量"或"内存"）；2）更好的方案是把关键规格提升为顶层字段（比如 `storage: String`），这样可以直接建索引搜索。或者把规格做成一个预定义的枚举 Schema，发布时从下拉框选择而不是手写文本。

> **追问**：「如果不提升为顶层字段，只靠 `$elemMatch` 查询，性能怎么样？」

A: `$elemMatch` 在数组字段上的查询性能取决于是否建有**多键索引**（Multikey Index）。如果对 `specifications` 数组建索引，`$elemMatch` 可以利用索引快速定位到匹配的数组元素。没有索引的情况下，MongoDB 需要对每条文档的数组做全扫描，性能较差（O(n × m)，n 为文档数，m 为数组长度）。而如果提升为顶层字段（比如 `storage: String`），建一个普通 B-tree 索引，查询是 O(log n)，性能比 `$elemMatch` 好很多。所以如果规格搜索是高频需求，应该提升为顶层字段并建索引。

#### Q32: 「你的手机号正则排除了 170/171 号段。现在很多大学生用的是虚拟运营商号码（如 170 号段的蜗牛移动、阿里通信），你的项目就注册不了了——这不是把用户挡在门外吗？」

A: 这是个好问题。当初写正则 `/^1[3-9]\d{9}$/` 是为了过滤无效号码，但没有考虑到虚拟运营商的普及。解决方案有三个：1）拓展正则到 `/^1[3-9]\d{9}$/` 不匹配 170/171，所以应该改为 `/^1\d{10}$/` 只校验 11 位数字和 1 开头；2）更严谨的做法是用阿里云或聚合数据的手机号归属地 API 做实时校验，确认是有效号码即可，不限制号段；3）接入短信验证码流程，只有能收到验证码的号码才算有效。方案 1 最快，方案 3 最安全。

> **追问**：「如果改为 `/^1\d{10}$/`，攻击者可以注册 10 万个 10000000000 这种非法号段来攻击你数据库吗？」

A: 可以。如果校验只检查 11 位数字和 1 开头，攻击者可以用脚本批量注册各种非法号段（10000000000、11111111111 等），填满数据库。这才是真正的安全风险——不是正则拦了正常用户，而是正则不够严格会让恶意注册更容易。更合理的方案：前端用 `/^1\d{10}$/` 做格式校验，后端用手机号归属地 API 做**有效性校验**（确认是真实的运营商号码）。或者直接走短信验证码流程——能收到验证码的号码就是真实号码，不需要前端正则做严格限制。目前没有短信验证码，正则确实需要在"包容性"和"安全性"之间平衡。

---

### 📌 压力测试与性能

#### Q33: 「你说 `$regex` 搜索没建索引也够用。那你做过压力测试吗？当商品表达到 10 万条时，一个 `$regex` 查询需要多少毫秒？」

A: 没有正式的压力测试数据。但理论分析：MongoDB 的 `$regex` 如果没有索引，是全文扫描（Collection Scan），时间复杂度 O(n)。10 万条记录下，每个文档需要比对 name/college/uploadedBy.name 三个字段，大约需要 200-500ms，对于搜索体验来说勉强可接受但不算好。如果数据达到 50 万条，可能到 2-3 秒。优化方向：1）对高频搜索字段建文本索引（`name` + `category` + `uploadedBy.college`）；2）将搜索词的首字母匹配改为前缀匹配——`$regex` 以 `^` 开头的正则可以用普通索引做前缀搜索；3）用 Elasticsearch 代替 MongoDB 搜索。

> **追问**：「`$regex` 的 `^` 前缀匹配和 MongoDB 文本索引（text index）在查询计划上有什么区别？」

A: `$regex` 以 `^` 开头的前缀匹配（如 `{ name: { $regex: /^iPhone/, $options: 'i' } }`）——如果能对 `name` 字段建普通索引，MongoDB 可以用索引做**范围查询**，只需要扫描索引树中匹配前缀的一部分节点，效率接近普通等值查询。而文本索引（text index）是把字段内容分词后建倒排索引，适合做**全文搜索**（搜索词可以出现在字段的任何位置，不限于前缀）。文本索引支持中文分词（需要指定语言为 `zh`），可以处理 iPhone、IPhone、iphone 的大小写归一化。结论：前缀匹配用普通索引，模糊搜索用文本索引。目前项目用的 `$regex` 不加 `^` 前缀，无法走索引，数据量大时性能差。

#### Q34: 「你的图片上传限制了单张 20MB。但如果用户上传了一张 19MB 的高清图，你的 `sharp` 压缩能把它压到多大？服务器 2GB 内存能处理这么大的图片吗？」

A: 19MB 的图通常是高分辨率（比如 6000x4000 像素），`sharp` 压缩到 1920px 宽、80% 质量后大约能压到 200-500KB——压缩率超过 95%。但 `sharp` 在处理大图时本身需要大量内存，处理一张 6000x4000 的图大约需要 200-300MB 临时内存，这个在 2GB 服务器上要小心。可能的优化：先限制上传分辨率（在前端 canvas 压缩时限死），或者在后端用流式处理而不是一次加载到内存。

> **追问**：「sharp 处理大图时 OOM 了，你的 multer 中间件能处理这种情况吗？文件已经传到一半了怎么办？」

A: multer 的 `upload.single('images')` 是流式写入磁盘的——文件边上传边写入临时目录，所以即使 sharp 后续处理 OOM 了，文件已经在磁盘上了。但问题在于：文件传到一半时如果 sharp 崩了，临时文件会成为**孤立文件**（占磁盘空间但没被正式保存到 uploads 目录）。改进方案：1）multer 的 `limits.fileSize` 已经在中间件层面拦了超 20MB 的文件；2）sharp 处理完图片并保存到 uploads 后才删临时文件；3）如果 sharp 抛异常，在 catch 块里 `fs.unlinkSync` 删除临时文件；4）设置定时任务清理 uploads 和 tmp 目录中的孤立的、非关联文件。目前代码中在异常处理里删除了临时文件，但定时清理没做。

#### Q35: 「你说项目用到了懒加载、防抖这些前端优化。你对整个页面有没有做过 Lighthouse 评分？各项得分多少？」

A: 正式跑过 Lighthouse 13.0.2（桌面端），测试了三个核心页面。优化前的基线数据：

| 页面 | 性能 | 无障碍 | LCP | TBT | CLS |
|-----|:---:|:-----:|:---:|:---:|:---:|
| 首页 /home | 89 | 71 | 1.0s | 0ms | 0 |
| 商品详情 | 51 | 97 | 5.3s | 0ms | 0.142 |
| 登录页 /login | 84 | 82 | 1.8s | 0ms | 0 |

（Lighthouse 不同轮次测试分数有波动，选最优值组合展示。）

基于这些数据做的优化措施：1）**代码分割** — React.lazy + Suspense 异步加载低频页面（UserProfile/AddProduct/EditProduct/Cart），首屏 JS 减少约 139-185 KiB，高频入口页（Login/Register）保持同步加载；2）**ErrorBoundary 兜底** — chunk 加载失败时友好提示而非白屏；3）**Nginx Gzip + 强缓存** — 文本/JS/CSS 超过 1KB 自动压缩，静态资源缓存 1 年（immutable），图片缓存 30 天；4）**CLS 修复** — 商品图片设 width/height + aspect-ratio 容器，CLS 从 0.142 降至接近 0；5）**原生懒加载** — `<img loading="lazy">` 替代自定义 IntersectionObserver，消除首屏图片被 JS 推迟下载的问题；6）**无障碍修复** — 按钮文字对比度从 2.3:1 提升至 5.5:1 符合 WCAG AA、表单 label 关联、搜索按钮加 aria-label、Home 组件加 `&lt;main&gt;` landmark 标签。

优化后商品详情页性能从 51 提升到 85，CLS 问题已解决。首页和登录页分数波动主要是服务器 2GB 内存限制下不同时间点负载不同造成的。

> **追问**：「Lighthouse 的 TBT（Total Blocking Time）和 LCP（Largest Contentful Paint）在商品详情页上主要由什么决定了？」

A: LCP 主要由**商品主图加载时间**决定。优化前商品详情页的图片没有懒加载和固定宽高，浏览器需要等图片完全下载才能确定布局，导致 LCP 高达 5.3 秒。优化后：图片容器设了 `aspectRatio: 4/3`、`<img>` 加了 `width` 和 `height` 属性、`loading="lazy"`，浏览器在图片下载前就能分配好占位空间，LCP 降至 1.6 秒。TBT 两个轮次都是 0ms，说明 React 组件渲染和 API fetch 没有明显阻塞主线程。进一步的优化可以做路由级代码分割（已实现）和骨架屏过渡——目前懒加载页面用了 spinner，可以换成骨架屏让视觉上更平滑。

---

### 📌 代码与工程

#### Q36: 「你的代码里有不少重复的 fetch 调用（比如每个组件都写 `fetch('/api/xxx').then(res => res.json())`）。你考虑过封装一个统一的 API 层吗？」

A: 考虑过，但没有做。目前前端 10 多个组件各自写 fetch，确实有代码重复。理想方案是封装一个 `api.js`：`get(url, token)`, `post(url, data, token)`, `put(...)`, `del(...)`，统一处理 Header 注入、401 自动跳转、错误格式化、loading 状态等。另一个更成熟的方案是用 React Query（TanStack Query）——自带缓存、重试、预加载、loading 态管理，可以大大简化前端数据请求的逻辑。这个在代码重构计划中。

> **追问**：「如果用 React Query，你怎么处理购物车数据在 Navbar 角标和 UserProfile 页面之间的同步？」

A: React Query 本身提供了缓存共享机制。关键思路：用**相同的 queryKey** 让两个组件共享同一个缓存。具体做法：Navbar 和 UserProfile 都调用 `useQuery(['cart'], fetchCart)`——React Query 会自动去重，只发一次请求，两个组件共享返回结果。当 UserProfile 中修改购物车后（删除商品、改数量），用 `queryClient.invalidateQueries(['cart'])` 使缓存失效，Navbar 角标自动更新。不需要 Context、不需要事件总线、不需要手动同步。这就是 React Query 比手写 fetch + Context 强的地方——数据依赖同一份缓存，一个失效全部更新。

#### Q37: 「你的 commit message 写得比较随意（比如『修复xx』、『提交』）。如果团队协作，你该怎么写 commit message 才能让队友快速回滚出错的提交？」

A: 目前因为一个人开发确实比较随意。团队协作应该遵循 Conventional Commits 规范：`feat: 新增AI生成描述功能`、`fix: 修复购买接口quantity为0时崩溃`、`refactor: 抽取aiService层`，再加 body 说明改动原因和影响范围。这样可以用工具自动生成 CHANGELOG，也能用 `git log --oneline --grep="fix"` 快速定位修复类提交。如果发现 bug，`git bisect` 配合规范的 commit 能快速定位到引入 bug 的提交。

> **追问**：「`git bisect` 的工作原理是什么？什么情况下 bisect 不准确？」

A: `git bisect` 用二分查找法在提交历史中定位引入 bug 的提交。过程：先标一个"好的"提交（已知 bug 不存在）和一个"坏的"提交（已知 bug 存在），Git 自动跳到中间提交，你标记好坏，以此类推——log₂(N) 次就能找到。比如 1000 个提交，只需要约 10 步。bisect 不准确的情况：1）"好的"提交选错了——某个提交其实也有 bug 但被误标为好，二分方向就跑偏了；2）bug 是非确定性的——有时出现有时不出现，同样的代码可能这次跑过了下次又崩了；3）提交不独立——两个提交之间的依赖导致 bisect 跳跃到中间时代码无法编译或运行，无法判断好坏。这种情况下要用 `git bisect skip` 跳过无法验证的提交。

---

### 📌 期末论文/答辩专场

#### Q38: 「你的论文题目说『基于大语言模型与规则引擎的校园二手交易平台』。『基于大语言模型』你觉得在这个项目里占了多少分量？有没有『挂羊头卖狗肉』的嫌疑？」

> 导师直击灵魂的提问——你要诚实地讲清楚 AI 在整个项目中的真实占比。

A: 坦率说，大语言模型目前只占了两个辅助功能（生成描述 + 推荐分类），占整个项目代码量的不到 5%。如果严格按字面意思，「基于大语言模型」确实显得头重脚轻。但换个角度：1）这两功能是项目的核心亮点和差异化点——校园二手平台遍地都是，带有 AI 辅助的才是少数；2）推荐引擎虽然目前是规则引擎，但设计了 AI 包装层（AI 标签、前端 AI 徽标），架构上预留了接入大模型推荐的位置；3）论文中会明确区分"已实现的 AI 能力"和"计划中的 AI 能力"，不夸大。如果把论文题目改成「融合规则引擎与 AI 辅助的……」更准确一些。

> **追问**：「那你的创新点到底是什么？不能用『用了 React 和 MongoDB』来答辩，全世界几万个项目都用了。」

A: 这是我的核心答辩思路，分三个层次说：1）**业务创新**——校园场景下的五级漏斗推荐引擎，不是随便拉个列表，而是结合了用户学校、商品分类、卖家信誉等多维度过滤的精细化推荐策略，在推荐效果和系统响应速度上做了实际的平衡和优化；2）**技术创新**——原子购买的防超卖方案（`findOneAndUpdate` + `$inc` 的巧妙使用）、Decimal128 价格的序列化问题及双保险方案、低内存服务器下的 Docker 资源调优——这些不是框架能给的，是真正踩坑后的工程实践；3）**AI 创新**——用通义千问的多模态能力做商品图文分析，并与规则引擎混合部署，不是简单的"调了一个 API"。

#### Q39: 「你的项目算不算『人工智能项目』？评委可能说：你这个就叫 AI？不就是调了个 API 吗？」

A: 这个要有心理准备。如果评委这么说，我的回答思路是：1）调 API 也是 AI 应用的正规方式——就像你写代码用第三方库一样，调用大模型 API 做特定任务属于 AI 工程化的典型实践；2）项目在提示词工程（Prompt Engineering）上有自己的设计——长度控制、格式约束、角色设定；3）推荐引擎虽然不是实时大模型驱动，但分类推荐分层策略本身是机器学习中的经典思路（协同过滤的思想变体）；4）我们区分了"集成 AI"和"自研 AI"——作为本科生期末论文，集成 AI 并做出实际可用的应用，已经是合格的人工智能课程实践。

> **追问**：「你觉得你的 Prompt 工程和网上随便 copy 的『请你写一段商品描述』有什么本质区别？」

A: 有几个关键区别：1）**输出格式控制**——我们要求大模型返回结构化 JSON（visualFeatures、textFeatures、recommendDirection、tagLabel 等字段），而不是自由文本，这样前端可以直接解析展示；2）**图文多模态分析**——不只是生成文本，而是分析商品图片的视觉特征，这是要配合 Prompt 中的「请从以下角度分析图片」等具体指引才能达成的；3）**错误处理与重试机制**——大模型返回格式不对时（比如解析 JSON 失败），后端有 fallback 逻辑，不会让用户看到"系统出错了"；4）**成本和长度优化**——Prompt 中精确控制了输出长度的上限和下限，避免浪费 token。通用的"写一段描述"做不到这些工程落地的细节。

#### Q40: 「你这项目用了很多成熟框架和组件，你自己写的东西有多少？评委可能会说你这是『拼凑』的。」

A: 我的回答：1）现代软件开发本质就是组合和集成——用 React 写 UI、用 Express 写 API、用 Docker 部署，这是标准的工程实践，不是拼凑；2）自主开发的亮点：原子购买的防超卖逻辑（`findOneAndUpdate` + `$inc` 的巧妙使用）、五级漏斗推荐引擎的架构设计、前后端双重校验的安全机制、购物车部分结算的场景处理；3）遇到的实际问题解决——Decimal128 双保险、base64 转文件存储的教训、低内存服务器的优化策略。这些不是框架能自动给的，是我们在开发过程中真正思考和解决的问题。

> **追问**：「你遇到的最大技术挑战是什么？你怎么解决的？如果重新来做会怎么做？」

A: 最大挑战是**Decimal128 价格序列化问题**——MongoDB 存价格用 Decimal128，但 JSON 序列化后变成 `{ $numberDecimal: "99.99" }`，前端直接渲染会显示 Object。最初尝试在 Mongoose Schema 的 toJSON transform 中处理，发现 populate 场景下 transform 不生效。最后采用"双保险"方案：后端每个 API 返回前显式 `Number(product.price) || 0`，前端用 `Number(product.price ?? 0)` 兜底。如果重新来做：1）一开始就不该用 Decimal128——对校园二手平台来说，普通 Number 类型精度足够（价格到分，最大 10 万，不存在浮点精度问题）；2）或者直接用 Mongoose 的 getter/setter 统一处理，而不是每个 Controller 手写转换；3）或者在响应中间件层统一递归转换所有 `$numberDecimal` 字段。这个坑最大的教训是：**不要为了"规范"而过度设计**，简单方案够用就不要引入复杂的数据类型。

#### Q41: 「从用户角度，你这个平台和其他二手平台（闲鱼、转转）的核心差异在哪？如果用户为什么要用你的平台？」

A: 核心差异在定位——**校园专属**。闲鱼是全社会的，我们的平台是针对同校学生的：1）推荐引擎的第二优先级就是同校商品，学生优先看到隔壁同学卖的东西；2）注册时填学校信息，交易天然在同校园范围内，当面交易方便、信任成本低；3）AI 辅助功能对学生友好——不确定商品怎么分类？AI 推荐。不会写描述？AI 生成。不是要用它和闲鱼竞争，而是要解决"学生不知道该去哪处理闲置"的问题。如果非要和大型平台竞争，我们的劣势很明显——没有支付、没有物流、没有客服。

> **追问**：「你觉得校园二手交易最大的痛点是什么？你的平台解决了这个痛点吗？」

A: 最大的痛点是**信息不对称**和**信任成本**。学生想卖闲置——放在宿舍吃灰，不知道卖给谁、怎么定价、怎么描述；想买二手——不知道去哪找、价格是否合理、卖家靠不靠谱。我们的解决方案：1）**同校优先推荐**解决了信任问题——买家优先看到同校学生的商品，可以当面交易，无需快递无需担心欺诈；2）**AI 辅助发布**降低了卖家的发布门槛——AI 自动生成描述和推荐分类，让"懒得写"的学生也能快速上架商品；3）**搜索+分类+学校三级过滤**提高了信息匹配效率——买家可以按学校筛选，精准找到身边同学在卖的东西。核心痛点不能说完全解决了，但比闲鱼对校园场景更友好——因为闲鱼不关心你在哪个学校，它只关心你在哪个城市。

---

### 📌 深度追问（备选）

> 这些问题更难，如果你的答辩表现好，评委可能不会问。但如果问到，答出来就很加分。

#### Q42: 「用 `$regex` 做模糊搜索。如果我想搜索 iPhone 14 Pro Max，不小心写成了 IPhone 14 Pro max（大小写不同），能搜到吗？」

A: 能。MongoDB 的 `$regex` 默认是大小写敏感的，但我们实现中用了 `$options: 'i'` 标记，所以不区分大小写。另外如果用户只搜"14 Pro"也能匹配到，因为是子串匹配。但搜"Phone 14"搜不到"iPhone 14"（因为 `$regex` 是子串查找，不是单词分词）。要支持更智能的搜索，应该用 MongoDB 文本索引 + 中文分词，或者 Elasticsearch。

#### Q43: 「你的 `.env` 文件通过 docker-compose 的 `environment` 段传入容器。但 `docker inspect` 可以查看容器的环境变量——这算不算密钥泄露？」

A: 算。`docker inspect container_id` 确实会暴露环境变量。解决方案：1）Docker Swarm 模式下用 `secrets` 管理——密钥写入文件，容器内读取文件而不是环境变量；2）用 HashiCorp Vault 等密钥管理服务；3）至少把 `.env` 文件权限设为 600。目前环境变量方式确实有安全风险，但考虑到这是学生项目的低风险场景，可以接受。如果上生产环境，一定要用 Docker secrets。

#### Q44: 「购物车批量结算是串行遍历的。如果购物车有 20 件商品，第 1 件和后端数据库交互要 50ms——20 件就是 1 秒。用户需要等 1 秒才能看到结算结果，你能并行处理吗？」

A: 可以并行处理，用 `Promise.allSettled`：同时发起 20 个 `findOneAndUpdate` 请求，等全部完成后汇总结果。MongoDB 的 WiredTiger 引擎支持文档级别的并发控制，20 个并发的单文档操作可以同时执行。但需要注意：如果多个购买请求针对同一个商品（虽然购物车里一般不会有重复商品），`findOneAndUpdate` 的原子性依然能保证不会超卖。`Promise.allSettled` 比 `Promise.all` 更合适，因为`allSettled` 会等全部完成（包括失败），而 `all` 在第一个失败时就中断了。目前串行设计是出于简单，改成并行不难。

#### Q45: 「你部署了线上版本。如果线上突然出现 bug，用户数据丢了——你的回滚方案是什么？」

A: 回滚分数据和应用两个层面。数据层：MongoDB 有 `docker exec second-hand-mongodb mongodump` 可以做定期全量备份，配置了定时任务每天凌晨备份到 `/backup/` 目录。如果数据丢失，用 `mongorestore` 恢复到最近一次备份。应用层：代码在 Git 管理，`git revert` 回滚到上一个稳定提交，重新构建前端并 `docker compose up -d --build`。但 MongoDB 的 WiredTiger 引擎本身有 journal 日志，崩溃时能自动恢复到最后一次检查点。最坏情况：备份丢失 + 服务器挂掉 = 数据永久丢失。解决方案是跨地域备份到 OSS，但目前没做。

> **追问**：「备份有加密吗？攻击者拿到你的 mongodump 能直接读出用户密码的哈希值吗？」

A: 目前备份没有加密——这是安全缺口。`mongodump` 导出的 BSON 文件是二进制格式但不是加密的，攻击者拿到后可以用 `mongorestore` 导入本地 MongoDB 直接读取全部数据。哈希值（bcrypt）虽然不能逆向还原出原始密码，但攻击者可以用常见的密码字典做**离线对比攻击**——从备份中拿到哈希值后，在本地 GPU 集群上高速尝试常见密码，不需要经过我们服务器的限流保护。解决方案：1）mongoexport 后用 gpg 或 openssl 加密备份文件；2）阿里云 OSS 服务端加密（SSE-KMS）；3）备份直接上传到 OSS 并设 ACL 为私有，不留在服务器本地盘。目前没做加密，只做了访问控制（服务器仅限 SSH 密钥登录）。

---

## 附录：项目文件速查

```
d:\Second-Hand-main\
├── docker-compose.yml          # Docker 编排
├── PROJECT_SUMMARY.md           # 项目完整文档（含API和模型说明）
├── CHANGELOG.md                 # 版本历史（v2.0.0 ~ v2.4.0）
├── STUDY.md                     # 本文件：学习指南
├── Client/                      # 前端
│   ├── Dockerfile               # nginx:alpine（直接 COPY build/）
│   ├── nginx.conf               # 反向代理 + Gzip + 缓存 + X-Forwarded-For
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js               # 路由配置（React Router v6）
│       ├── index.js             # React 入口
│       ├── index.css            # Tailwind 指令
│       ├── context/
│       │   ├── authContext.js   # 认证上下文（登录态 + 多标签页同步）
│       │   └── NotificationContext.js  # 通知上下文（30s 轮询）
│       ├── components/          # 全部页面和通用组件
│       │   ├── Home/            # 首页：搜索 + 筛选 + 列表 + 推荐 + 分页
│       │   ├── Product_Details/ # 商品详情 + 推荐 + 购买弹窗
│       │   ├── Profile/         # 个人主页 + 申诉
│       │   ├── Admin/           # 管理后台
│       │   ├── Edit_Product/    # 商品编辑表单
│       │   ├── Utility/         # Navbar / Footer / ProductCard / Loading
│       │   ├── Login.js         # 登录（含 session 过期提示）
│       │   ├── Register.js      # 注册
│       │   ├── ProductPage.js   # 商品详情 + 图集轮播 + 联系卖家
│       │   ├── Cart.js          # 购物车
│       │   ├── AddProduct.js    # 发布商品 + AI 辅助
│       │   ├── UserProfile.js   # 用户主页
│       │   ├── NotificationModal.js  # 强制通知弹窗
│       │   └── ProtectedRoute.js     # 路由守卫 + 封禁拦截
│       └── utils/
│           └── sessionGuard.js  # 全局 fetch 拦截（SESSION_EXPIRED 自动清登录态）
└── Server/
    ├── Dockerfile               # node:18-alpine
    ├── server.js                # 入口（中间件链 + 路由注册）
    ├── .env.example             # 环境变量模板
    ├── config/
    │   ├── db.js                # MongoDB 连接（Mongoose）
    │   ├── auth.js              # JWT 签发/验证 + bcrypt 密码加密
    │   ├── rateLimiter.js       # 登录/注册限流（降级容错设计）
    │   └── majorMap.js          # 南昌师范学院学院-专业映射（13学院）
    ├── middleware/
    │   └── authMiddleware.js    # JWT 认证 + session 验证
    ├── models/
    │   ├── User.js              # 用户（含 activeSessions, phoneUniqueEnforced）
    │   ├── Product.js           # 商品（含 4 个复合索引）
    │   ├── Wanted.js            # 求购
    │   ├── Report.js            # 举报
    │   ├── Appeal.js            # 申诉（含 3 个索引）
    │   └── Warning.js           # 通知/警告（critical 强制弹窗）
    ├── controllers/
    │   ├── userController.js    # 注册/登录（原子操作）/登出/CRUD
    │   ├── productController.js # 商品CRUD + 推荐引擎 + 购买（原子操作）
    │   ├── aiController.js      # AI 生成描述 / 推荐分类
    │   └── cartController.js    # 购物车 CRUD + 批量结算
    ├── routes/
    │   ├── userRoutes.js        # /api/users（含 logout）
    │   ├── productRoutes.js     # /api/products（含图片/规格子路由）
    │   ├── aiRoutes.js          # /api/ai（auth 保护）
    │   ├── cartRoutes.js        # /api/cart
    │   ├── uploadRoutes.js      # /api/upload（multer 文件上传）
    │   ├── wantedRoutes.js      # /api/wanted
    │   ├── reportRoutes.js      # /api/reports
    │   ├── adminRoutes.js       # /api/admin（含 NoSQL 注入防护）
    │   ├── warningRoutes.js     # /api/warnings
    │   └── appealRoutes.js      # /api/appeals
    └── services/
        └── aiService.js         # 通义千问 API 调用（qwen-plus）

---

## 12. 安全加固操作指南（v2.5.0）

> 上线安全审计后新增 20 项安全修复。以下为日常运维中的使用说明。

### 12.1 验证安全功能是否生效

| 验证项 | 方法 | 预期结果 |
|-------|------|---------|
| NoSQL 注入防护 | `curl -X POST http://localhost:8000/api/users/login -H "Content-Type: application/json" -d '{"email":{"$ne":""},"password":"x"}'` | 400 "邮箱格式不正确" |
| PII 脱敏 | 未登录访问 `GET /api/products` | 响应中 `uploadedBy` 不含 `phone`/`wechat`/`qq` |
| CSP | 浏览器 DevTools → Network → 任意响应头查看 `Content-Security-Policy` | 存在 CSP 头且 console 无 CSP 报错 |
| 违禁词 | 注册用户名填写"代写论文" | 400 "个人信息包含违规内容" |
| Docker 非 root | `docker exec second-hand-backend whoami` | `appuser` |
| PM2 进程 | `docker exec second-hand-backend pm2 status` | 显示 server 进程 online |
| 文件上传安全 | 尝试上传 SVG 文件 | 400 拒绝 |
| 登录反枚举 | 用不存在的邮箱登录 | 返回"邮箱或密码错误"（而非"用户不存在"） |

### 12.2 修改违禁词列表

编辑 `Server/config/bannedKeywords.js`，在 `bannedKeywords` 数组中增删关键词：

```javascript
const bannedKeywords = [
  // ... 现有词条
  "新违禁词1",
  "新违禁词2",
];
```

修改后重建后端容器。所有引用点（注册/编辑资料/创建商品/规格编辑/求购帖）自动生效。

**注意**：避免添加过短或常见的词（如"猫""狗""PDF"），否则会误杀正常交易。违禁词应至少 3 个字，且有明确的违规指向。

### 12.3 调整限流参数

全局限流（`Server/server.js`）：

```javascript
app.use("/api", rateLimit({
  windowMs: 60 * 1000,  // 时间窗口（毫秒）
  max: 100,              // 窗口内最大请求数
}));
```

登录/注册限流在 `Server/config/rateLimiter.js` 中单独调整（更严格的限制）。

### 12.4 调整 API 缓存时长

```javascript
// Server/server.js
app.get("/api/majorMap", cache(3600), ...)  // 3600 秒 = 1 小时
app.get("/api/stats", cache(60), ...)        // 60 秒
```

缓存为内存存储（Map），容器重启后自动清空。若需对新接口加缓存，只需在路由中添加 `cache(ttl)` 中间件即可。

### 12.5 部署流程（含安全检查）

```bash
# 1. 本地构建前端
cd Client && npm run build

# 2. 提交并推送
git add . && git commit -m "描述" && git push

# 3. 服务器拉取
ssh root@your-server
cd /www/wwwroot/Second-Hand-main
git pull

# 4. 确保 .env 文件存在且密钥完备
# 必要变量：JWT_SECRET, QWEN_API_KEY, MONGODB_URI_FULL, CLIENT_URL

# 5. 重建并启动
docker compose up -d --build

# 6. 验证安全配置
docker exec second-hand-backend whoami          # 应输出 appuser
docker exec second-hand-backend pm2 status       # 应显示 online
curl http://localhost:8000/api/health            # 应返回 { status: "ok" }
```

### 12.6 监控与日志

```bash
# PM2 进程状态
docker exec second-hand-backend pm2 status

# PM2 日志（最近 50 行）
docker exec second-hand-backend pm2 logs --lines 50

# 容器日志
docker logs second-hand-backend --tail 100

# 容器资源使用
docker stats second-hand-backend second-hand-mongodb

# MongoDB 缓存大小检查
docker exec second-hand-mongodb mongosh -u admin -p "$MONGO_PASS" --eval "db.serverStatus().wiredTiger.cache"
```

### 12.7 故障处理

| 现象 | 可能原因 | 修复方法 |
|------|---------|---------|
| 后端反复重启 | MongoDB 未就绪、`.env` 缺少变量 | `docker logs second-hand-backend` 查看具体报错，等待 MongoDB 启动或补全变量 |
| PM2 进程不在线 | 容器内进程异常退出 | `docker exec second-hand-backend pm2 restart all` |
| 图片上传被拒 | 文件类型不在白名单（非 JPEG/PNG/GIF/WebP） | 确认图片格式；SVG 永久禁止 |
| 违禁词误拦截 | `bannedKeywords.js` 中有过短的通用词 | 移除误拦截的关键词后重建容器 |
| CSP 报错 | 新增了第三方资源（CDN、外部字体等） | 按需在 `server.js` 的 CSP 策略中添加白名单域名 |
| 缓存数据过期但未更新 | 缓存 TTL 设的太长 | 重启容器清空缓存，或调小 `cache()` 的 TTL 参数 |
| 容器内存溢出 | 2GB 服务器资源不足 | `docker stats` 查看；调低 MongoDB WiredTiger 缓存或 PM2 内存限制 |

### 12.8 CORS 域名管理

当需要新增允许的前端域名时，修改 `.env` 中的 `CLIENT_URL`：

```bash
# 单域名
CLIENT_URL=http://localhost:3000

# 多域名（逗号分隔）
CLIENT_URL=http://localhost:3000,https://freevian.top,http://192.168.1.100:3000
```

CORS 中间件会自动解析逗号分隔的域名列表，重启后端容器生效。同时 CSP 中也可加对应的 `connect-src` 白名单。
```
