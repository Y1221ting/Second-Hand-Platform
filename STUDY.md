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
| 个人资料 | 编辑信息、查看发布/购买记录 |
| AI 辅助 | 通义千问 API 生成描述、推荐分类 |

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

### 登录

```
1. 前端填写邮箱+密码 → POST /api/users/login
2. 后端查邮箱是否存在
3. bcrypt.compare(password, hashedPassword)
4. jwt.sign({ userId }, SECRET, { expiresIn: "1d" })
5. 返回 { token: "xxx", user: { ... } }  — 扁平结构，前端直接存 localStorage
6. 前端保存：localStorage.setItem("token", data.token)
                localStorage.setItem("user", JSON.stringify(data.user))
```

### 认证请求

```
// 所有需要登录的接口都在 Header 带 Token
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}

// 后端解析 — authMiddleware
// 1. 取 Header 中的 Token
// 2. jwt.verify → 得到 userId
// 3. User.findById(userId) → req.user
// 4. next()
```

### 前端认证状态

```
// authContext.js — 全局 Context
// 页面刷新时从 localStorage 恢复用户信息
useEffect(() => {
  const storedUser = localStorage.getItem("user")
  if (storedUser) setUser(JSON.parse(storedUser))
}, [])

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

## 11. 常见面试/演示问题

### 📌 架构与设计

#### Q1: 为什么选择 MERN 这套技术栈？
A: MERN（MongoDB + Express + React + Node）全栈 JavaScript 开发，前后端语言统一，团队沟通成本低。React 生态成熟适合 SPA，Express 轻量灵活适合快速构建 RESTful API，MongoDB 的文档模型适合商品信息这种结构灵活的业务。对校园二手交易这个规模的项目，MERN 性价比最高。

#### Q2: 为什么用 MongoDB（NoSQL）而不是 MySQL？
A: 二手商品的规格参数不固定（比如电子产品有"存储容量"，服装有"尺码"，家具可能有"材质"），MongoDB 的灵活文档结构天然适合这种变长字段场景。如果强关系数据（如订单-商品-用户树）用 MySQL 更好，但本项目业务关系简单，MongoDB 的文档嵌入模式反而更高效，一次查询就能拿到商品+卖家信息，不用 JOIN。

#### Q3: 项目整体架构是什么样的？
A: 三层的前后端分离架构：前端 React SPA（Nginx 托管静态资源），后端 Express API 服务，数据库 MongoDB。Nginx 作为反向代理统一入口（端口 5000），`/api/` 和 `/uploads/` 代理到后端，其他路径返回前端 `index.html` 做 SPA 路由。Docker Compose 编排三个容器：mongodb、backend、frontend。

#### Q4: 为什么选择 Docker Compose 部署？
A: Docker 保证开发环境和生产环境一致，避免"在我电脑上能跑"的问题。Compose 把三个服务编排在一起，一条 `docker compose up -d --build` 就能启动整套系统。而且容器的资源隔离对服务器 2GB 内存的硬件环境更友好，可以单独限制每个容器的内存上限。

#### Q5: 你用了什么软件设计模式？
A: 后端采用 MVC 模式：Model（Mongoose Schema）定义数据结构，Controller 处理业务逻辑，View 由前端 React 负责。认证用中间件模式（authMiddleware），多个 API 共享认证逻辑。推荐系统用了策略模式——五级漏斗每级是一个独立策略，无数据时自动降级。前端用了 Context 模式管理全局认证状态。

#### Q6: 前端为什么用 Tailwind CSS 而不是传统 CSS 或组件库（Antd/Element）？
A: Tailwind 是原子化 CSS，直接在 className 写样式，不用频繁切换文件和命名类名，开发效率高。配合 `@apply` 可以提取重复样式。Antd/Element 适合后台管理类系统，二手交易平台 UI 更偏展示和交互自由，Tailwind 更灵活。客户端主色调是 `yellow-500`，响应式断点用 `sm/md/lg/xl`。

---

### 📌 后端实现

#### Q7: JWT 认证具体怎么工作的？过期了怎么办？
A: 登录时后端 `jwt.sign({ userId }, SECRET, { expiresIn: "1d" })` 生成令牌。前端存 localStorage，每次请求在 Header 带 `Authorization: Bearer <token>`。后端 authMiddleware 依次做：提取 Header → `jwt.verify` → `User.findById` 查用户 → `req.user = user`。token 过期（1天）后，`jwt.verify` 会抛 TokenExpiredError，中间件返回 401，前端检测到 401 自动跳转登录页让用户重新登录。目前没有做 refresh token 机制。

#### Q8: 如何防止用户买自己的商品？
A: 在 `purchaseProduct` 的原子操作查询条件中添加：`"uploadedBy.id": { $ne: userId }`。如果买家 ID 等于卖家 ID，`findOneAndUpdate` 查不到记录，直接返回 null，前端显示"不能购买自己的商品"。这套逻辑在单个购买和购物车批量结算中都做了。

#### Q9: 如何防止用户修改/删除别人的商品？
A: 更新和删除接口在 authMiddleware 之后，通过 `req.user` 拿到当前登录用户 ID。Controller 中先查商品（`Product.findById(id)`），判断 `product.uploadedBy.id.toString() !== req.user._id.toString()` 时返回 403 禁止操作。同时更新操作用 `findOneAndUpdate` 带着卖家 ID 条件，双重保险。

#### Q10: 图片上传怎么保证不崩？
A: 三步保护：1）前端 >1MB 图片自动压缩为 1920px 宽、80% JPEG 质量，大幅减小体积；2）multer 后端限制单张最大 20MB、整个请求最大 10MB，超过返回 413 错误；3）最多 9 张图片，防止恶意大量上传。数据库只存图片路径字符串，不存 base64 数据——之前尝试过 base64，文档超过 MongoDB 16MB 上限后直接崩溃。

#### Q11: 图片为什么不在前端用 base64 直接传？
A: base64 编码会使数据体积膨胀约 33%，一张几 MB 的图片转 base64 会变成几 MB 字符串。如果用 base64 存 MongoDB，多张图片就超 16MB 文档上限。而且 base64 传输效率低，解码渲染也慢。最佳实践就是二进制文件走磁盘/Nginx 静态服务，数据库只存路径引用。

#### Q12: 后端错误处理是怎么做的？
A: 每个 Controller 用 try-catch 包裹，catch 时根据不同错误类型处理：ValidationError（400 校验失败）、CastError（400 无效 ID）、11000（409 邮箱重复）、TokenExpiredError（401 过期）、JsonWebTokenError（401 无效 token）。未捕获的错误由 Express 默认错误处理返回 500。前端 fetch 调用时检查 `response.ok`，不 ok 时解析 `data.message` 显示给用户。

#### Q13: 为什么后端用 bcryptjs 而不是 bcrypt？为什么只用了 8 轮？
A: bcrypt 依赖 C++ 编译（node-gyp），在 Docker Alpine 镜像中编译困难；bcryptjs 是纯 JS 实现，零依赖，安装即用。盐轮数从默认的 10-12 降到 8，是因为服务器只有 2GB 内存，高轮数加密在并发注册时容易 OOM。对于非高安全要求的校园平台，8 轮足够。

#### Q14: 搜索功能用了索引吗？
A: 目前没有建 MongoDB 文本索引（text index），搜索用的是 `$regex` 模糊匹配。原因是用户量不大（校园场景），`$regex` 完全能满足需求。如果未来数据量增大，可以考虑在 `name`、`category`、`college` 上建复合索引或用 MongoDB Atlas Search 做全文检索。

---

### 📌 前端实现

#### Q15: 前端怎么处理加载态、空数据态和错误态的？
A: 每个数据加载组件都维护三种状态：`loading`（true/false）控制 Loading 组件（NewtonsCradle 动画）显示；`error` 用红色提示框展示错误信息；数据为空时显示对应的空状态文案。例如商品列表无数据时显示"暂无商品"，搜索结果为空时显示"没有找到相关商品"。分页数据也做了空判断——共 0 页时 Pagination 组件不渲染。

#### Q16: 为什么用 Context API 而不是 Redux？
A: 本项目全局状态只有认证信息（user + token），Context API 完全够用，不用引入 Redux 的样板代码和额外依赖。如果未来需要管理复杂的缓存、购物车本地持久化、请求状态缓存等场景，才考虑用 Redux Toolkit 或 Zustand。技术选型遵循"够用就好"原则。

#### Q17: 图片懒加载怎么实现的？
A: 用 IntersectionObserver API。在 ProductCard 组件中，图片标签 `ref` 注册观察者，当图片进入视口 200px 范围内（`rootMargin: "200px"`）时，才将 `src` 设为真实图片 URL。这样首屏只加载可见区域的图片，大幅减少网络请求和渲染开销。IntersectionObserver 是浏览器原生 API，比 scroll 事件监听性能好得多。

#### Q18: 响应式布局怎么做适配的？
A: 全部用 Tailwind 的响应式断点：`sm`（640px）、`md`（768px）、`lg`（1024px）、`xl`（1280px）。商品列表 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`。移动端导航栏折叠为汉堡菜单（DrawerMenu），搜索框显示为图标按钮点击展开。表单在小屏幕上宽度自适应 `w-full`。

#### Q19: 搜索防抖 + composition 事件是怎么回事？
A: 中文拼音输入时，用户拼完拼音选字的过程中（compositionstart → compositionend），防抖不应该触发搜索，否则会发送不完整的拼音查询。做法是：在 `compositionstart` 时设置一个标志 `isComposing = true`，此时 `onChange` 不触发防抖；`compositionend` 时重置为 false 并手动触发一次防抖。Enter 键不受影响，任何时候立即搜索。防抖延迟设为 800ms，平衡响应速度和查询频率。

#### Q20: 购物车在导航栏的角标数字怎么保持同步？
A: 购物车数据在 UserProfile 挂载时获取，Navbar 组件的购物车角标通过 `localStorage` 缓存购物车数量，或者从 UserProfile 的购物车数据派生。当用户添加/修改/删除购物车时，API 返回更新后的完整购物车数据，前端同步更新 localStorage 和 UI。还有一个更健壮的方式是在 authContext 里存 cartCount 并提供一个全局的刷新方法。

---

### 📌 数据库与数据模型

#### Q21: 购物车为什么嵌入 User 而不单独建表？
A: 两个原因：1）一个用户只有一个购物车，文档嵌入避免了额外查询——获取用户信息时购物车数据就带上了；2）购物车数据没有独立的业务生命周期，它永远是用户的一部分。缺点是购物车中的商品信息需要通过 populate 查询，但这个是 MongoDB 原生支持的。如果未来购物车功能复杂（优惠券、失效商品自动清理等），可能需要拆成独立集合。

#### Q22: uploadedBy 为什么不直接用 ref 引用 User？
A: 用嵌入子文档 `{ id, name, college }` 而不是 `{ type: ObjectId, ref: "User" }`，因为商品列表页需要展示发布者名字和学校，如果用 ref 则每次查商品都要额外 query 或者 populate 用户表，增加查询开销。缺点是用户改了名字或学校后，历史商品的 uploadedBy 不会同步更新——但这个在二手交易场景可以接受，商品发布时的卖家信息是历史快照。

#### Q23: Decimal128 的价格在前端怎么处理的？遇到什么问题？
A: MongoDB 的 Decimal128 在 toJSON 序列化时会被转为 `{ $numberDecimal: "99.99" }`（BSON 格式），前端 JS 不能直接当数字用。虽然 Mongoose Schema 可以定义 toJSON transform 自动转换，但 populate 场景下 transform 不生效。所以解决方案是**双保险**：后端每个 API 返回前显式 `Number(productObj.price) || 0` 转换，前端用 `Number(product.price ?? 0)` 兜底。

#### Q24: 数据库建了哪些索引？
A: 目前主要索引是 Product 的 createdAt 字段（默认，用于按时间排序的商品列表查询）。其他字段（category、college 等）因为数据量小且查询会配合其他条件，没有单独建索引。如果性能瓶颈出现，会在 `category + createdAt` 和 `college + createdAt` 上建复合索引。

#### Q25: 用户删除后，他的商品怎么处理？
A: 不物理删除。`userController.deleteUser` 中调用 `Product.updateMany({ "uploadedBy.id": userId }, { $set: { status: "inactive" } })`，将用户的所有商品标记为 `inactive` 状态。这些商品不再出现在列表页和搜索结果中，但数据库记录保留，购买历史可追溯。购物车 API 在 populate 商品时也能过滤掉 inactive 商品。

---

### 📌 AI 功能深度

#### Q26: AI 功能用的是什么 Prompt？讲一下 Prompt Engineering 的思路。
A: 两个 System Prompt：
- **生成描述**：`"你是一个二手商品描述生成助手。请根据商品名称和分类，生成一段 100-200 字的二手商品描述..."`。限定字数、要求包含"成色说明"、引导写"诱人细节"但避免过度夸张。
- **推荐分类**：`"你是一个二手商品分类助手。请从以下列表中选择最合适的分类，只返回英文单词：electronics, furniture, clothing, books, sports, food, transportation, beauty, home, other"`。强制限定输出格式，结果直接用于后端处理。
Prompt 设计原则：给角色、给任务、给输出格式约束。

#### Q27: 为什么选通义千问（qwen-plus）而不是 GPT 或 DeepSeek？
A: 通义千问的 dashscope API 在国内访问速度和稳定性最好，并且有免费额度，适合学生项目。qwen-plus 模型在中文场景下效果优秀，生成的商品描述自然通顺。阿里云在国内备案和合规方面也最完善。如果追求更低的成本可以用 qwen-turbo，如果追求更强的理解能力可以用 qwen-max。

#### Q28: AI 功能有没有做错误处理？如果 API 调用失败怎么办？
A: aiController 中整个调用用 try-catch 包裹，如果 dashscope API 报错（网络问题、配额超限、模型无响应等），catch 中返回 500 加具体错误信息。前端 AddProduct.js 中按钮点击后显示"正在生成..."加载状态，失败时显示红色错误提示。因为这是辅助功能，不影响核心业务流程——用户仍然可以手动输入描述和选择分类。

#### Q29: 商品推荐的 AI 标签是真的 AI 算的还是规则引擎？
A: 目前是规则引擎（五级漏斗），但前端渲染为"🤖 智能推荐"并带 AI 徽标。`aiReason` 字段如"同类商品AI智能匹配"是预设文案，不是大模型实时生成的。这样做的原因：1）实时调用大模型做推荐延迟高、成本高；2）规则引擎在校园集市这种简单场景下效果已经很好。真正的 AI 推荐（大模型个性化排序）是第二阶段的优化方向。

---

### 📌 安全

#### Q30: 项目有哪些安全措施？
A: 1）密码 bcryptjs 8 轮哈希，不存明文；2）JWT 令牌认证，密钥从环境变量读取；3）前后端双重输入校验（XSS 防御）；4）用户不能操作他人的数据（权限检查）；5）CORS 限制跨域来源；6）Multer 限制上传大小和数量；7）图片文件不存数据库；8）.env 文件管理密钥不提交 Git。

#### Q31: 如何防止 XSS 攻击？
A: 主要靠 React 的默认行为——React 在 JSX 中渲染文本时自动对 HTML 字符进行转义。`dangerouslySetInnerHTML` 在整个项目中从未使用。后端 input 也做校验（邮箱格式、手机号正则、价格正数等）。图片上传只接受常见图片格式（通过文件扩展名和 MIME type）。

#### Q32: 密码怎么存储的？为什么用 bcrypt 而不是 MD5 或 SHA？
A: 注册时 `bcryptjs.hash(password, 8)` 生成带 salt 的哈希值（格式如 `$2a$08$...`），数据库中存这个哈希。登录时 `bcryptjs.compare(inputPassword, storedHash)` 比对。MD5/SHA 是快速哈希，针对大量密码可以并行爆破，bcrypt 是慢速哈希（设计上就慢），能有效抵御彩虹表和暴力破解。salt 轮数越高越慢越安全，在服务器 2GB 内存限制下 8 轮是性能和安全的平衡点。

#### Q33: JWT 密钥怎么管理的？
A: 密钥统一在 `Server/config/auth.js` 中从 `process.env.JWT_SECRET` 读取，通过 `.env` 文件注入。.env 在 .gitignore 中，不会提交到 Git 仓库。服务器部署时需要在项目目录下手动创建 `.env` 文件，Docker Compose 的 `environment` 段通过 `${JWT_SECRET}` 变量引用。这样密钥不暴露在代码中，即使仓库被泄露也不影响线上安全。

---

### 📌 部署与运维

#### Q34: Docker Compose 的三个容器之间怎么通信的？
A: 三个容器在同一个 bridge 网络（`second-hand-network`）中，通过服务名互相访问：前端 Nginx 配置中 `proxy_pass http://backend:8000`（用容器名 backend）；后端用 `mongodb://second-hand-mongodb:27017`（用容器名连接 MongoDB）。对外只暴露前端的 5000 端口，数据库和后端都不直接暴露。

#### Q35: Nginx 反向代理配了什么？
A: 主要配置：`location /api/` → `proxy_pass http://backend:8000/api/`（API 请求），`location /uploads/` → `proxy_pass http://backend:8000/uploads/`（静态图片），`location /` → `root /usr/share/nginx/html` 返回前端构建的静态页面。同时配置了 `client_max_body_size 20M` 允许大文件上传，`proxy_set_header Host $host` 保证后端能正确识别请求来源。

#### Q36: 如果 MongoDB 容器挂了会怎样？
A: 后端依赖 MongoDB，连接失败时 Express 会挂起（500 错误）。Docker 中可以用 `restart: always` 策略让容器崩溃后自动重启。更健壮的做法是在 `db.js` 中添加连接重试机制（mongoose.connect 设置 `serverSelectionTimeoutMS: 5000` 并在 catch 中延迟重试）。目前项目中 MongoDB 有 `restart: unless-stopped`，崩溃后会自动恢复。

#### Q37: 部署流程是什么样的？
A: 1）本地 `cd Client && npm run build` 构建前端；2）Git 提交推送代码（含 build/ 目录）；3）SSH 登录服务器；4）`git pull` 拉取最新代码；5）确认 `.env` 存在；6）`docker compose up -d --build` 重建容器。整个过程不需要登录服务器构建前端，避免 2GB 内存 OOM。

---

### 📌 业务逻辑与边界情况

#### Q38: 购物车批量结算时，部分商品库存不足怎么处理？
A: `checkoutCart` 遍历购物车中的每个商品，逐个执行 `findOneAndUpdate` 原子操作。成功购买的商品从购物车中移除并加入返回结果的 `success` 数组；失败的商品保留在购物车中并返回失败原因（库存不足/已售罄/不能买自己的等）。前端收到结果后，显示"成功购买 X 件商品，Y 件失败"的总结信息，用户可以看到哪些商品购买失败了。

#### Q39: 如果用户同时打开两个页面，同时购买同一件商品会怎样？
A: 由于 MongoDB 的 `findOneAndUpdate` 配合 `$inc` 是原子操作，两个请求不会出现都看到库存为 1 然后都买成功的情况。查询条件中 `quantity: { $gt: 0 }` 确保只能买到有库存的商品。如果两个请求几乎同时到达 MongoDB，数据库层会串行化执行，第一个请求成功（库存减 1），第二个请求查询条件不满足（库存已为 0），返回 null。这样最多只卖出去 1 件。

#### Q40: 商品状态有几种？怎么流转的？
A: 三种状态：`unsold`（默认，上架中）、`sold`（已售出，库存为 0 但仍有剩余）、`sold_out`（全部售罄）、`inactive`（用户删除/下架）。流转路径：创建 → `unsold` → 购买成功 → 库存>0 保持 `unsold`，库存=0 变为 `sold`。用户手动下架可设为 `inactive`。用户账号删除时所有商品批量变为 `inactive`。

#### Q41: 发布商品时为什么图片和商品信息分两次提交？
A: 因为图片上传（POST /api/upload）是文件上传，走 multer 中间件；商品信息（POST /api/products）是 JSON 数据。把图片上传和商品创建分开，用户体验更好——先选图上传拿到 URL，再填信息提交。同时方便前端的图片预览和重选。

#### Q42: 商品规格是怎么实现的？为什么用嵌入数组？
A: Product 模型中 `specifications: [{ key: String, value: String }]` 是一个嵌入子文档数组。用户点击"添加规格"按钮后动态增加 key-value 输入对。用嵌入数组的好处是 Schema 灵活，不同品类商品可以有不同的规格键名（如手机可加"存储容量：256G"，衣服可加"尺码：M"）。如果未来需要按规格值搜索，才考虑拆成独立集合。

#### Q43: 为什么 phoneNo 的正则排除 100、102 号段？哪些手机号会被拦截？
A: 正则 `/^1[3-9]\d{9}$/` 要求第一位是 1，第二位是 3-9 的数字，后面 9 位任意数字。这意味着：虚拟运营商号码（如 170、171）和物联网号段（如 144、154）会被拦截。这是为了过滤无效或非标准手机号，校园场景下学生用的常规手机号（13x/15x/18x 等）不会被误拦。

---

### 📌 未来优化方向

#### Q44: 如果让你继续优化这个项目，你最想加什么功能？
A: 按优先级：1）真正的 AI 推荐——用大模型分析用户行为和商品特征做个性化排序（不再是固定规则引擎）；2）即时通讯——买家和卖家在线聊天，类似闲鱼；3）支付集成——接入微信支付/支付宝，不再需要线下交易；4）管理后台——商品审核、数据统计、用户管理；5）性能优化——MongoDB 文本索引、图片 CDN、前端懒加载路由拆分。

#### Q45: 项目现在的瓶颈在哪？
A: 主要有三个：1）图片服务——图片存服务器本地磁盘，没有 CDN，多用户并发访问可能变慢；2）`$regex` 搜索——没有索引，数据量增大后搜索速度下降；3）单节点部署——所有服务在一台 2GB 内存的服务器上，没有水平扩展能力。如果用户量增长，最优先的优化是加 MongoDB 文本索引、把图片迁移到 OSS/CDN。

---

## 附录：项目文件速查

```
d:\Second-Hand-main\
├── docker-compose.yml          # Docker 编排
├── PROJECT_SUMMARY.md           # 项目文档（含API和模型说明）
├── CHANGELOG.md                 # 版本历史
├── Client/                      # 前端
│   ├── Dockerfile               # nginx:alpine
│   ├── nginx.conf               # 反向代理配置
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js               # 路由配置
│       ├── index.js             # 入口
│       ├── index.css            # Tailwind 指令
│       ├── context/
│       │   └── authContext.js   # 认证上下文
│       └── components/          # 全部组件
└── Server/
    ├── Dockerfile               # node:18-alpine
    ├── server.js                # 入口
    ├── config/
    │   ├── db.js                # MongoDB 连接
    │   └── auth.js              # JWT + bcrypt
    ├── middleware/
    │   └── authMiddleware.js    # JWT 认证
    ├── models/
    │   ├── User.js              # 用户模型
    │   └── Product.js           # 商品模型
    ├── controllers/
    │   ├── userController.js
    │   ├── productController.js   # + 推荐引擎
    │   ├── aiController.js
    │   ├── cartController.js      # 购物车
    │   └── uploadController.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── productRoutes.js
    │   ├── aiRoutes.js
    │   ├── cartRoutes.js          # 购物车路由
    │   └── uploadRoutes.js
    └── services/
        └── aiService.js           # 通义千问调用
```
